package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	db         *pgxpool.Pool
	jwtSecret  []byte
	rlSendCode *rateLimiter // /auth/request-code
	rlVerify   *rateLimiter // /auth/verify-code
	rlLogin    *rateLimiter // /auth/login + /auth/customer/login
	rlRegister *rateLimiter // /auth/register + /auth/customer/register
}

func (a *App) getPlanInfo(ctx context.Context, ownerID int64) (PlanInfo, error) {
	var info PlanInfo
	err := a.db.QueryRow(ctx,
		`SELECT plan, cars_limit, plan_expires_at
		 FROM users WHERE id=$1`, ownerID).
		Scan(&info.Plan, &info.Limit, &info.ExpiresAt)
	return info, err
}
