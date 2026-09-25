package main

import (
	"context"
	"log"
	"strconv"
	"time"
)

// startStatusNotifyCron запускает фоновую отправку email/push о системных
// уведомлениях (новые заявки, смена статуса).
func (a *App) startStatusNotifyCron(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()

	a.runStatusNotify(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.runStatusNotify(ctx)
		}
	}
}

func (a *App) runStatusNotify(ctx context.Context) {
	rows, err := a.db.Query(ctx, `
		SELECT
			n.id,
			n.user_id,
			COALESCE(n.rental_id, 0),
			n.title,
			n.message,
			COALESCE(u.email, ''),
			u.role
		FROM user_notifications n
		JOIN users u ON u.id = n.user_id
		WHERE n.notified_at IS NULL
		  AND n.is_read = FALSE
		  AND n.created_at < now() - interval '1 minute'
		LIMIT 100
	`)
	if err != nil {
		log.Printf("status notify query: %v", err)
		return
	}
	defer rows.Close()

	type pending struct {
		id       int64
		userID   int64
		rentalID int64
		title    string
		message  string
		email    string
		role     string
	}

	var list []pending
	for rows.Next() {
		var p pending
		if err := rows.Scan(
			&p.id, &p.userID, &p.rentalID,
			&p.title, &p.message,
			&p.email, &p.role,
		); err != nil {
			continue
		}
		list = append(list, p)
	}
	rows.Close()

	for _, p := range list {
		// Email
		if p.email != "" {
			if err := sendStatusNotification(p.email, p.title, p.message, p.role == "owner", p.rentalID); err != nil {
				log.Printf("status notify email #%d: %v", p.id, err)
			}
		}

		// Push
		externalID := strconv.FormatInt(p.userID, 10)
		if err := sendStatusPush(externalID, p.title, p.message, p.role == "owner", p.rentalID); err != nil {
			log.Printf("status notify push #%d: %v", p.id, err)
		}

		_, _ = a.db.Exec(ctx,
			`UPDATE user_notifications SET notified_at = now() WHERE id = $1`, p.id)
		log.Printf("status notify #%d processed", p.id)
	}
}