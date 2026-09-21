package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func isValidImage(b []byte) bool {
	if len(b) < 12 {
		return false
	}
	// JPEG: FF D8 FF
	if b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF {
		return true
	}
	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 &&
		b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A {
		return true
	}
	// WebP: RIFF ... WEBP
	if b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' &&
		b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P' {
		return true
	}
	return false
}

// ============== CARS: list / create ==============

func (a *App) cars(w http.ResponseWriter, r *http.Request) {
	id := userID(r.Context())
	switch r.Method {
	case "GET":
		rows, err := a.db.Query(r.Context(), `SELECT 
		c.id, c.brand, c.model, c.plate, c.year, c.status, c.revenue,
		c.location, c.daily_price, c.mileage, c.color, c.vin,
		c.public_enabled, c.category, c.seats, c.transmission, c.fuel,
		c.description, c.image_url, c.deposit, c.engine_volume,
		c.horsepower, c.drive_type, c.fuel_consumption, c.tank_volume,
		c.maintenance_interval,
		COALESCE((SELECT sum(e.amount) FROM car_expenses e WHERE e.car_id=c.id),0),
		COALESCE((SELECT sum(COALESCE(r.final_total,r.amount,0)) FROM rentals r WHERE r.car_id=c.id AND r.status NOT IN ('cancelled','rejected','expired')),0),
		c.rental_terms
	FROM cars c WHERE c.owner_id=$1 ORDER BY c.id DESC`, id)
		if err != nil {
			write(w, 500, map[string]string{"error": err.Error()})
			return
		}
		defer rows.Close()
		out := []Car{}
		for rows.Next() {
			var c Car
			var rentalTermsJSON []byte
			if err := rows.Scan(
				&c.ID, &c.Brand, &c.Model, &c.Plate, &c.Year, &c.Status,
				&c.Revenue, &c.Location, &c.DailyPrice, &c.Mileage,
				&c.Color, &c.VIN, &c.PublicEnabled, &c.Category,
				&c.Seats, &c.Transmission, &c.Fuel, &c.Description,
				&c.ImageURL, &c.Deposit, &c.EngineVolume, &c.Horsepower,
				&c.DriveType, &c.FuelConsumption, &c.TankVolume,
				&c.MaintenanceInterval, &c.Expenses, &c.Earnings,
				&rentalTermsJSON,
			); err == nil {
				if len(rentalTermsJSON) > 0 {
					_ = json.Unmarshal(rentalTermsJSON, &c.RentalTerms)
				}
				if c.RentalTerms == nil {
					c.RentalTerms = []RentalTerm{}
				}
				out = append(out, c)
			}
		}
		write(w, 200, out)

	case "POST":
		var c Car
		if err := decode(r, &c); err != nil {
			write(w, 400, map[string]string{"error": err.Error()})
			return
		}
		if strings.TrimSpace(c.Brand) == "" || strings.TrimSpace(c.Model) == "" || strings.TrimSpace(c.Plate) == "" || c.Year < 1990 {
			write(w, 422, map[string]string{"error": "заполните марку, модель, госномер и год"})
			return
		}

		planInfo, err := a.getPlanInfo(r.Context(), id)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось получить план"})
			return
		}

		var currentCount int
		_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM cars WHERE owner_id=$1`, id).Scan(&currentCount)
		if currentCount >= planInfo.Limit {
			write(w, 402, map[string]any{
				"error": fmt.Sprintf(
					"Достигнут лимит тарифа %s: %d автомобилей. Обновите план, чтобы добавить ещё.",
					planInfo.Plan, planInfo.Limit,
				),
				"code":    "limit_reached",
				"plan":    planInfo.Plan,
				"limit":   planInfo.Limit,
				"current": currentCount,
			})
			return
		}
		rentalTermsJSON, _ := json.Marshal(c.RentalTerms)
		if c.RentalTerms == nil {
			rentalTermsJSON = []byte("[]")
		}
		err = a.db.QueryRow(r.Context(), `
			INSERT INTO cars(
				owner_id,brand,model,plate,year,status,location,daily_price,
				mileage,color,vin,public_enabled,category,seats,transmission,
				fuel,description,image_url,deposit,engine_volume,horsepower,
				drive_type,fuel_consumption,tank_volume,maintenance_interval,
				rental_terms
			) VALUES(
				$1,$2,$3,$4,$5,'available',$6,$7,$8,$9,$10,$11,$12,$13,$14,
				$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb
			) RETURNING id`,
			id,
			strings.TrimSpace(c.Brand),
			strings.TrimSpace(c.Model),
			strings.ToUpper(strings.TrimSpace(c.Plate)),
			c.Year,
			first(c.Location, "Москва"),
			c.DailyPrice,
			c.Mileage,
			strings.TrimSpace(c.Color),
			strings.TrimSpace(c.VIN),
			c.PublicEnabled || true,
			first(c.Category, "Седан"),
			maxInt(c.Seats, 5),
			first(c.Transmission, "Автомат"),
			first(c.Fuel, "Бензин"),
			strings.TrimSpace(c.Description),
			strings.TrimSpace(c.ImageURL),
			c.Deposit,
			strings.TrimSpace(c.EngineVolume),
			c.Horsepower,
			strings.TrimSpace(c.DriveType),
			strings.TrimSpace(c.FuelConsumption),
			strings.TrimSpace(c.TankVolume),
			c.MaintenanceInterval,
			string(rentalTermsJSON),
		).Scan(&c.ID)
		if err != nil {
			write(w, 409, map[string]string{"error": "не удалось добавить автомобиль"})
			return
		}
		c.Status = "available"
		write(w, 201, c)

	default:
		write(w, 405, map[string]string{"error": "method not allowed"})
	}
}

// ============== CAR BY ID: patch / delete ==============

func (a *App) carByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/cars/"), 10, 64)
	if err != nil {
		write(w, 400, map[string]string{"error": "bad id"})
		return
	}
	owner := userID(r.Context())

	if r.Method == "PATCH" {
		var in struct {
			Status              *string       `json:"status"`
			DailyPrice          *float64      `json:"daily_price"`
			Location            *string       `json:"location"`
			Mileage             *int          `json:"mileage"`
			PublicEnabled       *bool         `json:"public_enabled"`
			Category            *string       `json:"category"`
			Seats               *int          `json:"seats"`
			Transmission        *string       `json:"transmission"`
			Fuel                *string       `json:"fuel"`
			Description         *string       `json:"description"`
			ImageURL            *string       `json:"image_url"`
			Deposit             *float64      `json:"deposit"`
			EngineVolume        *string       `json:"engine_volume"`
			Horsepower          *int          `json:"horsepower"`
			DriveType           *string       `json:"drive_type"`
			FuelConsumption     *string       `json:"fuel_consumption"`
			TankVolume          *string       `json:"tank_volume"`
			MaintenanceInterval *int          `json:"maintenance_interval"`
			RentalTerms         *[]RentalTerm `json:"rental_terms"`
		}
		if decode(r, &in) != nil {
			write(w, 400, map[string]string{"error": "invalid json"})
			return
		}

		if in.Status != nil {
			s := *in.Status
			if !contains([]string{"available", "rented", "maintenance"}, s) {
				write(w, 422, map[string]string{"error": "недопустимый статус"})
				return
			}
		}
		if in.DailyPrice != nil && *in.DailyPrice < 0 {
			write(w, 422, map[string]string{"error": "цена не может быть отрицательной"})
			return
		}
		if in.Mileage != nil && *in.Mileage < 0 {
			write(w, 422, map[string]string{"error": "пробег не может быть отрицательным"})
			return
		}
		if in.Seats != nil && *in.Seats < 1 {
			write(w, 422, map[string]string{"error": "мест должно быть минимум 1"})
			return
		}
		var rentalTermsJSON []byte
		if in.RentalTerms != nil {
			rentalTermsJSON, _ = json.Marshal(*in.RentalTerms)
		}

		tag, err := a.db.Exec(r.Context(), `
		UPDATE cars SET
			status               = COALESCE($1, status),
			daily_price          = COALESCE($2, daily_price),
			location             = COALESCE($3, location),
			mileage              = COALESCE($4, mileage),
			public_enabled       = COALESCE($5, public_enabled),
			category             = COALESCE($6, category),
			seats                = COALESCE($7, seats),
			transmission         = COALESCE($8, transmission),
			fuel                 = COALESCE($9, fuel),
			description          = COALESCE($10, description),
			image_url            = COALESCE($11, image_url),
			deposit              = COALESCE($12, deposit),
			engine_volume        = COALESCE($13, engine_volume),
			horsepower           = COALESCE($14, horsepower),
			drive_type           = COALESCE($15, drive_type),
			fuel_consumption     = COALESCE($16, fuel_consumption),
			tank_volume          = COALESCE($17, tank_volume),
			maintenance_interval = COALESCE($18, maintenance_interval),
			rental_terms         = COALESCE($19::jsonb, rental_terms)
		WHERE id=$20 AND owner_id=$21`,
			in.Status, in.DailyPrice, in.Location, in.Mileage,
			in.PublicEnabled, in.Category, in.Seats, in.Transmission,
			in.Fuel, in.Description, in.ImageURL, in.Deposit,
			in.EngineVolume, in.Horsepower, in.DriveType,
			in.FuelConsumption, in.TankVolume, in.MaintenanceInterval,
			nullableJSON(rentalTermsJSON),
			id, owner)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось обновить автомобиль"})
			return
		}
		if tag.RowsAffected() == 0 {
			write(w, 404, map[string]string{"error": "автомобиль не найден"})
			return
		}
		write(w, 200, map[string]bool{"ok": true})
		return
	}

	if r.Method == "DELETE" {
		rows, _ := a.db.Query(r.Context(),
			`SELECT url FROM car_photos WHERE car_id=$1`, id)
		var photoURLs []string
		if rows != nil {
			for rows.Next() {
				var u string
				if rows.Scan(&u) == nil {
					photoURLs = append(photoURLs, u)
				}
			}
			rows.Close()
		}

		tag, err := a.db.Exec(r.Context(),
			`DELETE FROM cars WHERE id=$1 AND owner_id=$2`, id, owner)
		if err != nil || tag.RowsAffected() == 0 {
			write(w, 404, map[string]string{"error": "автомобиль не найден"})
			return
		}

		for _, u := range photoURLs {
			_ = os.Remove(filepath.Join(appDir(), strings.TrimPrefix(u, "/")))
		}

		write(w, 200, map[string]bool{"ok": true})
		return
	}

	write(w, 405, map[string]string{"error": "method not allowed"})
}

// ============== CAR PHOTOS ==============

func (a *App) carPhotos(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/car-photos/"), 10, 64)
	if err != nil || id <= 0 {
		write(w, 400, map[string]string{"error": "bad car id"})
		return
	}
	owner := userID(r.Context())
	var owns bool
	if err := a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM cars WHERE id=$1 AND owner_id=$2)`, id, owner).Scan(&owns); err != nil || !owns {
		write(w, 404, map[string]string{"error": "автомобиль не найден"})
		return
	}
	switch r.Method {
	case "GET":
		rows, err := a.db.Query(r.Context(), `SELECT id,url,filename,created_at FROM car_photos WHERE car_id=$1 ORDER BY is_primary DESC,id ASC`, id)
		if err != nil {
			write(w, 500, map[string]string{"error": err.Error()})
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var pid int64
			var url, filename string
			var created time.Time
			if err := rows.Scan(&pid, &url, &filename, &created); err == nil {
				out = append(out, map[string]any{"id": pid, "url": url, "filename": filename, "created_at": created})
			}
		}
		write(w, 200, out)

	case "POST":
		r.Body = http.MaxBytesReader(w, r.Body, 12<<20)
		if err := r.ParseMultipartForm(12 << 20); err != nil {
			write(w, 413, map[string]string{"error": "файл слишком большой"})
			return
		}
		file, header, err := r.FormFile("photo")
		if err != nil {
			write(w, 400, map[string]string{"error": "выберите фотографию"})
			return
		}
		defer file.Close()
		if header.Size > 10<<20 {
			write(w, 413, map[string]string{"error": "максимальный размер фото — 10 МБ"})
			return
		}
		contentType := header.Header.Get("Content-Type")
		allowed := map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
		ext, ok := allowed[contentType]
		if !ok {
			write(w, 415, map[string]string{"error": "поддерживаются JPG, PNG и WebP"})
			return
		}
		var buf [16]byte
		if _, err := file.Read(buf[:]); err != nil {
			write(w, 400, map[string]string{"error": "не удалось прочитать файл"})
			return
		}
		if _, err := file.Seek(0, 0); err != nil {
			write(w, 400, map[string]string{"error": "не удалось обработать файл"})
			return
		}
		if !isValidImage(buf[:]) {
			write(w, 415, map[string]string{"error": "файл не является изображением"})
			return
		}
		var existingCount int
		_ = a.db.QueryRow(r.Context(),
			`SELECT count(*) FROM car_photos WHERE car_id=$1`, id).Scan(&existingCount)
		if existingCount >= 10 {
			write(w, 422, map[string]string{"error": "максимум 10 фото на автомобиль"})
			return
		}
		var rb [12]byte
		if _, err := rand.Read(rb[:]); err != nil {
			write(w, 500, map[string]string{"error": "не удалось создать имя файла"})
			return
		}
		name := hex.EncodeToString(rb[:]) + ext
		path := filepath.Join(uploadsDir(), "cars", name)
		dst, err := os.Create(path)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось сохранить фото"})
			return
		}
		if _, err = file.Seek(0, 0); err == nil {
			_, err = io.Copy(dst, file)
		}
		dst.Close()
		if err != nil {
			_ = os.Remove(path)
			write(w, 500, map[string]string{"error": "не удалось сохранить фото"})
			return
		}
		url := "/uploads/cars/" + name
		var pid int64
		var count int
		_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM car_photos WHERE car_id=$1`, id).Scan(&count)
		if err := a.db.QueryRow(r.Context(), `INSERT INTO car_photos(car_id,url,filename,is_primary) VALUES($1,$2,$3,$4) RETURNING id`, id, url, header.Filename, count == 0).Scan(&pid); err != nil {
			_ = os.Remove(path)
			write(w, 500, map[string]string{"error": "не удалось сохранить запись фото"})
			return
		}
		if count == 0 {
			_, _ = a.db.Exec(r.Context(), `UPDATE cars SET image_url=$1 WHERE id=$2 AND owner_id=$3`, url, id, owner)
		}
		write(w, 201, map[string]any{"id": pid, "url": url, "filename": header.Filename})

	case "DELETE":
		photoID, err := strconv.ParseInt(r.URL.Query().Get("photo_id"), 10, 64)
		if err != nil || photoID <= 0 {
			write(w, 400, map[string]string{"error": "bad photo id"})
			return
		}
		var url string
		if err := a.db.QueryRow(r.Context(), `DELETE FROM car_photos WHERE id=$1 AND car_id=$2 RETURNING url`, photoID, id).Scan(&url); err != nil {
			write(w, 404, map[string]string{"error": "фото не найдено"})
			return
		}
		_ = os.Remove(filepath.Join(appDir(), strings.TrimPrefix(url, "/")))
		var primary string
		_ = a.db.QueryRow(r.Context(), `SELECT url FROM car_photos WHERE car_id=$1 ORDER BY id ASC LIMIT 1`, id).Scan(&primary)
		_, _ = a.db.Exec(r.Context(), `UPDATE car_photos SET is_primary=false WHERE car_id=$1`, id)
		if primary != "" {
			_, _ = a.db.Exec(r.Context(), `UPDATE car_photos SET is_primary=true WHERE car_id=$1 AND url=$2`, id, primary)
		}
		_, _ = a.db.Exec(r.Context(), `UPDATE cars SET image_url=COALESCE((SELECT url FROM car_photos WHERE car_id=$1 AND is_primary LIMIT 1),'') WHERE id=$1 AND owner_id=$2`, id, owner)
		write(w, 200, map[string]bool{"ok": true})

	default:
		write(w, 405, map[string]string{"error": "method not allowed"})
	}
}

// ============== CAR FINANCE ==============

func (a *App) carFinance(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/api/car-finance/"), 10, 64)
	if err != nil || id <= 0 {
		write(w, 400, map[string]string{"error": "bad car id"})
		return
	}
	owner := userID(r.Context())
	var owns bool
	if err := a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM cars WHERE id=$1 AND owner_id=$2)`, id, owner).Scan(&owns); err != nil || !owns {
		write(w, 404, map[string]string{"error": "автомобиль не найден"})
		return
	}

	if r.Method == "GET" {
		var earnings, expenses float64
		_ = a.db.QueryRow(r.Context(), `SELECT COALESCE(sum(COALESCE(final_total,amount,0)),0) FROM rentals WHERE car_id=$1 AND status NOT IN ('cancelled','rejected','expired')`, id).Scan(&earnings)
		_ = a.db.QueryRow(r.Context(), `SELECT COALESCE(sum(amount),0) FROM car_expenses WHERE car_id=$1`, id).Scan(&expenses)
		rows, _ := a.db.Query(r.Context(), `SELECT id,amount,expense_type,note,created_at FROM car_expenses WHERE car_id=$1 ORDER BY created_at DESC,id DESC`, id)
		expensesList := []map[string]any{}
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var x int64
				var amount float64
				var category, note string
				var at time.Time
				if rows.Scan(&x, &amount, &category, &note, &at) == nil {
					expensesList = append(expensesList, map[string]any{"id": x, "amount": amount, "category": category, "note": note, "created_at": at})
				}
			}
		}
		dealsRows, _ := a.db.Query(r.Context(), `SELECT id,COALESCE(booking_code,''),client_name,COALESCE(final_total,amount),starts_at FROM rentals WHERE car_id=$1 AND status NOT IN ('cancelled','rejected','expired') ORDER BY starts_at DESC NULLS LAST,id DESC LIMIT 30`, id)
		deals := []map[string]any{}
		if dealsRows != nil {
			defer dealsRows.Close()
			for dealsRows.Next() {
				var x int64
				var code, client string
				var amount float64
				var at *time.Time
				if dealsRows.Scan(&x, &code, &client, &amount, &at) == nil {
					deals = append(deals, map[string]any{"id": x, "code": code, "client": client, "amount": amount, "starts_at": at})
				}
			}
		}
		write(w, 200, map[string]any{"earnings": earnings, "expenses_total": expenses, "net": earnings - expenses, "expenses": expensesList, "deals": deals})
		return
	}
	if r.Method == "POST" {
		var in struct {
			Amount   float64 `json:"amount"`
			Category string  `json:"category"`
			Note     string  `json:"note"`
		}
		if decode(r, &in) != nil || in.Amount <= 0 {
			write(w, 422, map[string]string{"error": "укажите положительную сумму расхода"})
			return
		}
		_, err = a.db.Exec(r.Context(), `INSERT INTO car_expenses(owner_id,car_id,amount,expense_type,note) VALUES($1,$2,$3,$4,$5)`, owner, id, in.Amount, strings.TrimSpace(in.Category), strings.TrimSpace(in.Note))
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось сохранить расход"})
			return
		}
		write(w, 201, map[string]bool{"ok": true})
		return
	}
	if r.Method == "DELETE" {
		expenseID, e := strconv.ParseInt(r.URL.Query().Get("expense_id"), 10, 64)
		if e != nil || expenseID <= 0 {
			write(w, 400, map[string]string{"error": "bad expense id"})
			return
		}
		if _, e = a.db.Exec(r.Context(), `DELETE FROM car_expenses WHERE id=$1 AND car_id=$2`, expenseID, id); e != nil {
			write(w, 500, map[string]string{"error": "не удалось удалить расход"})
			return
		}
		write(w, 200, map[string]bool{"ok": true})
		return
	}
	write(w, 405, map[string]string{"error": "method not allowed"})
}