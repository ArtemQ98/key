package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

func normalizePhone(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	n := b.String()
	if strings.HasPrefix(n, "8") && len(n) == 11 {
		n = "7" + n[1:]
	}
	if strings.HasPrefix(n, "7") && len(n) == 11 {
		return "+" + n
	}
	return s
}

func validEmail(s string) bool {
	return strings.Contains(s, "@") && strings.Contains(s, ".")
}

// ============== OWNER: register / login ==============

func (a *App) register(w http.ResponseWriter, r *http.Request) {
	var in struct{ Name, Phone, Email, Password, City, CompanyName string }
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Phone = normalizePhone(strings.TrimSpace(in.Phone))
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Name == "" || len(in.Password) < 8 || len(in.Phone) < 12 {
		write(w, 422, map[string]string{"error": "имя, телефон и пароль (8+ символов) обязательны"})
		return
	}
	if in.Email != "" && !validEmail(in.Email) {
		write(w, 422, map[string]string{"error": "некорректный email"})
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	var id int64
	err := a.db.QueryRow(r.Context(), `
		INSERT INTO users(name,phone,email,password_hash,role,city,company_name)
		VALUES($1,$2,NULLIF($3,''),$4,'owner',$5,$6)
		RETURNING id`, in.Name, in.Phone, in.Email, string(hash), first(in.City, "Москва"), strings.TrimSpace(in.CompanyName)).Scan(&id)
	if err != nil {
		write(w, 409, map[string]string{"error": "телефон или email уже зарегистрирован"})
		return
	}
	city := first(in.City, "Москва")
	slugBase := slugify(in.CompanyName)
	if slugBase == "" {
		slugBase = slugify(in.Name)
	}
	if slugBase == "" {
		slugBase = "fleet"
	}
	slug := slugBase + "-" + strconv.FormatInt(id, 10)
	_, _ = a.db.Exec(r.Context(), `INSERT INTO fleet_profiles(owner_id,slug,title,description,city,published,rating) VALUES($1,$2,$3,'', $4, true, 5.00) ON CONFLICT(owner_id) DO UPDATE SET city=EXCLUDED.city,published=true`, id, slug, first(in.CompanyName, in.Name), city)

	token, _ := a.token(id, "owner")
	write(w, 201, map[string]any{
		"token": token,
		"user": User{
			ID: id, Name: in.Name, Email: in.Email, Phone: in.Phone,
			Role: "owner", City: city, CompanyName: in.CompanyName,
			Plan: "free", CarsLimit: 3,
		},
	})
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
	ip := clientIP(r)
	if !a.rlLogin.allow("login-ip:" + ip) {
		write(w, 429, map[string]string{"error": "слишком много попыток входа"})
		return
	}
	var in struct{ Identifier, Password string }
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	if !a.rlLogin.allow("login-id:" + strings.ToLower(strings.TrimSpace(in.Identifier))) {
		write(w, 429, map[string]string{"error": "слишком много попыток для этого аккаунта"})
		return
	}
	idf := strings.TrimSpace(in.Identifier)
	phone := normalizePhone(idf)
	var u User
	var hash string
	err := a.db.QueryRow(r.Context(), `
    	SELECT id,name,COALESCE(email,''),COALESCE(phone,''),phone_verified,role,city,company_name,password_hash,plan,cars_limit,plan_expires_at
    	FROM users WHERE email=lower($1) OR phone=$2`, idf, phone).
		Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.PhoneVerified, &u.Role, &u.City, &u.CompanyName, &hash, &u.Plan, &u.CarsLimit, &u.PlanExpiresAt)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		write(w, 401, map[string]string{"error": "неверный телефон/email или пароль"})
		return
	}
	t, _ := a.token(u.ID, u.Role)
	write(w, 200, map[string]any{"token": t, "user": u})
}

// ============== CUSTOMER: register / login ==============

func (a *App) customerRegister(w http.ResponseWriter, r *http.Request) {
	if !a.rlRegister.allow("reg-ip:" + clientIP(r)) {
		write(w, 429, map[string]string{"error": "слишком много регистраций с этого IP"})
		return
	}
	var in struct{ Name, Phone, Email, Password string }
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Phone = normalizePhone(strings.TrimSpace(in.Phone))
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Name == "" || len(in.Phone) < 12 || len(in.Password) < 8 {
		write(w, 422, map[string]string{"error": "имя, телефон и пароль (8+ символов) обязательны"})
		return
	}
	if in.Email != "" && !validEmail(in.Email) {
		write(w, 422, map[string]string{"error": "некорректный email"})
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	var id int64
	err := a.db.QueryRow(r.Context(), `INSERT INTO users(name,phone,email,password_hash,role,city,company_name) VALUES($1,$2,NULLIF($3,''),$4,'customer','', '') RETURNING id`, in.Name, in.Phone, in.Email, string(hash)).Scan(&id)
	if err != nil {
		write(w, 409, map[string]string{"error": "телефон или email уже зарегистрирован"})
		return
	}
	t, _ := a.token(id, "customer")
	write(w, 201, map[string]any{"token": t, "user": map[string]any{"id": id, "name": in.Name, "phone": in.Phone, "email": in.Email, "role": "customer"}})
}

func (a *App) customerLogin(w http.ResponseWriter, r *http.Request) {
	if !a.rlLogin.allow("clogin-ip:" + clientIP(r)) {
		write(w, 429, map[string]string{"error": "слишком много попыток входа"})
		return
	}
	var in struct{ Identifier, Password string }
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}
	if !a.rlLogin.allow("clogin-id:" + strings.ToLower(strings.TrimSpace(in.Identifier))) {
		write(w, 429, map[string]string{"error": "слишком много попыток для этого аккаунта"})
		return
	}
	idf := strings.TrimSpace(in.Identifier)
	phone := normalizePhone(idf)
	var u User
	var hash string
	err := a.db.QueryRow(r.Context(),
		`SELECT id,name,COALESCE(email,''),COALESCE(phone,''),phone_verified,role,city,company_name,password_hash,plan,cars_limit,plan_expires_at
     	FROM users WHERE role='customer' AND (email=lower($1) OR phone=$2)`, idf, phone).
		Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.PhoneVerified, &u.Role, &u.City, &u.CompanyName, &hash, &u.Plan, &u.CarsLimit, &u.PlanExpiresAt)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		write(w, 401, map[string]string{"error": "неверный телефон/email или пароль"})
		return
	}
	t, _ := a.token(u.ID, u.Role)
	write(w, 200, map[string]any{"token": t, "user": u})
}

// ============== EMAIL CODE FLOW: request-code / verify-code ==============

func (a *App) requestCode(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Phone string `json:"phone"`
		Email string `json:"email"`
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(in.Email))
	phone := ""

	if email != "" {
		if !validEmail(email) {
			write(w, 422, map[string]string{"error": "некорректный email"})
			return
		}
	} else if in.Phone != "" {
		phone = normalizePhone(strings.TrimSpace(in.Phone))
		if len(phone) < 12 {
			write(w, 422, map[string]string{"error": "invalid phone"})
			return
		}
	} else {
		write(w, 422, map[string]string{"error": "укажите email"})
		return
	}

	if !a.rlSendCode.allow("send-ip:" + clientIP(r)) {
		write(w, 429, map[string]string{"error": "слишком много запросов, попробуйте позже"})
		return
	}

	key := email
	if key == "" {
		key = "phone:" + phone
	}
	if !a.rlSendCode.allow("send:" + key) {
		write(w, 429, map[string]string{"error": "слишком много запросов"})
		return
	}

	code, err := randomCode()
	if err != nil {
		write(w, 500, map[string]string{"error": "не удалось создать код"})
		return
	}

	if email != "" {
		_, _ = a.db.Exec(r.Context(),
			`UPDATE auth_codes SET used_at=now() WHERE email=$1 AND used_at IS NULL`, email)
		_, err = a.db.Exec(r.Context(),
			`INSERT INTO auth_codes(email,code_hash,expires_at)
			 VALUES($1,$2,now()+interval '5 minutes')`,
			email, hashCode(code))
	} else {
		_, _ = a.db.Exec(r.Context(),
			`UPDATE auth_codes SET used_at=now() WHERE phone=$1 AND used_at IS NULL`, phone)
		_, err = a.db.Exec(r.Context(),
			`INSERT INTO auth_codes(phone,code_hash,expires_at)
			 VALUES($1,$2,now()+interval '5 minutes')`,
			phone, hashCode(code))
	}
	if err != nil {
		log.Printf("requestCode insert failed (email=%q phone=%q): %v", email, phone, err)
		write(w, 500, map[string]string{"error": "не удалось создать код"})
		return
	}

	if isProd() {
		if email != "" {
			if err := sendEmailCode(email, code); err != nil {
				log.Printf("email send failed: %v", err)
				write(w, 500, map[string]string{"error": "не удалось отправить код"})
				return
			}
		} else {
			log.Printf("SMS channel disabled: phone=%s code=%s", phone, code)
		}
	}

	channel := "email"
	if email == "" {
		channel = "sms"
	}

	resp := map[string]any{
		"message": "code sent",
		"channel": channel,
	}
	if !isProd() {
		resp["dev_code"] = code
	}
	write(w, 200, resp)
}

func (a *App) verifyCodeInternal(w http.ResponseWriter, r *http.Request, defaultRole string, requiredRole string) {
	var in struct {
		Email       string `json:"email"`
		Code        string `json:"code"`
		Name        string `json:"name"`
		Phone       string `json:"phone"`
		CompanyName string `json:"company_name"`
		City        string `json:"city"`
	}
	if decode(r, &in) != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" {
		write(w, 422, map[string]string{"error": "укажите email"})
		return
	}
	if !validEmail(email) {
		write(w, 422, map[string]string{"error": "некорректный email"})
		return
	}

	phone := normalizePhone(strings.TrimSpace(in.Phone))

	code := strings.TrimSpace(in.Code)
	if len(code) != 6 {
		write(w, 422, map[string]string{"error": "код должен состоять из 6 цифр"})
		return
	}

	if !a.rlVerify.allow("verify-ip:" + clientIP(r)) {
		write(w, 429, map[string]string{"error": "слишком много попыток"})
		return
	}
	if !a.rlVerify.allow("verify-email:" + email) {
		write(w, 429, map[string]string{"error": "слишком много попыток на этот email"})
		return
	}

	ctx := r.Context()
	tx, err := a.db.Begin(ctx)
	if err != nil {
		write(w, 500, map[string]string{"error": "transaction error"})
		return
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx,
		`UPDATE auth_codes SET used_at=now()
		 WHERE email=$1 AND code_hash=$2 AND used_at IS NULL AND expires_at>now()`,
		email, hashCode(code))
	if err != nil {
		write(w, 500, map[string]string{"error": "db error"})
		return
	}
	if tag.RowsAffected() == 0 {
		write(w, 401, map[string]string{"error": "неверный или истёкший код"})
		return
	}

	var id int64
	var role string
	err = tx.QueryRow(ctx,
		`SELECT id, role FROM users WHERE email=$1`,
		email).Scan(&id, &role)

	if err == nil {
		// Пользователь найден — проверяем роль
		if requiredRole != "" && role != requiredRole {
			if requiredRole == "customer" {
				write(w, 403, map[string]string{
					"error": "это владелец автопарка. Войдите через /app/login",
				})
				return
			}
			if requiredRole == "owner" {
				write(w, 403, map[string]string{
					"error": "это клиентский аккаунт. Войдите через маркетплейс",
				})
				return
			}
		}
	}

	if err != nil {
		// Новый пользователь — регистрация
		if len(phone) < 12 {
			write(w, 422, map[string]string{"error": "укажите телефон"})
			return
		}

		role = defaultRole
		companyName := strings.TrimSpace(in.CompanyName)
		city := first(strings.TrimSpace(in.City), "Москва")
		userName := first(in.Name, "KEY user")

		err = tx.QueryRow(ctx,
			`INSERT INTO users(name,email,phone,phone_verified,password_hash,role,city,company_name)
			 VALUES($1,$2,$3,false,'',$4,$5,$6)
			 RETURNING id`,
			userName, email, phone, role, city, companyName).Scan(&id)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				if strings.Contains(pgErr.ConstraintName, "phone") {
					write(w, 409, map[string]string{"error": "этот телефон уже зарегистрирован"})
					return
				}
				if strings.Contains(pgErr.ConstraintName, "email") {
					write(w, 409, map[string]string{"error": "этот email уже зарегистрирован"})
					return
				}
			}
			log.Printf("verifyCode insert user failed: %v", err)
			write(w, 500, map[string]string{"error": "не удалось создать пользователя"})
			return
		}

		if role == "owner" {
			slugBase := slugify(companyName)
			if slugBase == "" {
				slugBase = slugify(userName)
			}
			if slugBase == "" {
				slugBase = "fleet"
			}
			slug := slugBase + "-" + strconv.FormatInt(id, 10)

			_, _ = tx.Exec(ctx,
				`INSERT INTO fleet_profiles(owner_id,slug,title,description,city,published,rating)
				 VALUES($1,$2,$3,'',$4,true,5.00)
				 ON CONFLICT(owner_id) DO NOTHING`,
				id, slug, first(companyName, first(userName, "Мой автопарк")), city)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		write(w, 500, map[string]string{"error": "не удалось подтвердить код"})
		return
	}

	t, _ := a.token(id, role)
	write(w, 200, map[string]any{
		"token": t,
		"user": map[string]any{
			"id":    id,
			"email": email,
			"phone": phone,
			"role":  role,
		},
	})
}

func (a *App) verifyCode(w http.ResponseWriter, r *http.Request) {
	a.verifyCodeInternal(w, r, "customer", "customer")
}

func (a *App) verifyCodeOwner(w http.ResponseWriter, r *http.Request) {
	a.verifyCodeInternal(w, r, "owner", "owner")
}

// ============== PROFILE / ME / LEADS ==============

func (a *App) me(w http.ResponseWriter, r *http.Request) {
	var u User
	err := a.db.QueryRow(r.Context(),
		`SELECT id,name,COALESCE(email,''),COALESCE(phone,''),phone_verified,role,city,company_name,plan,cars_limit,plan_expires_at
     	FROM users WHERE id=$1`, userID(r.Context())).
		Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.PhoneVerified, &u.Role, &u.City, &u.CompanyName, &u.Plan, &u.CarsLimit, &u.PlanExpiresAt)
	if err != nil {
		write(w, 404, map[string]string{"error": "user not found"})
		return
	}
	write(w, 200, u)
}

func (a *App) profile(w http.ResponseWriter, r *http.Request) {
	id := userID(r.Context())
	if r.Method == "PATCH" {
		var in struct {
			Name        string `json:"name"`
			Email       string `json:"email"`
			City        string `json:"city"`
			CompanyName string `json:"company_name"`
		}
		if decode(r, &in) != nil {
			write(w, 400, map[string]string{"error": "invalid json"})
			return
		}
		in.Name = strings.TrimSpace(in.Name)
		in.Email = strings.ToLower(strings.TrimSpace(in.Email))
		in.City = strings.TrimSpace(in.City)
		in.CompanyName = strings.TrimSpace(in.CompanyName)
		if in.Email != "" && !validEmail(in.Email) {
			write(w, 422, map[string]string{"error": "некорректный email"})
			return
		}
		if in.Name == "" {
			write(w, 422, map[string]string{"error": "имя обязательно"})
			return
		}
		city := first(in.City, "Москва")
		_, err := a.db.Exec(r.Context(), `UPDATE users SET name=$1,email=NULLIF($2,''),city=$3,company_name=$4,updated_at=now() WHERE id=$5`,
			in.Name, in.Email, city, in.CompanyName, id)
		if err != nil {
			write(w, 409, map[string]string{"error": "email уже используется"})
			return
		}
		title := first(in.CompanyName, in.Name)
		_, err = a.db.Exec(r.Context(), `
			INSERT INTO fleet_profiles(owner_id,slug,title,description,city,published,rating,updated_at)
			VALUES($1,$2,$3,'',$4,true,5.00,now())
			ON CONFLICT(owner_id) DO UPDATE SET title=EXCLUDED.title,city=EXCLUDED.city,updated_at=now()`,
			id, "fleet-"+strconv.FormatInt(id, 10), title, city)
		if err != nil {
			write(w, 500, map[string]string{"error": "не удалось синхронизировать автопарк"})
			return
		}
	}
	a.me(w, r)
}

func (a *App) leads(w http.ResponseWriter, r *http.Request) {
	var in struct{ Name, Phone, Email string }
	if decode(r, &in) != nil || strings.TrimSpace(in.Name) == "" || strings.TrimSpace(in.Phone) == "" {
		write(w, 422, map[string]string{"error": "name and phone are required"})
		return
	}
	_, err := a.db.Exec(r.Context(), `INSERT INTO leads(name,phone,email) VALUES($1,$2,NULLIF($3,''))`, strings.TrimSpace(in.Name), normalizePhone(in.Phone), strings.TrimSpace(in.Email))
	if err != nil {
		write(w, 500, map[string]string{"error": "could not save lead"})
		return
	}
	write(w, 201, map[string]bool{"ok": true})
}

// ============== context helper (нужно для App.me) ==============

var _ = context.Background // защита от неиспользуемого импорта
var _ = fmt.Sprintf