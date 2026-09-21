package main

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

func (a *App) token(id int64, role string) (string, error) {
	c := jwt.MapClaims{
		"sub":  strconv.FormatInt(id, 10),
		"role": role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(a.jwtSecret)
}

func (a *App) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			write(w, 401, map[string]string{"error": "authorization required"})
			return
		}
		t, e := jwt.Parse(h[7:], func(t *jwt.Token) (any, error) {
			if t.Method.Alg() != "HS256" {
				return nil, errors.New("alg")
			}
			return a.jwtSecret, nil
		})
		if e != nil || !t.Valid {
			write(w, 401, map[string]string{"error": "invalid token"})
			return
		}
		claims, ok := t.Claims.(jwt.MapClaims)
		if !ok {
			write(w, 401, map[string]string{"error": "invalid claims"})
			return
		}
		sub, _ := claims["sub"].(string)
		role, _ := claims["role"].(string)
		ctx := context.WithValue(r.Context(), ctxKey("user"), sub)
		ctx = context.WithValue(ctx, ctxKey("role"), role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (a *App) ownerOnly(next http.Handler) http.Handler {
	return a.auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Context().Value(ctxKey("role")) != "owner" {
			write(w, http.StatusForbidden, map[string]string{"error": "owner access required"})
			return
		}
		next.ServeHTTP(w, r)
	}))
}

func userID(ctx context.Context) int64 {
	v, _ := ctx.Value(ctxKey("user")).(string)
	id, _ := strconv.ParseInt(v, 10, 64)
	return id
}