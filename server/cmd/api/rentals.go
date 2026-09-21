package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var errRentalNotFound = errors.New("аренда не найдена")

// ============== LIST / CREATE ==============

func (a *App) rentals(w http.ResponseWriter, r *http.Request) {
	owner := userID(r.Context())
	if r.Method == "POST" {
		var in struct {
			CarID       int64   `json:"car_id"`
			ClientName  string  `json:"client_name"`
			ClientPhone string  `json:"client_phone"`
			Status      string  `json:"status"`
			Amount      float64 `json:"amount"`
			StartsAt    string  `json:"starts_at"`
			EndsAt      string  `json:"ends_at"`
		}
		if decode(r, &in) != nil {
			write(w, 400, map[string]string{"error": "invalid json"})
			return
		}
		if in.CarID <= 0 {
			write(w, 422, map[string]string{"error": "укажите автомобиль"})
			return
		}
		if strings.TrimSpace(in.ClientName) == "" {
			write(w, 422, map[string]string{"error": "укажите имя клиента"})
			return
		}
		if !contains([]string{"hold", "pending", "review", "confirmed", "preparing", "active"}, in.Status) {
			in.Status = "pending"
		}

		st, en, err := parseBookingTimes(in.StartsAt, in.EndsAt)
		if err != nil {
			write(w, 422, map[string]string{"error": "укажите корректные даты аренды"})
			return
		}

		ctx := r.Context()
		tx, err := a.db.Begin(ctx)
		if err != nil {
			write(w, 500, map[string]string{"error": "transaction error"})
			return
		}
		defer tx.Rollback(ctx)

		var carName string
		var ownerID int64
		err = tx.QueryRow(ctx,
			`SELECT owner_id, brand||' '||model FROM cars WHERE id=$1 AND owner_id=$2 FOR UPDATE`,
			in.CarID, owner).Scan(&ownerID, &carName)
		if err != nil {
			write(w, 404, map[string]string{"error": "автомобиль не найден"})
			return
		}

		var overlap bool
		err = tx.QueryRow(ctx,
			`SELECT EXISTS(
				SELECT 1 FROM rentals
				WHERE car_id=$1
				AND status IN ('hold','pending','review','confirmed','preparing','active')
				AND (status<>'hold' OR hold_expires_at IS NULL OR hold_expires_at>now())
				AND starts_at < $3 AND ends_at > $2
			)`, in.CarID, st, en).Scan(&overlap)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось проверить доступность"})
			return
		}
		if overlap {
			write(w, 409, map[string]string{"error": "автомобиль занят в выбранный период"})
			return
		}

		var id int64
		err = tx.QueryRow(ctx,
			`INSERT INTO rentals(owner_id,car_id,car_name,client_name,client_phone,status,amount,final_total,starts_at,ends_at,source,payment_status)
			VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,'owner','unpaid')
			RETURNING id`,
			owner, in.CarID, carName, strings.TrimSpace(in.ClientName),
			normalizePhone(in.ClientPhone), in.Status, in.Amount, st, en).Scan(&id)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось создать аренду"})
			return
		}

		code := fmt.Sprintf("KEY-%06d", id)
		_, _ = tx.Exec(ctx, `UPDATE rentals SET booking_code=$1 WHERE id=$2`, code, id)

		_, _ = tx.Exec(ctx,
			`INSERT INTO rental_events(rental_id,actor_id,actor_role,event_type,to_status,payload)
			VALUES($1,$2,'owner','manual_created',$3,$4::jsonb)`,
			id, owner, in.Status, mustJSON(map[string]any{"source": "owner"}))

		if in.Status == "active" {
			_, _ = tx.Exec(ctx, `UPDATE cars SET status='rented' WHERE id=$1`, in.CarID)
		}

		if err := tx.Commit(ctx); err != nil {
			write(w, 500, map[string]string{"error": "не удалось подтвердить аренду"})
			return
		}

		write(w, 201, map[string]any{
			"id": id, "booking_code": code, "car_id": in.CarID,
			"car": carName, "status": in.Status, "amount": in.Amount,
			"starts_at": st, "ends_at": en,
		})
		return
	}

	rows, err := a.db.Query(r.Context(), `SELECT id,COALESCE(booking_code,''),car_name,client_name,client_phone,status,amount,deposit,starts_at,ends_at,payment_status,COALESCE(final_total,amount) FROM rentals WHERE owner_id=$1 ORDER BY starts_at DESC NULLS LAST,id DESC`, owner)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var code, car, client, phone, status, payment string
		var amount, deposit, finalTotal float64
		var starts, ends *time.Time
		if rows.Scan(&id, &code, &car, &client, &phone, &status, &amount, &deposit, &starts, &ends, &payment, &finalTotal) == nil {
			out = append(out, map[string]any{"id": id, "booking_code": code, "car": car, "client": client, "phone": phone, "status": status, "amount": amount, "deposit": deposit, "starts_at": starts, "ends_at": ends, "payment_status": payment, "final_total": finalTotal})
		}
	}
	write(w, 200, out)
}

// ============== PATCH BY ID (status) ==============

func (a *App) rentalByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/rentals/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	if r.Method != "PATCH" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if decode(r, &in) != nil || !contains([]string{"hold", "pending", "review", "confirmed", "preparing", "active", "returned", "completed", "cancelled", "expired", "rejected"}, in.Status) {
		write(w, 422, map[string]string{"error": "invalid status"})
		return
	}
	if err := a.transitionRental(r.Context(), id, userID(r.Context()), "owner", in.Status, in.Reason); err != nil {
		code := 409
		if errors.Is(err, errRentalNotFound) {
			code = 404
		}
		write(w, code, map[string]string{"error": err.Error()})
		return
	}
	write(w, 200, map[string]bool{"ok": true})
}

// ============== STATE MACHINE ==============

func allowedRentalTransition(from, to string) bool {
	if from == to {
		return true
	}
	m := map[string][]string{
		"hold":      {"confirmed", "expired", "cancelled", "rejected"},
		"pending":   {"review", "confirmed", "rejected", "cancelled"},
		"review":    {"confirmed", "rejected", "cancelled"},
		"confirmed": {"preparing", "active", "cancelled", "rejected"},
		"preparing": {"active", "cancelled"},
		"active":    {"returned", "cancelled"},
		"returned":  {"completed"},
	}
	return contains(m[from], to)
}

func (a *App) transitionRental(ctx context.Context, rentalID, actorID int64, actorRole, to, reason string) error {
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var ownerID int64
	var from string
	err = tx.QueryRow(ctx, `SELECT owner_id,status FROM rentals WHERE id=$1 FOR UPDATE`, rentalID).Scan(&ownerID, &from)
	if err != nil {
		return errRentalNotFound
	}
	if actorRole == "owner" && ownerID != actorID {
		return errRentalNotFound
	}
	if !allowedRentalTransition(from, to) {
		return fmt.Errorf("нельзя перевести аренду из «%s» в «%s»", from, to)
	}
	if to == "completed" {
		var paid string
		_ = tx.QueryRow(ctx, `SELECT payment_status FROM rentals WHERE id=$1`, rentalID).Scan(&paid)
		if paid != "paid" {
			return fmt.Errorf("нельзя завершить сделку без подтверждения оплаты")
		}
	}
	_, err = tx.Exec(ctx, `UPDATE rentals SET status=$1, cancellation_reason=CASE WHEN $1 IN ('cancelled','rejected') THEN $2 ELSE cancellation_reason END, pickup_at=CASE WHEN $1='active' AND pickup_at IS NULL THEN now() ELSE pickup_at END, returned_at=CASE WHEN $1='returned' THEN now() ELSE returned_at END, updated_at=now() WHERE id=$3`, to, strings.TrimSpace(reason), rentalID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO rental_events(rental_id,actor_id,actor_role,event_type,from_status,to_status,payload) VALUES($1,$2,$3,'status_change',$4,$5,$6::jsonb)`, rentalID, actorID, actorRole, from, to, mustJSON(map[string]any{"reason": strings.TrimSpace(reason)}))
	if err != nil {
		return err
	}
	if to == "completed" {
		_, _ = tx.Exec(ctx, `UPDATE cars c SET status='available', revenue=c.revenue + COALESCE(NULLIF(r.final_total,0), r.amount, 0) FROM rentals r WHERE r.id=$1 AND c.id=r.car_id`, rentalID)
	} else if to == "active" {
		_, _ = tx.Exec(ctx, `UPDATE cars SET status='rented' WHERE id=(SELECT car_id FROM rentals WHERE id=$1)`, rentalID)
	} else if to == "returned" || to == "cancelled" || to == "rejected" || to == "expired" {
		_, _ = tx.Exec(ctx, `UPDATE cars SET status='available' WHERE id=(SELECT car_id FROM rentals WHERE id=$1) AND status='rented'`, rentalID)
	}
	return tx.Commit(ctx)
}

// ============== CALENDAR ==============

func (a *App) rentalCalendar(w http.ResponseWriter, r *http.Request) {
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	if from == "" {
		from = time.Now().Format("2006-01-02")
	}
	if to == "" {
		to = time.Now().AddDate(0, 0, 30).Format("2006-01-02")
	}
	st, en, err := parseBookingTimes(from+"T00:00:00Z", to+"T00:00:00Z")
	if err != nil {
		write(w, 422, map[string]string{"error": "некорректный диапазон"})
		return
	}
	rows, err := a.db.Query(r.Context(), `SELECT c.id,c.brand,c.model,c.plate,c.status,COALESCE(c.daily_price,0),r.id,COALESCE(r.booking_code,''),COALESCE(r.client_name,''),r.status,r.starts_at,r.ends_at,COALESCE(r.amount,0) FROM cars c LEFT JOIN rentals r ON r.car_id=c.id AND r.owner_id=$1 AND r.starts_at < $3 AND r.ends_at > $2 AND r.status NOT IN ('cancelled','rejected','expired') WHERE c.owner_id=$1 ORDER BY c.id,r.starts_at`, userID(r.Context()), st, en)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	by := map[int64]map[string]any{}
	order := []int64{}
	for rows.Next() {
		var cid int64
		var brand, model, plate, cstatus string
		var price float64
		var rid *int64
		var code, client, rstatus string
		var rs, re *time.Time
		var amount float64
		if rows.Scan(&cid, &brand, &model, &plate, &cstatus, &price, &rid, &code, &client, &rstatus, &rs, &re, &amount) != nil {
			continue
		}
		if _, ok := by[cid]; !ok {
			by[cid] = map[string]any{"id": cid, "car": brand + " " + model, "plate": plate, "status": cstatus, "daily_price": price, "bookings": []any{}}
			order = append(order, cid)
		}
		if rid != nil {
			b := by[cid]["bookings"].([]any)
			b = append(b, map[string]any{"id": *rid, "code": code, "client": client, "status": rstatus, "starts_at": rs, "ends_at": re, "amount": amount})
			by[cid]["bookings"] = b
		}
	}
	out := []map[string]any{}
	for _, id := range order {
		out = append(out, by[id])
	}
	write(w, 200, map[string]any{"from": st, "to": en, "cars": out})
}

// ============== MEETING / PAYMENT ==============

func (a *App) rentalMeeting(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/rentals/meeting/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	if r.Method != "PATCH" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct {
		Kind     string `json:"kind"`
		At       string `json:"at"`
		Location string `json:"location"`
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	kind := first(in.Kind, "pickup")
	if kind != "pickup" && kind != "return" {
		write(w, 422, map[string]string{"error": "kind must be pickup or return"})
		return
	}
	at, err := time.Parse(time.RFC3339, in.At)
	if err != nil {
		at, err = time.Parse("2006-01-02T15:04", in.At)
	}
	if err != nil {
		write(w, 422, map[string]string{"error": "некорректная дата встречи"})
		return
	}
	colAt := "pickup_meeting_at"
	colLoc := "pickup_meeting_location"
	if kind == "return" {
		colAt = "return_meeting_at"
		colLoc = "return_meeting_location"
	}
	q := fmt.Sprintf(`UPDATE rentals SET %s=$1,%s=$2,updated_at=now() WHERE id=$3 AND owner_id=$4`, colAt, colLoc)
	if _, err = a.db.Exec(r.Context(), q, at, strings.TrimSpace(in.Location), id, userID(r.Context())); err != nil {
		write(w, 500, map[string]string{"error": "не удалось назначить встречу"})
		return
	}
	_, _ = a.db.Exec(r.Context(), `INSERT INTO rental_events(rental_id,actor_id,actor_role,event_type,payload) VALUES($1,$2,'owner','meeting_scheduled',$3::jsonb)`, id, userID(r.Context()), mustJSON(map[string]any{"kind": kind, "at": at, "location": strings.TrimSpace(in.Location)}))
	write(w, 200, map[string]bool{"ok": true})
}

func (a *App) rentalPayment(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/rentals/payment/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	if r.Method != "PATCH" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct {
		Paid bool `json:"paid"`
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	status := "unpaid"
	if in.Paid {
		status = "paid"
	}
	if _, err = a.db.Exec(r.Context(), `UPDATE rentals SET payment_status=$1,updated_at=now() WHERE id=$2 AND owner_id=$3`, status, id, userID(r.Context())); err != nil {
		write(w, 500, map[string]string{"error": "не удалось обновить оплату"})
		return
	}
	if in.Paid {
		_, _ = a.db.Exec(r.Context(), `INSERT INTO rental_payments(rental_id,payment_type,status,amount,provider) SELECT id,'rental','paid',final_total,'manual' FROM rentals WHERE id=$1 AND owner_id=$2`, id, userID(r.Context()))
	}
	_, _ = a.db.Exec(r.Context(), `INSERT INTO rental_events(rental_id,actor_id,actor_role,event_type,payload) VALUES($1,$2,'owner','payment_status',$3::jsonb)`, id, userID(r.Context()), mustJSON(map[string]any{"status": status}))
	write(w, 200, map[string]string{"payment_status": status})
}

// ============== OPS: GET detail, POST operation ==============

func (a *App) rentalOps(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/rental-ops/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	owner := userID(r.Context())
	if r.Method == "GET" {
		var d = map[string]any{}
		var code, car, client, status, payment string
		var amount, deposit, finalTotal, late, damage float64
		var st, en, pickup, returned, pickupMeeting, returnMeeting *time.Time
		var mileageStart, mileageEnd, fuelStart, fuelEnd *int
		var pickupMeetingLocation, returnMeetingLocation string
		err = a.db.QueryRow(r.Context(), `SELECT COALESCE(r.booking_code,''),r.car_name,r.client_name,r.status,r.payment_status,r.amount,r.deposit,r.final_total,r.late_fee,r.damage_fee,r.starts_at,r.ends_at,r.pickup_at,r.returned_at,r.odometer_start,r.odometer_end,r.fuel_start,r.fuel_end,r.pickup_meeting_at,r.pickup_meeting_location,r.return_meeting_at,r.return_meeting_location FROM rentals r WHERE r.id=$1 AND r.owner_id=$2`, id, owner).Scan(&code, &car, &client, &status, &payment, &amount, &deposit, &finalTotal, &late, &damage, &st, &en, &pickup, &returned, &mileageStart, &mileageEnd, &fuelStart, &fuelEnd, &pickupMeeting, &pickupMeetingLocation, &returnMeeting, &returnMeetingLocation)
		if err != nil {
			write(w, 404, map[string]string{"error": "аренда не найдена"})
			return
		}
		d["id"] = id
		d["booking_code"] = code
		d["car"] = car
		d["client"] = client
		d["status"] = status
		d["payment_status"] = payment
		d["amount"] = amount
		d["deposit"] = deposit
		d["final_total"] = finalTotal
		d["late_fee"] = late
		d["damage_fee"] = damage
		d["starts_at"] = st
		d["ends_at"] = en
		d["pickup_at"] = pickup
		d["returned_at"] = returned
		d["pickup_meeting_at"] = pickupMeeting
		d["pickup_meeting_location"] = pickupMeetingLocation
		d["return_meeting_at"] = returnMeeting
		d["return_meeting_location"] = returnMeetingLocation
		d["odometer_start"] = mileageStart
		d["odometer_end"] = mileageEnd
		d["fuel_start"] = fuelStart
		d["fuel_end"] = fuelEnd
		d["events"] = rentalEvents(r.Context(), a.db, id)
		d["extras"] = rentalExtras(r.Context(), a.db, id)
		d["payments"] = rentalPayments(r.Context(), a.db, id)
		d["inspections"] = rentalInspections(r.Context(), a.db, id)
		d["expenses"] = rentalExpenses(r.Context(), a.db, id)
		d["adjustments"] = rentalAdjustments(r.Context(), a.db, id)
		d["deposit_transactions"] = depositTransactions(r.Context(), a.db, id)
		var expensesTotal, adjustmentsTotal float64
		_ = a.db.QueryRow(r.Context(), `SELECT COALESCE(sum(amount),0) FROM rental_expenses WHERE rental_id=$1`, id).Scan(&expensesTotal)
		_ = a.db.QueryRow(r.Context(), `SELECT COALESCE(sum(CASE WHEN adjustment_type IN ('late_fee','damage_fee','other') THEN amount ELSE -amount END),0) FROM rental_adjustments WHERE rental_id=$1`, id).Scan(&adjustmentsTotal)
		d["expenses_total"] = expensesTotal
		d["profit"] = finalTotal - expensesTotal
		d["extension_count"] = rentalExtensionCount(r.Context(), a.db, id)
		write(w, 200, d)
		return
	}
	if r.Method != "POST" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct {
		Type        string   `json:"type"`
		Name        string   `json:"name"`
		Qty         int      `json:"qty"`
		UnitPrice   float64  `json:"unit_price"`
		Amount      float64  `json:"amount"`
		Note        string   `json:"note"`
		Kind        string   `json:"kind"`
		Mileage     *int     `json:"mileage"`
		Fuel        *int     `json:"fuel_level"`
		Photos      []string `json:"photos"`
		PaymentType string   `json:"payment_type"`
		NewStart    string   `json:"new_start"`
		NewEnd      string   `json:"new_end"`
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	if in.Type == "extra" {
		if in.Qty < 1 {
			in.Qty = 1
		}
		total := float64(in.Qty) * in.UnitPrice
		tag, e := a.db.Exec(r.Context(),
			`INSERT INTO rental_extras(rental_id, name, qty, unit_price, total)
			SELECT r.id, $2::text, $3::int, $4::numeric, $5::numeric
			FROM rentals r
			WHERE r.id = $1::bigint AND r.owner_id = $6::bigint`,
			id, in.Name, in.Qty, in.UnitPrice, total, owner)
		if e != nil {
			err = e
		} else if tag.RowsAffected() == 0 {
			err = fmt.Errorf("rental %d не найден для владельца %d", id, owner)
		}
		if err == nil {
			_, _ = a.db.Exec(r.Context(),
				`UPDATE rentals SET final_total = calculate_rental_final_total(id), updated_at=now()
				WHERE id=$1 AND owner_id=$2`,
				id, owner)
		}
	} else if in.Type == "payment" {
		if in.Amount <= 0 {
			write(w, 422, map[string]string{"error": "укажите положительную сумму платежа"})
			return
		}
		tag, e := a.db.Exec(r.Context(),
			`INSERT INTO rental_payments(rental_id, payment_type, status, amount, provider)
			SELECT r.id, $2::text, 'paid', $3::numeric, 'mock'
			FROM rentals r
			WHERE r.id = $1::bigint AND r.owner_id = $4::bigint`,
			id, first(in.PaymentType, "rental"), in.Amount, owner)
		if e != nil {
			err = e
		} else if tag.RowsAffected() == 0 {
			err = fmt.Errorf("rental %d не найден для владельца %d", id, owner)
		} else {
			_, _ = a.db.Exec(r.Context(),
				`UPDATE rentals SET payment_status='paid', updated_at=now()
				WHERE id=$1 AND owner_id=$2`,
				id, owner)
		}
	} else if in.Type == "inspection" {
		b, _ := json.Marshal(in.Photos)
		tag, e := a.db.Exec(r.Context(),
			`INSERT INTO rental_inspections(rental_id, kind, mileage, fuel_level, notes, photos)
			SELECT r.id, $2::text, $3::int, $4::int, $5::text, $6::jsonb
			FROM rentals r
			WHERE r.id = $1::bigint AND r.owner_id = $7::bigint`,
			id, first(in.Kind, "pickup"), in.Mileage, in.Fuel, in.Note, string(b), owner)
		if e != nil {
			err = e
		} else if tag.RowsAffected() == 0 {
			err = fmt.Errorf("rental %d не найден для владельца %d", id, owner)
		}
	} else if in.Type == "expense" {
		if in.Amount <= 0 {
			write(w, 422, map[string]string{"error": "укажите положительную сумму расхода"})
			return
		}
		tag, e := a.db.Exec(r.Context(),
			`INSERT INTO rental_expenses(rental_id, expense_type, amount, note)
			SELECT r.id, $2::text, $3::numeric, $4::text
			FROM rentals r
			WHERE r.id = $1::bigint AND r.owner_id = $5::bigint`,
			id, first(in.Kind, "other"), in.Amount, in.Note, owner)
		if e != nil {
			err = e
		} else if tag.RowsAffected() == 0 {
			err = fmt.Errorf("rental %d не найден для владельца %d", id, owner)
		}
	} else if in.Type == "adjustment" {
		kind := first(in.Kind, "other")
		if !contains([]string{"late_fee", "damage_fee", "discount", "other"}, kind) || in.Amount == 0 {
			write(w, 422, map[string]string{"error": "укажите тип и сумму корректировки"})
			return
		}
		tag, e := a.db.Exec(r.Context(),
			`INSERT INTO rental_adjustments(rental_id, adjustment_type, amount, note)
			SELECT r.id, $2::text, $3::numeric, $4::text
			FROM rentals r
			WHERE r.id = $1::bigint AND r.owner_id = $5::bigint`,
			id, kind, in.Amount, in.Note, owner)
		if e != nil {
			err = e
		} else if tag.RowsAffected() == 0 {
			err = fmt.Errorf("rental %d не найден для владельца %d", id, owner)
		} else {
			_, _ = a.db.Exec(r.Context(),
				`UPDATE rentals SET
					late_fee   = COALESCE((SELECT sum(amount) FROM rental_adjustments WHERE rental_id=$1 AND adjustment_type='late_fee'), 0),
					damage_fee = COALESCE((SELECT sum(amount) FROM rental_adjustments WHERE rental_id=$1 AND adjustment_type='damage_fee'), 0),
					final_total = calculate_rental_final_total(id),
					updated_at = now()
				WHERE id=$1 AND owner_id=$2`,
				id, owner)
		}
	} else if in.Type == "deposit" {
		kind := first(in.Kind, "hold")
		if !contains([]string{"hold", "release", "charge"}, kind) || in.Amount <= 0 {
			write(w, 422, map[string]string{"error": "укажите операцию и положительную сумму депозита"})
			return
		}
		tag, e := a.db.Exec(r.Context(),
			`INSERT INTO deposit_transactions(rental_id, transaction_type, amount, note)
			SELECT r.id, $2::text, $3::numeric, $4::text
			FROM rentals r
			WHERE r.id = $1::bigint AND r.owner_id = $5::bigint`,
			id, kind, in.Amount, in.Note, owner)
		if e != nil {
			err = e
		} else if tag.RowsAffected() == 0 {
			err = fmt.Errorf("rental %d не найден для владельца %d", id, owner)
		}
	} else if in.Type == "extension" {
		if in.NewEnd == "" {
			write(w, 422, map[string]string{"error": "укажите новую дату возврата"})
			return
		}
		newEnd, parseErr := time.Parse(time.RFC3339, in.NewEnd)
		if parseErr != nil {
			newEnd, parseErr = time.Parse("2006-01-02T15:04", in.NewEnd)
		}
		if parseErr != nil {
			write(w, 422, map[string]string{"error": "некорректная дата возврата"})
			return
		}
		var currentStart time.Time
		var currentEnd time.Time
		if err = a.db.QueryRow(r.Context(), `SELECT starts_at,ends_at FROM rentals WHERE id=$1 AND owner_id=$2`, id, owner).Scan(&currentStart, &currentEnd); err != nil {
			write(w, 404, map[string]string{"error": "аренда не найдена"})
			return
		}
		if !newEnd.After(currentEnd) {
			write(w, 422, map[string]string{"error": "новая дата должна быть позже текущей"})
			return
		}
		var blocked bool
		if err = a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM rentals r1 JOIN rentals r2 ON r2.car_id=r1.car_id WHERE r1.id=$1 AND r2.id<>r1.id AND r2.status IN ('hold','pending','review','confirmed','preparing','active') AND r2.starts_at < $3 AND r2.ends_at > $2)`, id, currentStart, newEnd).Scan(&blocked); err != nil {
			write(w, 500, map[string]string{"error": "не удалось проверить доступность"})
			return
		}
		if blocked {
			write(w, 409, map[string]string{"error": "автомобиль занят в выбранный период"})
			return
		}
		_, err = a.db.Exec(r.Context(), `UPDATE rentals SET ends_at=$1,extension_count=extension_count+1,updated_at=now() WHERE id=$2 AND owner_id=$3`, newEnd, id, owner)
		if err == nil {
			_, _ = a.db.Exec(r.Context(), `INSERT INTO rental_events(rental_id,actor_id,actor_role,event_type,payload) VALUES($1,$2,'owner','extension',$3::jsonb)`, id, owner, mustJSON(map[string]any{"new_end": newEnd}))
		}
	} else {
		write(w, 422, map[string]string{"error": "unknown operation"})
		return
	}
	if err != nil {
		write(w, 500, map[string]string{"error": "не удалось сохранить операцию"})
		return
	}
	if in.Type == "inspection" && in.Kind == "pickup" {
		_, _ = a.db.Exec(r.Context(), `UPDATE rentals SET odometer_start=COALESCE($1,odometer_start),fuel_start=COALESCE($2,fuel_start),updated_at=now() WHERE id=$3 AND owner_id=$4`, in.Mileage, in.Fuel, id, owner)
	}
	if in.Type == "inspection" && in.Kind == "return" {
		_, _ = a.db.Exec(r.Context(),
			`UPDATE rentals SET
				odometer_end = COALESCE($1, odometer_end),
				fuel_end     = COALESCE($2, fuel_end),
				final_total  = calculate_rental_final_total(id),
				updated_at   = now()
			WHERE id=$3 AND owner_id=$4`,
			in.Mileage, in.Fuel, id, owner)
	}
	write(w, 201, map[string]bool{"ok": true})
}

// ============== RENTAL HELPERS ==============

func rentalAdjustments(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,adjustment_type,amount,note,created_at FROM rental_adjustments WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var i int64
		var typ, note string
		var amount float64
		var at time.Time
		if rows.Scan(&i, &typ, &amount, &note, &at) == nil {
			out = append(out, map[string]any{"id": i, "type": typ, "amount": amount, "note": note, "created_at": at})
		}
	}
	return out
}

func depositTransactions(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,transaction_type,amount,note,created_at FROM deposit_transactions WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var i int64
		var typ, note string
		var amount float64
		var at time.Time
		if rows.Scan(&i, &typ, &amount, &note, &at) == nil {
			out = append(out, map[string]any{"id": i, "type": typ, "amount": amount, "note": note, "created_at": at})
		}
	}
	return out
}

func rentalExtensionCount(ctx context.Context, db *pgxpool.Pool, id int64) int {
	var n int
	_ = db.QueryRow(ctx, `SELECT extension_count FROM rentals WHERE id=$1`, id).Scan(&n)
	return n
}

func rentalEvents(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,event_type,actor_role,from_status,to_status,payload,created_at FROM rental_events WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var eid int64
		var typ, role, from, to string
		var payload []byte
		var at time.Time
		if rows.Scan(&eid, &typ, &role, &from, &to, &payload, &at) == nil {
			var p any
			_ = json.Unmarshal(payload, &p)
			out = append(out, map[string]any{"id": eid, "type": typ, "actor_role": role, "from": from, "to": to, "payload": p, "created_at": at})
		}
	}
	return out
}

func rentalExtras(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,name,qty,unit_price,total FROM rental_extras WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var x int64
		var n string
		var q int
		var u, t float64
		if rows.Scan(&x, &n, &q, &u, &t) == nil {
			out = append(out, map[string]any{"id": x, "name": n, "qty": q, "unit_price": u, "total": t})
		}
	}
	return out
}

func rentalPayments(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,payment_type,status,amount,provider,created_at FROM rental_payments WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var x int64
		var typ, st, prov string
		var amt float64
		var at time.Time
		if rows.Scan(&x, &typ, &st, &amt, &prov, &at) == nil {
			out = append(out, map[string]any{"id": x, "type": typ, "status": st, "amount": amt, "provider": prov, "created_at": at})
		}
	}
	return out
}

func rentalInspections(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,kind,mileage,fuel_level,notes,photos,created_at FROM rental_inspections WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var x int64
		var k, n string
		var m, f *int
		var ph []byte
		var at time.Time
		if rows.Scan(&x, &k, &m, &f, &n, &ph, &at) == nil {
			var p any
			_ = json.Unmarshal(ph, &p)
			out = append(out, map[string]any{"id": x, "kind": k, "mileage": m, "fuel_level": f, "notes": n, "photos": p, "created_at": at})
		}
	}
	return out
}

func rentalExpenses(ctx context.Context, db *pgxpool.Pool, id int64) []any {
	rows, e := db.Query(ctx, `SELECT id,expense_type,amount,note,created_at FROM rental_expenses WHERE rental_id=$1 ORDER BY id DESC`, id)
	if e != nil {
		return []any{}
	}
	defer rows.Close()
	out := []any{}
	for rows.Next() {
		var x int64
		var k, n string
		var a float64
		var at time.Time
		if rows.Scan(&x, &k, &a, &n, &at) == nil {
			out = append(out, map[string]any{"id": x, "type": k, "amount": a, "note": n, "created_at": at})
		}
	}
	return out
}

// ============== TIME PARSING ==============

func parseBookingTimes(from, to string) (time.Time, time.Time, error) {
	parse := func(v string) (time.Time, error) {
		if t, e := time.Parse(time.RFC3339, v); e == nil {
			return t, nil
		}
		return time.Parse("2006-01-02", v)
	}
	st, e := parse(from)
	if e != nil {
		return time.Time{}, time.Time{}, e
	}
	en, e := parse(to)
	if e != nil {
		return time.Time{}, time.Time{}, e
	}
	if !en.After(st) {
		return time.Time{}, time.Time{}, errors.New("range")
	}
	return st, en, nil
}

func parseRangeValues(r *http.Request) (time.Time, time.Time, error) {
	from := strings.TrimSpace(r.URL.Query().Get("from"))
	to := strings.TrimSpace(r.URL.Query().Get("to"))
	if from == "" || to == "" {
		return time.Time{}, time.Time{}, errors.New("dates required")
	}
	parse := func(v string) (time.Time, error) {
		if t, e := time.Parse(time.RFC3339, v); e == nil {
			return t, nil
		}
		return time.Parse("2006-01-02", v)
	}
	st, e := parse(from)
	if e != nil {
		return time.Time{}, time.Time{}, e
	}
	en, e := parse(to)
	if e != nil {
		return time.Time{}, time.Time{}, e
	}
	if !en.After(st) {
		return time.Time{}, time.Time{}, errors.New("invalid date range")
	}
	return st, en, nil
}