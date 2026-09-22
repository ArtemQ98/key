package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ensureMarketplaceSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx, `SELECT to_regclass('public.fleet_profiles') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "004_marketplace.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY marketplace schema applied")
	return nil
}

func ensureRentalCoreSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx, `SELECT to_regclass('public.rental_events') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "005_rental_core.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY rental core schema applied")
	return nil
}

func ensureRentalFinanceSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx, `SELECT to_regclass('public.rental_adjustments') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "006_rental_finance.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY rental finance schema applied")
	return nil
}

func ensureCarPhotosSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx, `SELECT to_regclass('public.car_photos') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "007_car_photos.sql"))
	if err != nil {
		return err
	}
	_, err = db.Exec(ctx, string(b))
	return err
}

func ensureBookingUXSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='rentals' AND column_name='pickup_meeting_at')`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "008_booking_ux.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY booking UX schema applied")
	return nil
}

func ensureCarFinanceSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx, `SELECT to_regclass('public.car_expenses') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "009_car_finance.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY car finance schema applied")
	return nil
}

func ensurePhoneAuthSchema(ctx context.Context, db *pgxpool.Pool) error {
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "010_phone_auth.sql"))
	if err != nil {
		return err
	}
	_, err = db.Exec(ctx, string(b))
	return err
}

func ensureFleetExtendedSchema(ctx context.Context, db *pgxpool.Pool) error {
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "011_fleet_profiles_extended.sql"))
	if err != nil {
		return err
	}
	_, err = db.Exec(ctx, string(b))
	return err
}

func ensureRentalsCarIDSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM information_schema.columns
		 WHERE table_name='rentals' AND column_name='car_id')`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "013_rentals_car_id.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY rentals car_id schema applied")
	return nil
}

func ensurePlansSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM information_schema.columns
		 WHERE table_name='users' AND column_name='plan')`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "015_plans.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY plans schema applied")
	return nil
}

func ensureRentalTermsSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM information_schema.columns
		 WHERE table_name='cars' AND column_name='rental_terms')`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "016_car_rental_terms.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY rental terms schema applied")
	return nil
}

func ensureRentalMessagesSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx,
		`SELECT to_regclass('public.rental_messages') IS NOT NULL`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "020_rental_messages.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY rental messages schema applied")
	return nil
}

func ensureRentalMessagesNotifiedSchema(ctx context.Context, db *pgxpool.Pool) error {
	var exists bool
	if err := db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM information_schema.columns
		 WHERE table_name='rental_messages' AND column_name='notified_at')`).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(migrationsDir(), "021_rental_messages_notified.sql"))
	if err != nil {
		return err
	}
	if _, err := db.Exec(ctx, string(b)); err != nil {
		return err
	}
	log.Println("KEY rental messages notified schema applied")
	return nil
}