package main

import (
	"context"
	"log"
	"strconv"
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
		m.rental_id,
		m.body,
		m.sender_role,
		COALESCE(r.booking_code, ''),
		r.car_name,
		r.owner_id,
		r.client_user_id,
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
		rentalID      int64
		body          string
		senderRole    string
		bookingCode   string
		carName       string
		ownerID       int64
    	clientUserID  *int64
		ownerEmail    string
		ownerName     string
		customerEmail *string
		customerName  *string
	}

	var list []pending
	for rows.Next() {
		var p pending
		if err := rows.Scan(
			&p.id,&p.rentalID, &p.body, &p.senderRole,
			&p.bookingCode, &p.carName,
			&p.ownerID, &p.clientUserID,
			&p.ownerEmail, &p.ownerName,
			&p.customerEmail, &p.customerName,
		); err != nil {
			continue
		}
		list = append(list, p)
	}
	rows.Close()

	for _, p := range list {
		// Определяем получателя и sender_name
		var to, senderName, recipientExternalID string
		var isOwner bool

		switch p.senderRole {
		case "customer":
			// сообщение от клиента → уведомляем владельца
			if p.ownerEmail == "" && p.ownerID == 0 {
				continue
			}
			to = p.ownerEmail
			senderName = derefOr(p.customerName, "Клиент")
			recipientExternalID = strconv.FormatInt(p.ownerID, 10)
			isOwner = true
		case "owner":
			// сообщение от владельца → уведомляем клиента
			if p.customerEmail == nil || *p.customerEmail == "" || p.clientUserID == nil {
				continue
			}
			to = *p.customerEmail
			senderName = p.ownerName
			recipientExternalID = strconv.FormatInt(*p.clientUserID, 10)
			isOwner = false
		default:
			continue
		}

		// Email
		if to != "" {
			if err := sendChatNotification(to, p.carName, p.bookingCode, senderName, p.body, isOwner); err != nil {
				log.Printf("chat notify email #%d: %v", p.id, err)
			}
		}

		// Push
		if recipientExternalID != "" {
			if err := sendChatPush(recipientExternalID, p.carName, p.bookingCode, senderName, p.body, isOwner, p.rentalID); err != nil {
				log.Printf("chat notify push #%d: %v", p.id, err)
			}
		}

		// Помечаем как обработанное
		_, _ = a.db.Exec(ctx,
			`UPDATE rental_messages SET notified_at = now() WHERE id = $1`, p.id)
		log.Printf("chat notify #%d processed", p.id)
	}
}

func derefOr(p *string, def string) string {
	if p == nil || *p == "" {
		return def
	}
	return *p
}