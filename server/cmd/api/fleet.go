package main

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// ============== FLEET PROFILE ==============

func (a *App) fleetProfile(w http.ResponseWriter, r *http.Request) {
	owner := userID(r.Context())
	if r.Method == "PATCH" || r.Method == "POST" {
		var in struct {
			Slug        string `json:"slug"`
			Title       string `json:"title"`
			Description string `json:"description"`
			City        string `json:"city"`
			Published   bool   `json:"published"`
		}
		if decode(r, &in) != nil {
			write(w, 400, map[string]string{"error": "invalid json"})
			return
		}
		in.Slug = strings.TrimSpace(in.Slug)
		if in.Slug == "" {
			in.Slug = "fleet-" + strconv.FormatInt(owner, 10)
		}
		if in.Title == "" {
			in.Title = "Мой автопарк"
		}
		city := first(in.City, "Москва")
		_, err := a.db.Exec(r.Context(), `INSERT INTO fleet_profiles(owner_id,slug,title,description,city,published,updated_at) VALUES($1,$2,$3,$4,$5,$6,now()) ON CONFLICT(owner_id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,description=EXCLUDED.description,city=EXCLUDED.city,published=EXCLUDED.published,updated_at=now()`, owner, in.Slug, in.Title, strings.TrimSpace(in.Description), city, in.Published)
		if err != nil {
			write(w, 409, map[string]string{"error": "не удалось сохранить страницу автопарка; slug должен быть уникальным"})
			return
		}
		// Sync owner's profile with the storefront.
		_, err = a.db.Exec(r.Context(), `UPDATE users SET city=$1,company_name=$2,updated_at=now() WHERE id=$3`, city, in.Title, owner)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось синхронизировать профиль владельца"})
			return
		}
	}
	var id int64
	var slug, title, desc, city, avatarURL string
	var published bool
	var rating float64
	err := a.db.QueryRow(r.Context(),
		`SELECT id,slug,title,description,city,published,rating,avatar_url
     FROM fleet_profiles WHERE owner_id=$1`, owner).
		Scan(&id, &slug, &title, &desc, &city, &published, &rating, &avatarURL)
	if err != nil {
		_, _ = a.db.Exec(r.Context(), `INSERT INTO fleet_profiles(owner_id,slug,title,city,published) SELECT $1,$2,$3,COALESCE(NULLIF(city,''),'Москва'),true FROM users WHERE id=$1`, owner, "fleet-"+strconv.FormatInt(owner, 10), "Мой автопарк")
		a.db.QueryRow(r.Context(),
			`SELECT id,slug,title,description,city,published,rating,avatar_url
		FROM fleet_profiles WHERE owner_id=$1`, owner).
			Scan(&id, &slug, &title, &desc, &city, &published, &rating, &avatarURL)
	}
	write(w, 200, map[string]any{
		"id": id, "slug": slug, "title": title, "description": desc,
		"city": city, "published": published, "rating": rating,
		"avatar_url": avatarURL,
	})
}

// ============== FLEET AVATAR (upload / delete) ==============

func (a *App) fleetAvatar(w http.ResponseWriter, r *http.Request) {
	owner := userID(r.Context())

	switch r.Method {
	case "POST":
		r.Body = http.MaxBytesReader(w, r.Body, 4<<20)
		if err := r.ParseMultipartForm(4 << 20); err != nil {
			write(w, 413, map[string]string{"error": "файл слишком большой (макс 4 МБ)"})
			return
		}

		file, header, err := r.FormFile("avatar")
		if err != nil {
			write(w, 400, map[string]string{"error": "выберите изображение"})
			return
		}
		defer file.Close()

		if header.Size > 3<<20 {
			write(w, 413, map[string]string{"error": "максимум 3 МБ"})
			return
		}

		contentType := header.Header.Get("Content-Type")
		allowed := map[string]string{
			"image/jpeg": ".jpg",
			"image/png":  ".png",
			"image/webp": ".webp",
		}
		ext, ok := allowed[contentType]
		if !ok {
			write(w, 415, map[string]string{"error": "поддерживаются JPG, PNG, WebP"})
			return
		}

		// Magic bytes
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

		// Delete old avatar
		var oldURL string
		_ = a.db.QueryRow(r.Context(),
			`SELECT avatar_url FROM fleet_profiles WHERE owner_id=$1`, owner).
			Scan(&oldURL)
		if oldURL != "" {
			_ = os.Remove(filepath.Join(appDir(), strings.TrimPrefix(oldURL, "/")))
		}

		// Save new avatar
		var rb [12]byte
		if _, err := rand.Read(rb[:]); err != nil {
			write(w, 500, map[string]string{"error": "ошибка сервера"})
			return
		}
		name := "fleet-" + hex.EncodeToString(rb[:]) + ext
		path := filepath.Join(uploadsDir(), "fleets", name)

		if err := os.MkdirAll(filepath.Join(uploadsDir(), "fleets"), 0o755); err != nil {
			write(w, 500, map[string]string{"error": "ошибка создания папки"})
			return
		}

		dst, err := os.Create(path)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось сохранить файл"})
			return
		}
		if _, err = file.Seek(0, 0); err == nil {
			_, err = io.Copy(dst, file)
		}
		dst.Close()
		if err != nil {
			_ = os.Remove(path)
			write(w, 500, map[string]string{"error": "не удалось сохранить файл"})
			return
		}

		url := "/uploads/fleets/" + name
		_, err = a.db.Exec(r.Context(),
			`UPDATE fleet_profiles SET avatar_url=$1, updated_at=now() WHERE owner_id=$2`,
			url, owner)
		if err != nil {
			_ = os.Remove(path)
			write(w, 500, map[string]string{"error": "не удалось сохранить в БД"})
			return
		}

		write(w, 201, map[string]any{"url": url})

	case "DELETE":
		var oldURL string
		_ = a.db.QueryRow(r.Context(),
			`SELECT avatar_url FROM fleet_profiles WHERE owner_id=$1`, owner).
			Scan(&oldURL)

		_, err := a.db.Exec(r.Context(),
			`UPDATE fleet_profiles SET avatar_url='', updated_at=now() WHERE owner_id=$1`, owner)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось удалить"})
			return
		}

		if oldURL != "" {
			_ = os.Remove(filepath.Join(appDir(), strings.TrimPrefix(oldURL, "/")))
		}
		write(w, 200, map[string]bool{"ok": true})

	default:
		write(w, 405, map[string]string{"error": "method not allowed"})
	}
}