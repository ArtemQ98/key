package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ============== DASHBOARD ==============

func (a *App) dashboard(w http.ResponseWriter, r *http.Request) {
	id := userID(r.Context())
	var fleet, available, rented, maintenance int
	var revenue float64
	_ = a.db.QueryRow(r.Context(), `SELECT count(*),count(*) FILTER(WHERE status='available'),count(*) FILTER(WHERE status='rented'),count(*) FILTER(WHERE status='maintenance'),COALESCE(sum(revenue),0) FROM cars WHERE owner_id=$1`, id).
		Scan(&fleet, &available, &rented, &maintenance, &revenue)
	var applications, verificationQueue int
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM rentals WHERE owner_id=$1 AND status IN ('pending','review')`, id).Scan(&applications)
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM verifications WHERE owner_id=$1 AND status IN ('review','pending')`, id).Scan(&verificationQueue)
	util := 0
	if fleet > 0 {
		util = rented * 100 / fleet
	}
	var monthRevenue float64
	_ = a.db.QueryRow(r.Context(), `SELECT COALESCE(sum(amount),0) FROM rentals WHERE owner_id=$1 AND status IN ('active','completed') AND created_at >= date_trunc('month',now())`, id).Scan(&monthRevenue)
	write(w, 200, map[string]any{
		"fleet": fleet, "available": available, "rented": rented, "maintenance": maintenance,
		"revenue": revenue, "monthRevenue": monthRevenue, "utilization": util,
		"applications": applications, "verificationQueue": verificationQueue,
	})
}

// ============== REVENUE CHART ==============

func (a *App) revenueChart(w http.ResponseWriter, r *http.Request) {
	owner := userID(r.Context())

	monthParam := r.URL.Query().Get("month")
	var start, end time.Time

	if monthParam != "" {
		t, err := time.Parse("2006-01", monthParam)
		if err != nil {
			write(w, 422, map[string]string{"error": "month must be YYYY-MM"})
			return
		}
		start = t
	} else {
		now := time.Now()
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}
	end = start.AddDate(0, 1, 0)

	rows, err := a.db.Query(r.Context(), `
		SELECT 
			to_char(date_trunc('day', starts_at), 'YYYY-MM-DD') AS day,
			COALESCE(SUM(COALESCE(final_total, amount, 0)), 0) AS total
		FROM rentals
		WHERE owner_id = $1
		  AND status NOT IN ('cancelled','rejected','expired')
		  AND starts_at >= $2
		  AND starts_at < $3
		GROUP BY date_trunc('day', starts_at)
		ORDER BY day
	`, owner, start, end)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	byDay := map[string]float64{}
	for rows.Next() {
		var day string
		var total float64
		if rows.Scan(&day, &total) == nil {
			byDay[day] = total
		}
	}

	days := int(end.Sub(start).Hours() / 24)
	out := make([]map[string]any, 0, days)
	for i := 0; i < days; i++ {
		d := start.AddDate(0, 0, i)
		key := d.Format("2006-01-02")
		out = append(out, map[string]any{
			"date":   key,
			"amount": byDay[key],
		})
	}

	var monthTotal float64
	for _, v := range byDay {
		monthTotal += v
	}

	write(w, 200, map[string]any{
		"month": start.Format("2006-01"),
		"days":  out,
		"total": monthTotal,
	})
}

// ============== VERIFICATIONS ==============

func (a *App) verification(w http.ResponseWriter, r *http.Request) {
	owner := userID(r.Context())
	if r.Method == "POST" {
		var in struct{ Name, Phone string }
		if decode(r, &in) != nil || strings.TrimSpace(in.Name) == "" {
			write(w, 422, map[string]string{"error": "имя клиента обязательно"})
			return
		}
		var id int64
		err := a.db.QueryRow(r.Context(), `INSERT INTO verifications(owner_id,user_id,stage,score,status,progress,risk_level,client_phone)
			VALUES($1,$1,'Анкета',72,'review',20,'medium',$2) RETURNING id`, owner, normalizePhone(in.Phone)).Scan(&id)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось создать проверку"})
			return
		}
		_, _ = a.db.Exec(r.Context(), `INSERT INTO rentals(owner_id,car_name,client_name,client_phone,status,amount) VALUES($1,'Новая заявка',$2,$3,'review',0)`, owner, in.Name, normalizePhone(in.Phone))
		write(w, 201, map[string]any{"id": id, "ok": true})
		return
	}
	rows, err := a.db.Query(r.Context(), `SELECT id,stage,score,status,progress,risk_level,client_phone,created_at FROM verifications WHERE owner_id=$1 ORDER BY id DESC`, owner)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var stage, status, risk, phone string
		var score, progress int
		var created time.Time
		if rows.Scan(&id, &stage, &score, &status, &progress, &risk, &phone, &created) == nil {
			out = append(out, map[string]any{"id": id, "stage": stage, "score": score, "status": status, "progress": progress, "risk_level": risk, "phone": phone, "created_at": created})
		}
	}
	write(w, 200, out)
}

func (a *App) verificationByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/verification/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	if r.Method != "PATCH" {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct {
		Stage, Status, RiskLevel string
		Score, Progress          int
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	if in.Progress < 0 {
		in.Progress = 0
	}
	if in.Progress > 100 {
		in.Progress = 100
	}
	_, err = a.db.Exec(r.Context(), `UPDATE verifications SET stage=COALESCE(NULLIF($1,''),stage),status=COALESCE(NULLIF($2,''),status),risk_level=COALESCE(NULLIF($3,''),risk_level),score=$4,progress=$5 WHERE id=$6 AND owner_id=$7`,
		in.Stage, in.Status, in.RiskLevel, in.Score, in.Progress, id, userID(r.Context()))
	if err != nil {
		write(w, 500, map[string]string{"error": "не удалось обновить проверку"})
		return
	}
	write(w, 200, map[string]bool{"ok": true})
}

// ============== CLIENTS ==============

func (a *App) clients(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(r.Context(), `SELECT client_name,MAX(client_phone),COUNT(*),COALESCE(SUM(amount),0),MAX(created_at) FROM rentals WHERE owner_id=$1 GROUP BY client_name ORDER BY MAX(created_at) DESC`, userID(r.Context()))
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var name, phone string
		var count int
		var total float64
		var last time.Time
		if rows.Scan(&name, &phone, &count, &total, &last) == nil {
			out = append(out, map[string]any{"name": name, "phone": phone, "rentals": count, "total": total, "last": last})
		}
	}
	write(w, 200, out)
}

// ============== NOTIFICATIONS ==============

func (a *App) notifications(w http.ResponseWriter, r *http.Request) {
	id := userID(r.Context())
	var pending, review, maintenance int
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM rentals WHERE owner_id=$1 AND status='pending'`, id).Scan(&pending)
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM verifications WHERE owner_id=$1 AND status IN ('review','pending')`, id).Scan(&review)
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM cars WHERE owner_id=$1 AND status='maintenance'`, id).Scan(&maintenance)
	items := []map[string]any{}
	if pending > 0 {
		items = append(items, map[string]any{"type": "rental", "title": fmt.Sprintf("%d новых заявок на аренду", pending), "text": "Проверьте клиента и подтвердите условия."})
	}
	if review > 0 {
		items = append(items, map[string]any{"type": "verification", "title": fmt.Sprintf("%d проверки требуют внимания", review), "text": "Завершите пред-проверку клиента перед договором."})
	}
	if maintenance > 0 {
		items = append(items, map[string]any{"type": "car", "title": fmt.Sprintf("%d авто на обслуживании", maintenance), "text": "Проверьте готовность машин к выдаче."})
	}
	write(w, 200, items)
}