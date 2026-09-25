package main

import (
	"context"
	"log"
	"time"
)

// startRentalCrons запускает все фоновые задачи по жизненному циклу аренды:
//  1. Истечение необработанных заявок (раз в час).
//  2. Напоминание владельцу о предстоящей выдаче (раз в день).
//  3. Оповещение о просроченных активных арендах (раз в день).
func (a *App) startRentalCrons(ctx context.Context) {
	go a.expireHoldsLoop(ctx)
	go a.remindPickupLoop(ctx)
	go a.alertOverdueLoop(ctx)
}

// === 1. Истечение pending-заявок ===

func (a *App) expireHoldsLoop(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	a.expireHolds(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.expireHolds(ctx)
		}
	}
}

func (a *App) expireHolds(ctx context.Context) {
	type expired struct {
		id           int64
		ownerID      int64
		clientUserID *int64
		carName      string
		bookingCode  string
		reason       string
	}

	rows, err := a.db.Query(ctx, `
		UPDATE rentals
		SET status = 'expired', updated_at = now()
		WHERE status IN ('hold', 'pending')
		  AND (
		    (hold_expires_at IS NOT NULL AND hold_expires_at < now())
		    OR (starts_at < now())
		  )
		RETURNING id, owner_id, client_user_id, car_name,
		          COALESCE(booking_code, ''),
		          CASE
		            WHEN starts_at < now() THEN 'start_passed'
		            ELSE 'hold_timeout'
		          END
	`)
	if err != nil {
		log.Printf("expireHolds query: %v", err)
		return
	}
	defer rows.Close()

	var list []expired
	for rows.Next() {
		var e expired
		if err := rows.Scan(
			&e.id, &e.ownerID, &e.clientUserID,
			&e.carName, &e.bookingCode, &e.reason,
		); err != nil {
			continue
		}
		list = append(list, e)
	}
	rows.Close()

	for _, e := range list {
		// Записываем событие в историю
		_, _ = a.db.Exec(ctx, `
			INSERT INTO rental_events(rental_id, actor_role, event_type, from_status, to_status, payload)
			VALUES($1, 'system', 'auto_expired', 'pending', 'expired', $2::jsonb)
		`, e.id, mustJSON(map[string]any{"reason": e.reason}))

		// Уведомление владельцу
		_ = a.createNotification(ctx, e.ownerID, e.id,
			"Заявка истекла",
			"Заявка "+e.bookingCode+" на "+e.carName+" не была обработана и закрыта автоматически.")

		// Уведомление клиенту
		if e.clientUserID != nil {
			_ = a.createNotification(ctx, *e.clientUserID, e.id,
				"Заявка не подтверждена",
				"К сожалению, владелец не подтвердил заявку "+e.bookingCode+" на "+e.carName+". Попробуйте другую машину.")
		}

		log.Printf("rental expired #%d (%s)", e.id, e.reason)
	}
}

// === 2. Напоминание о предстоящей выдаче ===

func (a *App) remindPickupLoop(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	a.remindPickup(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.remindPickup(ctx)
		}
	}
}

func (a *App) remindPickup(ctx context.Context) {
	rows, err := a.db.Query(ctx, `
		SELECT id, owner_id, COALESCE(booking_code, ''), car_name,
		       starts_at,
		       EXTRACT(EPOCH FROM (starts_at - now())) / 3600 AS hours_left
		FROM rentals
		WHERE status = 'confirmed'
		  AND starts_at BETWEEN now() AND now() + interval '48 hours'
	`)
	if err != nil {
		log.Printf("remindPickup query: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, ownerID int64
		var bookingCode, carName string
		var startsAt time.Time
		var hoursLeft float64
		if err := rows.Scan(&id, &ownerID, &bookingCode, &carName, &startsAt, &hoursLeft); err != nil {
			continue
		}

		// Определяем, какое именно напоминание — за 48, 24 или 3 часа
		var title, message string
		switch {
		case hoursLeft <= 3:
			title = "Выдача сегодня"
			message = "Сегодня в " + startsAt.Format("15:04") + " выдача " + carName + " по брони " + bookingCode + ". Подготовьте машину."
		case hoursLeft <= 24:
			title = "Выдача завтра"
			message = "Завтра в " + startsAt.Format("15:04") + " выдача " + carName + " по брони " + bookingCode + "."
		default:
			title = "Скоро выдача"
			message = "Через " + formatHours(hoursLeft) + " выдача " + carName + " по брони " + bookingCode + "."
		}

		_ = a.createNotification(ctx, ownerID, id, title, message)
	}
}

func formatHours(h float64) string {
	switch {
	case h >= 48:
		return "2 дня"
	case h >= 24:
		return "сутки"
	default:
		return time.Duration(h * float64(time.Hour)).Truncate(time.Hour).String()
	}
}

// === 3. Просроченные активные аренды ===

func (a *App) alertOverdueLoop(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	a.alertOverdue(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.alertOverdue(ctx)
		}
	}
}

func (a *App) alertOverdue(ctx context.Context) {
	rows, err := a.db.Query(ctx, `
		SELECT id, owner_id, client_user_id, COALESCE(booking_code, ''), car_name,
		       ends_at,
		       EXTRACT(EPOCH FROM (now() - ends_at)) / 3600 AS hours_overdue
		FROM rentals
		WHERE status = 'active'
		  AND ends_at < now()
		  AND ends_at > now() - interval '30 days'
	`)
	if err != nil {
		log.Printf("alertOverdue query: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, ownerID int64
		var clientUserID *int64
		var bookingCode, carName string
		var endsAt time.Time
		var hoursOverdue float64
		if err := rows.Scan(&id, &ownerID, &clientUserID, &bookingCode, &carName, &endsAt, &hoursOverdue); err != nil {
			continue
		}

		overdueLabel := formatOverdue(hoursOverdue)

		_ = a.createNotification(ctx, ownerID, id,
			"Просрочка возврата",
			"Аренда "+bookingCode+" ("+carName+") просрочена на "+overdueLabel+". Свяжитесь с клиентом.")

		if clientUserID != nil {
			_ = a.createNotification(ctx, *clientUserID, id,
				"Время аренды истекло",
				"Срок аренды "+bookingCode+" ("+carName+") истёк "+overdueLabel+" назад. Пожалуйста, верните автомобиль.")
		}
	}
}

func formatOverdue(h float64) string {
	switch {
	case h >= 72:
		return time.Duration(h*float64(time.Hour)).Truncate(24 * time.Hour).String()
	case h >= 1:
		return time.Duration(h * float64(time.Hour)).Truncate(time.Hour).String()
	default:
		return "менее часа"
	}
}