package main

import (
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"math/big"
	"strconv"
	"sync"
	"time"
)

type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string][]time.Time
	limit   int
	window  time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		buckets: map[string][]time.Time{},
		limit:   limit,
		window:  window,
	}
}

func (r *rateLimiter) allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	cutoff := now.Add(-r.window)
	kept := r.buckets[key][:0]
	for _, t := range r.buckets[key] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= r.limit {
		r.buckets[key] = kept
		return false
	}
	r.buckets[key] = append(kept, now)
	return true
}

func randomCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	return strconv.FormatInt(100000+n.Int64(), 10), nil
}

func hashCode(code string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(code)))
}