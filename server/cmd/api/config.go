package main

import (
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func isProd() bool {
	env := strings.ToLower(os.Getenv("ENV"))
	return env == "prod" || env == "production"
}

func appDir() string {
	return getenv("APP_DIR", "/app")
}

func uploadsDir() string {
	return filepath.Join(appDir(), "uploads")
}

func migrationsDir() string {
	return filepath.Join(appDir(), "migrations")
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.IndexByte(xff, ','); i > 0 {
			return strings.TrimSpace(xff[:i])
		}
		return strings.TrimSpace(xff)
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}