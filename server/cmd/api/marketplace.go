package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ============== PUBLIC FLEETS ==============

func (a *App) publicFleets(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	city := strings.TrimSpace(r.URL.Query().Get("city"))
	rows, err := a.db.Query(r.Context(), `SELECT fp.id,fp.slug,fp.title,fp.description,fp.city,fp.rating,u.name,COUNT(c.id) FILTER (WHERE c.public_enabled AND c.status='available'),fp.avatar_url FROM fleet_profiles fp JOIN users u ON u.id=fp.owner_id LEFT JOIN cars c ON c.owner_id=fp.owner_id WHERE fp.published AND ($1='' OR fp.city ILIKE '%'||$1||'%' OR fp.title ILIKE '%'||$1||'%') AND ($2='' OR fp.title ILIKE '%'||$2||'%' OR u.name ILIKE '%'||$2||'%') GROUP BY fp.id,u.name ORDER BY fp.rating DESC,fp.id`, city, q)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var slug, title, desc, fcity, owner, avatarURL string
		var rating float64
		var count int
		if rows.Scan(&id, &slug, &title, &desc, &fcity, &rating, &owner, &count, &avatarURL) == nil {
			out = append(out, map[string]any{
				"id": id, "slug": slug, "title": title, "description": desc,
				"city": fcity, "rating": rating, "owner": owner,
				"available_cars": count,
				"avatar_url":     avatarURL,
			})
		}
	}
	write(w, 200, out)
}

// ============== PUBLIC FLEET (one) ==============

func (a *App) publicFleet(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/api/public/fleets/")
	if slug == "" {
		write(w, 400, map[string]string{"error": "slug required"})
		return
	}

	var id, ownerID int64
	var title, description, city, ownerName, avatarURL string
	var rating float64
	var published bool

	err := a.db.QueryRow(r.Context(), `
		SELECT fp.id, fp.owner_id, fp.title, COALESCE(fp.description,''),
			fp.city, fp.rating, fp.published, u.name, fp.avatar_url
		FROM fleet_profiles fp
		JOIN users u ON u.id = fp.owner_id
		WHERE fp.slug = $1 AND fp.published
	`, slug).Scan(&id, &ownerID, &title, &description, &city, &rating, &published, &ownerName, &avatarURL)
	if err != nil {
		write(w, 404, map[string]string{"error": "автопарк не найден"})
		return
	}

	var carsCount, availableCount int
	var minPrice float64
	_ = a.db.QueryRow(r.Context(), `
		SELECT 
			count(*),
			count(*) FILTER (WHERE status = 'available'),
			COALESCE(min(daily_price), 0)
		FROM cars
		WHERE owner_id = $1 AND public_enabled = true
	`, ownerID).Scan(&carsCount, &availableCount, &minPrice)

	rows, err := a.db.Query(r.Context(), `
		SELECT c.id, c.brand, c.model, c.year, c.location, c.daily_price,
		       c.mileage, c.color, c.category, c.seats, c.transmission,
		       c.fuel, c.description, c.image_url, c.deposit, c.rental_terms
		FROM cars c
		WHERE c.owner_id = $1 AND c.public_enabled = true AND c.status = 'available'
		ORDER BY c.daily_price
	`, ownerID)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	cars := []map[string]any{}
	for rows.Next() {
		var cid int64
		var brand, model, loc, color, cat, trans, fuel, desc, img string
		var year, seats, mileage int
		var price, deposit float64
		var rentalTermsJSON []byte

		if rows.Scan(&cid, &brand, &model, &year, &loc, &price,
			&mileage, &color, &cat, &seats, &trans, &fuel, &desc,
			&img, &deposit, &rentalTermsJSON) == nil {

			var terms []RentalTerm
			if len(rentalTermsJSON) > 0 {
				_ = json.Unmarshal(rentalTermsJSON, &terms)
			}
			if terms == nil {
				terms = []RentalTerm{}
			}

			cars = append(cars, map[string]any{
				"id": cid, "brand": brand, "model": model, "year": year,
				"location": loc, "daily_price": price, "mileage": mileage,
				"color": color, "category": cat, "seats": seats,
				"transmission": trans, "fuel": fuel, "description": desc,
				"image_url": img, "deposit": deposit,
				"rental_terms": terms,
				"fleet_title":  title, "fleet_city": city,
				"fleet_rating": rating, "owner": ownerName,
				"fleet_slug": slug,
			})
		}
	}

	write(w, 200, map[string]any{
		"id":          id,
		"slug":        slug,
		"title":       title,
		"description": description,
		"city":        city,
		"rating":      rating,
		"owner":       ownerName,
		"avatar_url":  avatarURL,
		"cars_count":  carsCount,
		"available":   availableCount,
		"min_price":   minPrice,
		"cars":        cars,
	})
}

// ============== PUBLIC CARS (list) ==============

func (a *App) publicCars(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	city := strings.TrimSpace(r.URL.Query().Get("city"))
	var st, en time.Time
	if r.URL.Query().Get("from") != "" || r.URL.Query().Get("to") != "" {
		var err error
		st, en, err = parseRangeValues(r)
		if err != nil {
			write(w, 422, map[string]string{"error": "некорректный диапазон дат"})
			return
		}
	}
	rows, err := a.db.Query(r.Context(), `SELECT c.id,c.owner_id,c.brand,c.model,c.year,c.location,c.daily_price,c.mileage,c.color,c.category,c.seats,c.transmission,c.fuel,c.description,c.image_url,c.deposit,fp.slug,fp.title,fp.city,fp.rating,u.name,fp.avatar_url,c.rental_terms FROM cars c JOIN fleet_profiles fp ON fp.owner_id=c.owner_id JOIN users u ON u.id=c.owner_id WHERE c.public_enabled AND fp.published AND c.status='available' AND ($1='' OR c.location ILIKE '%'||$1||'%' OR fp.city ILIKE '%'||$1||'%') AND ($2='' OR (c.brand||' '||c.model||' '||c.category||' '||fp.title) ILIKE '%'||$2||'%') AND ($3::timestamptz IS NULL OR NOT EXISTS (SELECT 1 FROM rentals r WHERE r.car_id=c.id AND r.status IN ('hold','pending','review','confirmed','active') AND (r.status<>'hold' OR r.hold_expires_at IS NULL OR r.hold_expires_at>now()) AND r.starts_at < $4 AND r.ends_at > $3)) ORDER BY c.daily_price`, city, q, nullableTime(st), en)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id, ownerID int64
		var brand, model, loc, color, cat, trans, fuel, desc, img, slug, title, fcity, owner, avatarURL string
		var year, seats, mileage int
		var price, deposit, rating float64
		var rentalTermsJSON []byte

		if rows.Scan(
			&id, &ownerID, &brand, &model, &year, &loc, &price,
			&mileage, &color, &cat, &seats, &trans, &fuel, &desc,
			&img, &deposit, &slug, &title, &fcity, &rating, &owner, &avatarURL,
			&rentalTermsJSON,
		) == nil {
			var terms []RentalTerm
			if len(rentalTermsJSON) > 0 {
				_ = json.Unmarshal(rentalTermsJSON, &terms)
			}
			if terms == nil {
				terms = []RentalTerm{}
			}

			out = append(out, map[string]any{
				"id": id, "owner_id": ownerID, "brand": brand, "model": model,
				"year": year, "location": loc, "daily_price": price,
				"mileage": mileage, "color": color, "category": cat,
				"seats": seats, "transmission": trans, "fuel": fuel,
				"description": desc, "image_url": img, "deposit": deposit,
				"fleet_slug": slug, "fleet_title": title, "fleet_city": fcity,
				"fleet_rating": rating, "owner": owner, "fleet_avatar_url": avatarURL,
				"rental_terms": terms,
			})
		}
	}
	write(w, 200, out)
}

// ============== PUBLIC CAR (one) ==============

func (a *App) publicCar(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/public/cars/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	var c map[string]any
	var brand, model, loc, color, cat, trans, fuel, desc, img, slug, title, fcity, owner, avatarURL string
	var year, seats, mileage int
	var price, deposit, rating float64
	var rentalTermsJSON []byte
	err = a.db.QueryRow(r.Context(), `SELECT c.brand,c.model,c.year,c.location,c.daily_price,c.mileage,c.color,c.category,c.seats,c.transmission,c.fuel,c.description,c.image_url,c.deposit,fp.slug,fp.title,fp.city,fp.rating,u.name,fp.avatar_url,c.rental_terms FROM cars c JOIN fleet_profiles fp ON fp.owner_id=c.owner_id JOIN users u ON u.id=c.owner_id WHERE c.id=$1 AND c.public_enabled AND fp.published`, id).Scan(&brand, &model, &year, &loc, &price, &mileage, &color, &cat, &seats, &trans, &fuel, &desc, &img, &deposit, &slug, &title, &fcity, &rating, &owner, &avatarURL, &rentalTermsJSON)
	if err != nil {
		write(w, 404, map[string]string{"error": "автомобиль не найден"})
		return
	}
	var terms []RentalTerm
	if len(rentalTermsJSON) > 0 {
		_ = json.Unmarshal(rentalTermsJSON, &terms)
	}
	if terms == nil {
		terms = []RentalTerm{}
	}
	c = map[string]any{
		"id": id, "brand": brand, "model": model, "year": year,
		"location": loc, "daily_price": price, "mileage": mileage,
		"color": color, "category": cat, "seats": seats,
		"transmission": trans, "fuel": fuel, "description": desc,
		"image_url": img, "deposit": deposit,
		"fleet_slug": slug, "fleet_title": title, "fleet_city": fcity,
		"fleet_rating": rating, "owner": owner, "fleet_avatar_url": avatarURL,
		"rental_terms": terms,
	}
	write(w, 200, c)
}

// ============== AVAILABILITY ==============

func (a *App) publicAvailabilityDates(w http.ResponseWriter, r *http.Request) {
	carID, err := strconv.ParseInt(r.URL.Query().Get("car_id"), 10, 64)
	if err != nil {
		write(w, 422, map[string]string{"error": "car_id required"})
		return
	}
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	if from == "" || to == "" {
		write(w, 422, map[string]string{"error": "from and to required"})
		return
	}
	start, err := time.Parse("2006-01-02", from)
	if err != nil {
		write(w, 422, map[string]string{"error": "invalid from"})
		return
	}
	end, err := time.Parse("2006-01-02", to)
	if err != nil || !end.After(start) {
		write(w, 422, map[string]string{"error": "invalid to"})
		return
	}
	rows, err := a.db.Query(r.Context(), `SELECT to_char(gs,'YYYY-MM-DD') FROM rentals r CROSS JOIN LATERAL generate_series(date(r.starts_at), date(r.ends_at) - 1, interval '1 day') gs WHERE r.car_id=$1 AND r.status IN ('hold','pending','review','confirmed','preparing','active') AND (r.status<>'hold' OR r.hold_expires_at IS NULL OR r.hold_expires_at>now()) AND gs >= $2::date AND gs <= $3::date ORDER BY gs`, carID, start.Format("2006-01-02"), end.Format("2006-01-02"))
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	blocked := []string{}
	for rows.Next() {
		var d string
		if rows.Scan(&d) == nil {
			blocked = append(blocked, d)
		}
	}
	write(w, 200, map[string]any{"blocked": blocked, "from": from, "to": to})
}

func (a *App) publicAvailability(w http.ResponseWriter, r *http.Request) {
	carID, err := strconv.ParseInt(r.URL.Query().Get("car_id"), 10, 64)
	if err != nil {
		write(w, 422, map[string]string{"error": "car_id required"})
		return
	}
	st, en, err := parseRangeValues(r)
	if err != nil {
		write(w, 422, map[string]string{"error": "некорректные даты"})
		return
	}
	var blocked bool
	err = a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM rentals WHERE car_id=$1 AND status IN ('hold','pending','review','confirmed','active') AND (status<>'hold' OR hold_expires_at IS NULL OR hold_expires_at>now()) AND starts_at < $3 AND ends_at > $2)`, carID, st, en).Scan(&blocked)
	if err != nil {
		write(w, 500, map[string]string{"error": err.Error()})
		return
	}
	write(w, 200, map[string]any{"available": !blocked, "from": st, "to": en})
}

// ============== HELPERS ==============

func nullableTime(t time.Time) any {
	if t.IsZero() {
		return nil
	}
	return t
}