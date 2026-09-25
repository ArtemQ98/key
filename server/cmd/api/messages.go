package main

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// === Типы ответов ===

type MessageItem struct {
	Kind       string  `json:"kind"` // "event" | "message"
	ID         int64   `json:"id"`
	SenderID   *int64  `json:"sender_id,omitempty"`
	SenderRole string  `json:"sender_role,omitempty"`
	Body       string  `json:"body,omitempty"`
	ReadAt     *string `json:"read_at,omitempty"`
	EventType  string  `json:"event_type,omitempty"`
	FromStatus string  `json:"from_status,omitempty"`
	ToStatus   string  `json:"to_status,omitempty"`
	ActorRole  string  `json:"actor_role,omitempty"`
	Payload    string  `json:"payload,omitempty"`
	CreatedAt  string  `json:"created_at"`
}

type ThreadResponse struct {
	Items       []MessageItem `json:"items"`
	UnreadCount int           `json:"unread_count"`
}

// === Доступ к аренде ===

type rentalAccess struct {
	OwnerID        int64
	ClientUserID   *int64
	Status         string
	CompletedAt    *time.Time
}

type SystemNotification struct {
    ID        int64  `json:"id"`
    Title     string `json:"title"`
    Message   string `json:"message"`
    CreatedAt string `json:"created_at"`
}

func (a *App) getRentalAccess(ctx context.Context, rentalID int64) (rentalAccess, error) {
	var ra rentalAccess
	err := a.db.QueryRow(ctx, `
		SELECT owner_id, client_user_id, status, returned_at
		FROM rentals WHERE id=$1
	`, rentalID).Scan(&ra.OwnerID, &ra.ClientUserID, &ra.Status, &ra.CompletedAt)
	return ra, err
}

// canAccessRental возвращает роль пользователя в этой аренде или "" если доступа нет.
func (a *App) canAccessRental(ctx context.Context, rentalID, userID int64) (string, bool) {
	ra, err := a.getRentalAccess(ctx, rentalID)
	if err != nil {
		return "", false
	}
	if ra.OwnerID == userID {
		return "owner", true
	}
	if ra.ClientUserID != nil && *ra.ClientUserID == userID {
		return "customer", true
	}
	return "", false
}

// canWrite проверяет окно «пока аренда активна + 7 дней после completed».
func canWrite(status string, completedAt *time.Time) bool {
	switch status {
	case "cancelled", "rejected", "expired":
		return false
	case "completed":
		if completedAt == nil {
			return true
		}
		return time.Since(*completedAt) <= 7*24*time.Hour
	default:
		return true
	}
}

// === Handlers ===

// GET /api/rental-messages/{id}
func (a *App) rentalMessages(w http.ResponseWriter, r *http.Request) {
	rentalID, err := parseIDFromPath(r.URL.Path, "/api/rental-messages/")
	if err != nil {
		write(w, 400, map[string]string{"error": "invalid rental id"})
		return
	}
	userID := userID(r.Context())
	role, ok := a.canAccessRental(r.Context(), rentalID, userID)
	if !ok {
		write(w, 403, map[string]string{"error": "access denied"})
		return
	}

	ctx := r.Context()

	// 1. Объединённый поток: события + сообщения, по возрастанию времени.
	rows, err := a.db.Query(ctx, `
		SELECT kind, id, sender_id, sender_role, body, read_at,
		       event_type, from_status, to_status, actor_role, payload, created_at
		FROM (
			SELECT 'event' AS kind,
			       e.id,
			       NULL::BIGINT AS sender_id,
			       ''::TEXT AS sender_role,
			       ''::TEXT AS body,
			       NULL::TIMESTAMPTZ AS read_at,
			       e.event_type,
			       COALESCE(e.from_status,'') AS from_status,
			       COALESCE(e.to_status,'')   AS to_status,
			       e.actor_role,
			       e.payload::text AS payload,
			       e.created_at
			FROM rental_events e
			WHERE e.rental_id = $1

			UNION ALL

			SELECT 'message' AS kind,
			       m.id,
			       m.sender_id,
			       m.sender_role,
			       m.body,
			       m.read_at,
			       ''::TEXT AS event_type,
			       ''::TEXT AS from_status,
			       ''::TEXT AS to_status,
			       ''::TEXT AS actor_role,
			       ''::TEXT AS payload,
			       m.created_at
			FROM rental_messages m
			WHERE m.rental_id = $1
		) t
		ORDER BY created_at ASC, kind DESC, id ASC
	`, rentalID)
	if err != nil {
		write(w, 500, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	items := make([]MessageItem, 0, 32)
	for rows.Next() {
		var it MessageItem
		var readAt *time.Time
		var createdAt time.Time
		if err := rows.Scan(
			&it.Kind, &it.ID, &it.SenderID, &it.SenderRole, &it.Body, &readAt,
			&it.EventType, &it.FromStatus, &it.ToStatus, &it.ActorRole, &it.Payload,
			&createdAt,
		); err != nil {
			write(w, 500, map[string]string{"error": "scan failed"})
			return
		}
		if readAt != nil {
			s := readAt.UTC().Format(time.RFC3339)
			it.ReadAt = &s
		}
		it.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		items = append(items, it)
	}

	// 2. Непрочитанные от противоположной стороны.
	var unread int
	_ = a.db.QueryRow(ctx, `
		SELECT count(*) FROM rental_messages
		WHERE rental_id=$1 AND sender_role <> $2 AND read_at IS NULL
	`, rentalID, role).Scan(&unread)

	write(w, 200, ThreadResponse{Items: items, UnreadCount: unread})
}

// POST /api/rental-messages/{id}  { "body": "..." }
func (a *App) sendRentalMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	rentalID, err := parseIDFromPath(r.URL.Path, "/api/rental-messages/")
	if err != nil {
		write(w, 400, map[string]string{"error": "invalid rental id"})
		return
	}
	userID := userID(r.Context())
	role, ok := a.canAccessRental(r.Context(), rentalID, userID)
	if !ok {
		write(w, 403, map[string]string{"error": "access denied"})
		return
	}

	ra, _ := a.getRentalAccess(r.Context(), rentalID)
	if !canWrite(ra.Status, ra.CompletedAt) {
		write(w, 403, map[string]string{"error": "chat closed"})
		return
	}

	var in struct {
		Body string `json:"body"`
	}
	if err := decode(r, &in); err != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	in.Body = strings.TrimSpace(in.Body)
	if in.Body == "" {
		write(w, 400, map[string]string{"error": "empty message"})
		return
	}
	if len(in.Body) > 4000 {
		write(w, 400, map[string]string{"error": "message too long"})
		return
	}

	var id int64
	var createdAt time.Time
	err = a.db.QueryRow(r.Context(), `
		INSERT INTO rental_messages (rental_id, sender_id, sender_role, body)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, rentalID, userID, role, in.Body).Scan(&id, &createdAt)
	if err != nil {
		write(w, 500, map[string]string{"error": "insert failed"})
		return
	}

	write(w, 201, MessageItem{
		Kind:       "message",
		ID:         id,
		SenderID:   &userID,
		SenderRole: role,
		Body:       in.Body,
		CreatedAt:  createdAt.UTC().Format(time.RFC3339),
	})
}

// POST /api/rental-messages/{id}/read
func (a *App) markRentalMessagesRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	path := strings.TrimSuffix(r.URL.Path, "/read")
	rentalID, err := parseIDFromPath(path, "/api/rental-messages/")
	if err != nil {
		write(w, 400, map[string]string{"error": "invalid rental id"})
		return
	}
	userID := userID(r.Context())
	role, ok := a.canAccessRental(r.Context(), rentalID, userID)
	if !ok {
		write(w, 403, map[string]string{"error": "access denied"})
		return
	}

	_, err = a.db.Exec(r.Context(), `
		UPDATE rental_messages
		SET read_at = now()
		WHERE rental_id=$1 AND sender_role <> $2 AND read_at IS NULL
	`, rentalID, role)
	if err != nil {
		write(w, 500, map[string]string{"error": "update failed"})
		return
	}

	write(w, 200, map[string]any{"ok": true})
}

// GET /api/rental-messages/unread-count
// Возвращает { total, by_rental: { "<id>": n } }
func (a *App) rentalMessagesUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID := userID(r.Context())

	rows, err := a.db.Query(r.Context(), `
		SELECT m.rental_id, count(*)
		FROM rental_messages m
		JOIN rentals r ON r.id = m.rental_id
		WHERE m.read_at IS NULL
		  AND (
		        (r.owner_id = $1 AND m.sender_role = 'customer')
		     OR (r.client_user_id = $1 AND m.sender_role = 'owner')
		  )
		GROUP BY m.rental_id
	`, userID)
	if err != nil {
		write(w, 500, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	byRental := map[string]int{}
	total := 0
	for rows.Next() {
		var rid int64
		var n int
		if err := rows.Scan(&rid, &n); err != nil {
			continue
		}
		byRental[strconv.FormatInt(rid, 10)] = n
		total += n
	}

	write(w, 200, map[string]any{
		"total":     total,
		"by_rental": byRental,
	})
}

// === Helpers ===

func parseIDFromPath(path, prefix string) (int64, error) {
	rest := strings.TrimPrefix(path, prefix)
	rest = strings.TrimSuffix(rest, "/")
	if i := strings.IndexByte(rest, '/'); i >= 0 {
		rest = rest[:i]
	}
	return strconv.ParseInt(rest, 10, 64)
}

func (a *App) rentalMessagesRouter(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/read") {
		a.markRentalMessagesRead(w, r)
		return
	}
	switch r.Method {
	case http.MethodGet:
		a.rentalMessages(w, r)
	case http.MethodPost:
		a.sendRentalMessage(w, r)
	default:
		write(w, 405, map[string]string{"error": "method not allowed"})
	}
}

type UnreadNotification struct {
	RentalID     int64   `json:"rental_id"`
	BookingCode  string  `json:"booking_code"`
	CarName      string  `json:"car_name"`
	PeerName     string  `json:"peer_name"`
	LastBody     string  `json:"last_body"`
	LastAt       *string `json:"last_at"`
	UnreadCount  int     `json:"unread_count"`
}

// GET /api/notifications/unread
// Возвращает список тредов с непрочитанными сообщениями (для дропдауна уведомлений).
func (a *App) unreadNotifications(w http.ResponseWriter, r *http.Request) {
	uid := userID(r.Context())
	role, _ := r.Context().Value(ctxKey("role")).(string)
	if role != "owner" && role != "customer" {
		write(w, 403, map[string]string{"error": "access denied"})
		return
	}

	peerRole := "customer"
	if role == "customer" {
		peerRole = "owner"
	}

	rows, err := a.db.Query(r.Context(), `
		WITH last_msg AS (
			SELECT DISTINCT ON (rental_id)
			       rental_id, body, created_at
			FROM rental_messages
			WHERE sender_role = $2
			ORDER BY rental_id, created_at DESC, id DESC
		),
		unread AS (
			SELECT rental_id, count(*) AS n
			FROM rental_messages
			WHERE read_at IS NULL AND sender_role = $2
			GROUP BY rental_id
		)
		SELECT
			r.id,
			COALESCE(r.booking_code, ''),
			r.car_name,
			COALESCE(lm.body, ''),
			lm.created_at,
			COALESCE(u.n, 0),
			CASE WHEN r.owner_id = $1 THEN uc.name ELSE uo.name END
		FROM rentals r
		JOIN unread u ON u.rental_id = r.id
		LEFT JOIN last_msg lm ON lm.rental_id = r.id
		LEFT JOIN users uo ON uo.id = r.owner_id
		LEFT JOIN users uc ON uc.id = r.client_user_id
		WHERE (r.owner_id = $1 OR r.client_user_id = $1)
		  AND u.n > 0
		ORDER BY lm.created_at DESC NULLS LAST
		LIMIT 10
	`, uid, peerRole)
	if err != nil {
		write(w, 500, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	out := []UnreadNotification{}
	for rows.Next() {
		var n UnreadNotification
		var lastAt *time.Time
		var peerName *string
		if err := rows.Scan(
			&n.RentalID, &n.BookingCode, &n.CarName,
			&n.LastBody, &lastAt, &n.UnreadCount, &peerName,
		); err != nil {
			continue
		}
		if lastAt != nil {
			s := lastAt.UTC().Format(time.RFC3339)
			n.LastAt = &s
		}
		if peerName != nil {
			n.PeerName = *peerName
		} else {
			n.PeerName = "Пользователь"
		}
		out = append(out, n)
	}

	write(w, 200, out)
}

// GET /api/notifications/mine
func (a *App) myNotifications(w http.ResponseWriter, r *http.Request) {
    uid := userID(r.Context())
    rows, err := a.db.Query(r.Context(), `
        SELECT id, title, message, created_at
        FROM user_notifications
        WHERE user_id = $1 AND is_read = FALSE
        ORDER BY created_at DESC
        LIMIT 20
    `, uid)
    if err != nil {
        write(w, 500, map[string]string{"error": "query failed"})
        return
    }
    defer rows.Close()

    out := []SystemNotification{}
    for rows.Next() {
        var n SystemNotification
        var at time.Time
        if rows.Scan(&n.ID, &n.Title, &n.Message, &at) == nil {
            n.CreatedAt = at.UTC().Format(time.RFC3339)
            out = append(out, n)
        }
    }
    write(w, 200, out)
}

// POST /api/notifications/mine/read
func (a *App) markNotificationsRead(w http.ResponseWriter, r *http.Request) {
    uid := userID(r.Context())
    _, _ = a.db.Exec(r.Context(),
        `UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        uid)
    write(w, 200, map[string]bool{"ok": true})
}