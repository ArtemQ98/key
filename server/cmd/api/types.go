package main

import "time"

type User struct {
	ID            int64      `json:"id"`
	Name          string     `json:"name"`
	Email         string     `json:"email,omitempty"`
	Phone         string     `json:"phone,omitempty"`
	PhoneVerified bool       `json:"phone_verified"`
	Role          string     `json:"role"`
	City          string     `json:"city"`
	CompanyName   string     `json:"company_name"`
	Plan          string     `json:"plan"`
	CarsLimit     int        `json:"cars_limit"`
	PlanExpiresAt *time.Time `json:"plan_expires_at,omitempty"`
	OnboardedAt   *time.Time `json:"onboarded_at,omitempty"`
}

type Car struct {
	ID                  int64        `json:"id"`
	Brand               string       `json:"brand"`
	Model               string       `json:"model"`
	Plate               string       `json:"plate"`
	Year                int          `json:"year"`
	Status              string       `json:"status"`
	Revenue             float64      `json:"revenue"`
	Location            string       `json:"location"`
	DailyPrice          float64      `json:"daily_price"`
	Mileage             int          `json:"mileage"`
	Color               string       `json:"color"`
	VIN                 string       `json:"vin"`
	PublicEnabled       bool         `json:"public_enabled"`
	Category            string       `json:"category"`
	Seats               int          `json:"seats"`
	Transmission        string       `json:"transmission"`
	Fuel                string       `json:"fuel"`
	Description         string       `json:"description"`
	ImageURL            string       `json:"image_url"`
	Deposit             float64      `json:"deposit"`
	EngineVolume        string       `json:"engine_volume"`
	Horsepower          int          `json:"horsepower"`
	DriveType           string       `json:"drive_type"`
	FuelConsumption     string       `json:"fuel_consumption"`
	TankVolume          string       `json:"tank_volume"`
	MaintenanceInterval int          `json:"maintenance_interval"`
	Earnings            float64      `json:"earnings"`
	Expenses            float64      `json:"expenses"`
	RentalTerms         []RentalTerm `json:"rental_terms"`
}

type RentalTerm struct {
	Title string   `json:"title"`
	Items []string `json:"items"`
}

type PlanInfo struct {
	Plan      string
	Limit     int
	ExpiresAt *time.Time
}