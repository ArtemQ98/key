package main

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ============== CREATE BOOKING (customer) ==============

func (a *App) bookings(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	if r.Context().Value(ctxKey("role")) != "customer" {
		write(w, 403, map[string]string{"error": "customer access required"})
		return
	}
	var in struct {
		CarID           int64  `json:"car_id"`
		StartsAt        string `json:"starts_at"`
		EndsAt          string `json:"ends_at"`
		PickupLocation  string `json:"pickup_location"`
		DropoffLocation string `json:"dropoff_location"`
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	st, en, err := parseBookingTimes(in.StartsAt, in.EndsAt)
	if err != nil {
		write(w, 422, map[string]string{"error": "укажите корректные даты аренды"})
		return
	}
	loc := time.FixedZone("MSK", 3*60*60)
	today := time.Now().In(loc).Format("2006-01-02")
	startDay := st.In(loc).Format("2006-01-02")

	if startDay < today {
		write(w, 422, map[string]string{"error": "дата начала уже прошла"})
		return
	}
	tx, err := a.db.Begin(r.Context())
	if err != nil {
		write(w, 500, map[string]string{"error": "transaction error"})
		return
	}
	defer tx.Rollback(r.Context())
	var ownerID int64
	var carName string
	var price, deposit float64
	var status string
	err = tx.QueryRow(r.Context(),
		`SELECT owner_id, brand||' '||model, daily_price, deposit, status
		FROM cars WHERE id=$1 AND public_enabled FOR UPDATE`,
		in.CarID).Scan(&ownerID, &carName, &price, &deposit, &status)
	if err != nil {
		write(w, 404, map[string]string{"error": "автомобиль не найден"})
		return
	}
	// Машина на сервисе — бронировать нельзя.
	if status == "maintenance" {
		write(w, 409, map[string]string{"error": "автомобиль на обслуживании"})
		return
	}
	var overlap bool
	err = tx.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM rentals WHERE car_id=$1 AND status IN ('hold','pending','confirmed','active') AND (status<>'hold' OR hold_expires_at IS NULL OR hold_expires_at>now()) AND starts_at < $3 AND ends_at > $2)`, in.CarID, st, en).Scan(&overlap)
	if err != nil {
		write(w, 500, map[string]string{"error": "не удалось проверить доступность"})
		return
	}
	if overlap {
		write(w, 409, map[string]string{"error": "эти даты уже заняты"})
		return
	}
	days := int(math.Ceil(en.Sub(st).Hours() / 24))
	if days < 1 {
		days = 1
	}
	subtotal := price * float64(days)
	customer := userID(r.Context())
	var id int64
	err = tx.QueryRow(r.Context(), `INSERT INTO rentals(owner_id,car_id,client_user_id,car_name,client_name,client_phone,status,amount,subtotal,deposit,starts_at,ends_at,source,payment_status,pickup_location,dropoff_location,hold_expires_at) SELECT $1,$2,$3,$4,u.name,u.phone,'pending',$5,$5,$6,$7,$8,'marketplace','unpaid',$9,$10,now() + interval '24 hours' FROM users u WHERE u.id=$3 RETURNING id`, ownerID, in.CarID, customer, carName, subtotal, deposit, st, en, first(in.PickupLocation, ""), first(in.DropoffLocation, "")).Scan(&id)
	if err != nil {
		write(w, 500, map[string]string{"error": "не удалось создать бронирование"})
		return
	}
	code := fmt.Sprintf("KEY-%06d", id)
	_, _ = tx.Exec(r.Context(), `UPDATE rentals SET booking_code=$1,final_total=$2,updated_at=now() WHERE id=$3`, code, subtotal, id)
	_, _ = tx.Exec(r.Context(), `INSERT INTO rental_events(rental_id,actor_id,actor_role,event_type,from_status,to_status,payload) VALUES($1,$2,'customer','booking_created',NULL,'pending',$3::jsonb)`, id, customer, mustJSON(map[string]any{"source": "marketplace"}))
	if deposit > 0 {
		_, _ = tx.Exec(r.Context(), `INSERT INTO deposit_transactions(rental_id,transaction_type,amount,note) VALUES($1,'hold',$2,'Депозит по бронированию')`, id, deposit)
	}
	if err = tx.Commit(r.Context()); err != nil {
		write(w, 500, map[string]string{"error": "не удалось подтвердить бронь"})
		return
	}

	// Уведомление владельцу о новой заявке
	_ = a.createNotification(r.Context(), ownerID, id,
		"Новая заявка на бронь",
		fmt.Sprintf("%s · %s — %s", carName, st.Format("02.01"), en.Format("02.01")))

	write(w, 201, map[string]any{"id": id, "booking_code": code, "status": "pending", "car": carName, "starts_at": st, "ends_at": en, "subtotal": subtotal, "deposit": deposit, "payment_status": "unpaid"})
}

// ============== LIST CUSTOMER BOOKINGS ==============

func (a *App) customerBookings(w http.ResponseWriter, r *http.Request) {
	if r.Context().Value(ctxKey("role")) != "customer" {
		write(w, 403, map[string]string{"error": "customer access required"})
		return
	}
	rows, err := a.db.Query(r.Context(), `SELECT r.id,COALESCE(r.booking_code,''),r.car_name,r.status,r.amount,r.deposit,r.starts_at,r.ends_at,COALESCE(fp.title,''),COALESCE(fp.city,''),r.payment_status,r.pickup_meeting_at,r.pickup_meeting_location,r.return_meeting_at,r.return_meeting_location,r.hold_expires_at FROM rentals r LEFT JOIN cars c ON c.id=r.car_id LEFT JOIN fleet_profiles fp ON fp.owner_id=r.owner_id WHERE r.client_user_id=$1 ORDER BY r.starts_at DESC NULLS LAST,r.id DESC`, userID(r.Context()))
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var code, car, status, fleet, city, payment string
		var amount, deposit float64
		var st, en, pickupMeeting, returnMeeting *time.Time
		var pickupLocation, returnLocation string
		var holdExpiresAt *time.Time
		if rows.Scan(&id, &code, &car, &status, &amount, &deposit, &st, &en, &fleet, &city, &payment, &pickupMeeting, &pickupLocation, &returnMeeting, &returnLocation, &holdExpiresAt) == nil {
			out = append(out, map[string]any{"id": id, "booking_code": code, "car": car, "status": status, "amount": amount, "deposit": deposit, "starts_at": st, "ends_at": en, "fleet": fleet, "city": city, "payment_status": payment, "pickup_meeting_at": pickupMeeting, "pickup_meeting_location": pickupLocation, "return_meeting_at": returnMeeting, "return_meeting_location": returnLocation, "hold_expires_at": holdExpiresAt})
		}
	}
	write(w, 200, out)
}

// ============== PATCH BOOKING BY ID (customer cancel / owner transition) ==============

func (a *App) bookingByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/bookings/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	if r.Method != "PATCH" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct{ Status, Reason string }
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	role, _ := r.Context().Value(ctxKey("role")).(string)

	// === CUSTOMER: только отмена ===
	if role == "customer" {
		if in.Status != "cancelled" {
			write(w, 422, map[string]string{"error": "customer can only cancel"})
			return
		}
		var ownerID int64
		if err := a.db.QueryRow(r.Context(), `SELECT owner_id FROM rentals WHERE id=$1 AND client_user_id=$2 AND status IN ('hold','pending','confirmed')`, id, userID(r.Context())).Scan(&ownerID); err != nil {
			write(w, 404, map[string]string{"error": "бронирование не найдено или уже началось"})
			return
		}
		if err := a.transitionRental(r.Context(), id, userID(r.Context()), "customer", "cancelled", in.Reason); err != nil {
			write(w, 409, map[string]string{"error": err.Error()})
			return
		}
		write(w, 200, map[string]bool{"ok": true})
		return
	}

	// === OWNER ===
	if role != "owner" {
		write(w, 403, map[string]string{"error": "access denied"})
		return
	}

	allowedOwnerStatuses := []string{
		"confirmed", "preparing", "active",
		"returned", "completed",
		"cancelled", "rejected",
	}
	if !contains(allowedOwnerStatuses, in.Status) {
		write(w, 422, map[string]string{"error": "invalid status"})
		return
	}

	if err := a.transitionRental(r.Context(), id, userID(r.Context()), "owner", in.Status, in.Reason); err != nil {
		code := 409
		switch {
		case errors.Is(err, errRentalNotFound):
			code = 404
		case strings.HasPrefix(err.Error(), "нельзя перевести"):
			code = 422
		}
		write(w, code, map[string]string{"error": err.Error()})
		return
	}

	write(w, 200, map[string]bool{"ok": true})
}

// ============== GET CUSTOMER BOOKING BY ID ==============

func (a *App) customerBookingByID(w http.ResponseWriter, r *http.Request) {
	if r.Context().Value(ctxKey("role")) != "customer" {
		write(w, 403, map[string]string{"error": "customer access required"})
		return
	}
	if r.Method != "GET" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/customer/bookings/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}

	var (
		car, status, fleet, city, payment, code string
		amount, deposit                         float64
		st, en, pickupMeeting, returnMeeting, holdExpiresAt    *time.Time
		pickupLocation, returnLocation          string
		ownerID                                 int64
	)
	
	err = a.db.QueryRow(r.Context(), `
		SELECT r.id, COALESCE(r.booking_code,''), r.car_name, r.status,
			r.amount, r.deposit, r.starts_at, r.ends_at,
			COALESCE(fp.title,''), COALESCE(fp.city,''),
			r.payment_status,
			r.pickup_meeting_at, r.pickup_meeting_location,
			r.return_meeting_at, r.return_meeting_location,
			r.owner_id,
			r.hold_expires_at
		FROM rentals r
		LEFT JOIN fleet_profiles fp ON fp.owner_id = r.owner_id
		WHERE r.id=$1 AND r.client_user_id=$2
	`, id, userID(r.Context())).Scan(
		&id, &code, &car, &status,
		&amount, &deposit, &st, &en,
		&fleet, &city,
		&payment,
		&pickupMeeting, &pickupLocation,
		&returnMeeting, &returnLocation,
		&ownerID,
		&holdExpiresAt,
	)
	if err != nil {
		write(w, 404, map[string]string{"error": "бронирование не найдено"})
		return
	}

	// События из rental_events
	rows, err := a.db.Query(r.Context(), `
		SELECT id, event_type, COALESCE(from_status,''), COALESCE(to_status,''),
		       actor_role, payload, created_at
		FROM rental_events
		WHERE rental_id=$1
		ORDER BY created_at ASC, id ASC
	`, id)
	if err != nil {
		write(w, 500, map[string]string{"error": "events query failed"})
		return
	}
	defer rows.Close()

	events := []map[string]any{}
	for rows.Next() {
		var eid int64
		var etype, from, to, actor string
		var payload []byte
		var createdAt time.Time
		if rows.Scan(&eid, &etype, &from, &to, &actor, &payload, &createdAt) == nil {
			events = append(events, map[string]any{
				"id":          eid,
				"event_type":  etype,
				"from_status": from,
				"to_status":   to,
				"actor_role":  actor,
				"payload":     nullableJSON(payload),
				"created_at":  createdAt,
			})
		}
	}

	write(w, 200, map[string]any{
		"id":                      id,
		"booking_code":            code,
		"car":                     car,
		"status":                  status,
		"amount":                  amount,
		"deposit":                 deposit,
		"starts_at":               st,
		"ends_at":                 en,
		"fleet":                   fleet,
		"city":                    city,
		"payment_status":          payment,
		"pickup_meeting_at":       pickupMeeting,
		"pickup_meeting_location": pickupLocation,
		"return_meeting_at":       returnMeeting,
		"return_meeting_location": returnLocation,
		"hold_expires_at":         holdExpiresAt,
		"events":                  events,
	})
}