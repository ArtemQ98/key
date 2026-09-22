package main

import (
	"context"
	"log"
	"time"
)

// startChatNotifyCron запускает фоновую отправку email о непрочитанных сообщениях.
// Раз в 2 минуты проверяет сообщения, не прочитанные более 10 минут.
func (a *App) startChatNotifyCron(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Первый прогон сразу, чтобы не ждать 2 минуты при старте.
	a.runChatNotify(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.runChatNotify(ctx)
		}
	}
}

func (a *App) runChatNotify(ctx context.Context) {
	rows, err := a.db.Query(ctx, `
		SELECT
			m.id,
			m.body,
			m.sender_role,
			COALESCE(r.booking_code, ''),
			r.car_name,
			uo.email AS owner_email,
			uo.name  AS owner_name,
			uc.email AS customer_email,
			uc.name  AS customer_name
		FROM rental_messages m
		JOIN rentals r ON r.id = m.rental_id
		JOIN users uo ON uo.id = r.owner_id
		LEFT JOIN users uc ON uc.id = r.client_user_id
		WHERE m.read_at IS NULL
		  AND m.notified_at IS NULL
		  AND m.created_at < now() - interval '3 minutes'
		LIMIT 100
	`)
	if err != nil {
		log.Printf("chat notify query: %v", err)
		return
	}
	defer rows.Close()

	type pending struct {
		id            int64
		body          string
		senderRole    string
		bookingCode   string
		carName       string
		ownerEmail    string
		ownerName     string
		customerEmail *string
		customerName  *string
	}

	var list []pending
	for rows.Next() {
		var p pending
		if err := rows.Scan(
			&p.id, &p.body, &p.senderRole,
			&p.bookingCode, &p.carName,
			&p.ownerEmail, &p.ownerName,
			&p.customerEmail, &p.customerName,
		); err != nil {
			continue
		}
		list = append(list, p)
	}
	rows.Close()

	for _, p := range list {
		var to, senderName string
		var isOwner bool

		switch p.senderRole {
		case "customer":
			if p.ownerEmail == "" {
				continue
			}
			to = p.ownerEmail
			senderName = derefOr(p.customerName, "Клиент")
			isOwner = true
		case "owner":
			if p.customerEmail == nil || *p.customerEmail == "" {
				continue
			}
			to = *p.customerEmail
			senderName = derefOr(&p.ownerName, "Владелец")
			isOwner = false
		default:
			// system или неизвестный — не уведомляем
			continue
		}

		if err := sendChatNotification(to, p.carName, p.bookingCode, senderName, p.body, isOwner); err != nil {
			log.Printf("chat notify send #%d: %v", p.id, err)
			continue
		}

		_, _ = a.db.Exec(ctx,
			`UPDATE rental_messages SET notified_at = now() WHERE id = $1`, p.id)
		log.Printf("chat notify sent #%d to %s", p.id, to)
	}
}

func derefOr(p *string, def string) string {
	if p == nil || *p == "" {
		return def
	}
	return *p
}