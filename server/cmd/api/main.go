package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()

	dsn := getenv("DATABASE_URL", "postgres://key:key@localhost:5432/key?sslmode=disable")
	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("database: ", err)
	}

	// === Migrations ===
	migrations := []struct {
		name string
		fn   func(context.Context, *pgxpool.Pool) error
	}{
		{"marketplace", ensureMarketplaceSchema},
		{"rental core", ensureRentalCoreSchema},
		{"rental finance", ensureRentalFinanceSchema},
		{"car photos", ensureCarPhotosSchema},
		{"booking ux", ensureBookingUXSchema},
		{"car finance", ensureCarFinanceSchema},
		{"phone auth", ensurePhoneAuthSchema},
		{"fleet extended", ensureFleetExtendedSchema},
		{"rentals car_id", ensureRentalsCarIDSchema},
		{"plans", ensurePlansSchema},
		{"rental terms", ensureRentalTermsSchema},
		{"rental messages", ensureRentalMessagesSchema},
		{"rental messages notified", ensureRentalMessagesNotifiedSchema},
	}
	for _, m := range migrations {
		if err := m.fn(ctx, db); err != nil {
			log.Fatalf("%s migration: %v", m.name, err)
		}
	}

	// === Upload dirs ===
	if err := os.MkdirAll(filepath.Join(uploadsDir(), "cars"), 0o755); err != nil {
		log.Fatal("uploads/cars: ", err)
	}
	if err := os.MkdirAll(filepath.Join(uploadsDir(), "fleets"), 0o755); err != nil {
		log.Fatal("uploads/fleets: ", err)
	}

	// === JWT secret ===
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required (min 32 chars)")
	}
	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters")
	}

	// === App ===
	app := &App{
		db:         db,
		jwtSecret:  []byte(jwtSecret),
		rlSendCode: newRateLimiter(5, 15*time.Minute),
		rlVerify:   newRateLimiter(10, 5*time.Minute),
		rlLogin:    newRateLimiter(10, 5*time.Minute),
		rlRegister: newRateLimiter(5, 60*time.Minute),
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if isProd() {
		go app.startChatNotifyCron(ctx)
	}

	// === Router ===
	mux := http.NewServeMux()

	// Public — без авторизации
	mux.HandleFunc("/api/health", app.health)
	mux.HandleFunc("/api/auth/register", app.register)
	mux.HandleFunc("/api/auth/login", app.login)
	mux.HandleFunc("/api/auth/customer/register", app.customerRegister)
	mux.HandleFunc("/api/auth/customer/login", app.customerLogin)
	mux.HandleFunc("/api/auth/request-code", app.requestCode)
	mux.HandleFunc("/api/auth/verify-code", app.verifyCode)
	mux.HandleFunc("/api/auth/owner/verify-code", app.verifyCodeOwner)
	mux.HandleFunc("/api/public/fleets", app.publicFleets)
	mux.HandleFunc("/api/public/fleets/", app.publicFleet)
	mux.HandleFunc("/api/public/cars", app.publicCars)
	mux.HandleFunc("/api/public/cars/", app.publicCar)
	mux.HandleFunc("/api/public/availability", app.publicAvailability)
	mux.HandleFunc("/api/public/availability/dates", app.publicAvailabilityDates)
	mux.HandleFunc("/api/leads", app.leads)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir()))))

	// Auth — любой залогиненный
	mux.Handle("/api/me", app.auth(http.HandlerFunc(app.me)))
	mux.Handle("/api/bookings", app.auth(http.HandlerFunc(app.bookings)))
	mux.Handle("/api/bookings/", app.auth(http.HandlerFunc(app.bookingByID)))
	mux.Handle("/api/customer/bookings/", app.auth(http.HandlerFunc(app.customerBookingByID)))
	mux.Handle("/api/customer/bookings", app.auth(http.HandlerFunc(app.customerBookings)))
	mux.Handle("/api/rental-messages/unread-count", app.auth(http.HandlerFunc(app.rentalMessagesUnreadCount)))
	mux.Handle("/api/rental-messages/", app.auth(http.HandlerFunc(app.rentalMessagesRouter)))

	// Owner-only
	mux.Handle("/api/profile", app.ownerOnly(http.HandlerFunc(app.profile)))
	mux.Handle("/api/fleet-profile", app.ownerOnly(http.HandlerFunc(app.fleetProfile)))
	mux.Handle("/api/fleet-avatar", app.ownerOnly(http.HandlerFunc(app.fleetAvatar)))
	mux.Handle("/api/dashboard", app.ownerOnly(http.HandlerFunc(app.dashboard)))
	mux.Handle("/api/dashboard/revenue-chart", app.ownerOnly(http.HandlerFunc(app.revenueChart)))
	mux.Handle("/api/cars", app.ownerOnly(http.HandlerFunc(app.cars)))
	mux.Handle("/api/cars/", app.ownerOnly(http.HandlerFunc(app.carByID)))
	mux.Handle("/api/car-finance/", app.ownerOnly(http.HandlerFunc(app.carFinance)))
	mux.Handle("/api/car-photos/", app.ownerOnly(http.HandlerFunc(app.carPhotos)))
	mux.Handle("/api/rentals", app.ownerOnly(http.HandlerFunc(app.rentals)))
	mux.Handle("/api/rentals/calendar", app.ownerOnly(http.HandlerFunc(app.rentalCalendar)))
	mux.Handle("/api/rentals/", app.ownerOnly(http.HandlerFunc(app.rentalByID)))
	mux.Handle("/api/rental-ops/", app.ownerOnly(http.HandlerFunc(app.rentalOps)))
	mux.Handle("/api/rentals/meeting/", app.ownerOnly(http.HandlerFunc(app.rentalMeeting)))
	mux.Handle("/api/rentals/payment/", app.ownerOnly(http.HandlerFunc(app.rentalPayment)))
	mux.Handle("/api/verification", app.ownerOnly(http.HandlerFunc(app.verification)))
	mux.Handle("/api/verification/", app.ownerOnly(http.HandlerFunc(app.verificationByID)))
	mux.Handle("/api/clients", app.ownerOnly(http.HandlerFunc(app.clients)))
	mux.Handle("/api/notifications", app.ownerOnly(http.HandlerFunc(app.notifications)))

	// === Server ===
	addr := getenv("LISTEN_ADDR", ":8080")
	log.Printf("KEY API %s", addr)

	srv := &http.Server{
		Addr:              addr,
		Handler:           cors(logging(mux)),
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20, // 1 MB
	}

	log.Fatal(srv.ListenAndServe())
}