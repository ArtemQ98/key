package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type yookassaPaymentRequest struct {
	Amount       yookassaAmount       `json:"amount"`
	Capture      bool                 `json:"capture"`
	Confirmation yookassaConfirmation `json:"confirmation"`
	Description  string               `json:"description"`
	Metadata     map[string]string    `json:"metadata"`
}

type yookassaAmount struct {
	Value    string `json:"value"`
	Currency string `json:"currency"`
}

type yookassaConfirmation struct {
	Type      string `json:"type"`
	ReturnURL string `json:"return_url"`
}

type yookassaPaymentResponse struct {
	ID           string `json:"id"`
	Status       string `json:"status"`
	Confirmation struct {
		Type            string `json:"type"`
		ConfirmationURL string `json:"confirmation_url"`
	} `json:"confirmation"`
}

// POST /api/billing/subscribe
func (a *App) createSubscriptionPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}

	uid := userID(r.Context())

	var in struct {
		PlanID string `json:"plan_id"`
	}
	if err := decode(r, &in); err != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}

	// Цены и лимиты тарифов
	planPrices := map[string]float64{
		"pro":      3000,
		"business": 6000,
	}

	price, ok := planPrices[in.PlanID]
	if !ok {
		write(w, 400, map[string]string{"error": "invalid plan"})
		return
	}

	shopID := os.Getenv("YOOKASSA_SHOP_ID")
	secretKey := os.Getenv("YOOKASSA_SECRET_KEY")
	returnURL := os.Getenv("YOOKASSA_RETURN_URL")

	if shopID == "" || secretKey == "" {
		write(w, 500, map[string]string{"error": "yookassa not configured"})
		return
	}

	// Создаём платёж в ЮKassa
	payload := yookassaPaymentRequest{
		Amount: yookassaAmount{
			Value:    fmt.Sprintf("%.2f", price),
			Currency: "RUB",
		},
		Capture: true, // оплата сразу, в одну стадию
		Confirmation: yookassaConfirmation{
			Type:      "redirect",
			ReturnURL: returnURL,
		},
		Description: fmt.Sprintf("Подписка KEY %s", in.PlanID),
		Metadata: map[string]string{
			"user_id": fmt.Sprintf("%d", uid),
			"plan_id": in.PlanID,
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest(
		http.MethodPost,
		"https://api.yookassa.ru/v3/payments",
		bytes.NewBuffer(body),
	)
	req.SetBasicAuth(shopID, secretKey)
	req.Header.Set("Idempotence-Key", fmt.Sprintf("%d-%d", uid, time.Now().UnixNano()))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		write(w, 500, map[string]string{"error": "yookassa request failed"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		var buf bytes.Buffer
		buf.ReadFrom(resp.Body)
		write(w, 500, map[string]string{"error": "yookassa error: " + buf.String()})
		return
	}

	var payment yookassaPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&payment); err != nil {
		write(w, 500, map[string]string{"error": "decode failed"})
		return
	}

	// Сохраняем платёж в БД
	_, err = a.db.Exec(r.Context(), `
		INSERT INTO payments (owner_id, provider, external_id, amount, currency, plan, status, idempotency_key)
		VALUES ($1, 'yookassa', $2, $3, 'RUB', $4, 'pending', $5)
	`, uid, payment.ID, price, in.PlanID, payment.ID)
	if err != nil {
		write(w, 500, map[string]string{"error": "db insert failed"})
		return
	}

	write(w, 200, map[string]string{
		"confirmation_url": payment.Confirmation.ConfirmationURL,
	})
}

type yookassaWebhook struct {
	Event  string `json:"event"`
	Object struct {
		ID       string `json:"id"`
		Status   string `json:"status"`
		Metadata struct {
			UserID string `json:"user_id"`
			PlanID string `json:"plan_id"`
		} `json:"metadata"`
	} `json:"object"`
}

// POST /api/webhooks/yookassa
func (a *App) yookassaWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		write(w, 405, map[string]string{"error": "method not allowed"})
		return
	}

	var event yookassaWebhook
	if err := decode(r, &event); err != nil {
		write(w, 400, map[string]string{"error": "invalid json"})
		return
	}

	switch event.Event {
	case "payment.succeeded":
		// Обновляем статус платежа
		_, _ = a.db.Exec(r.Context(), `
			UPDATE payments SET status = 'succeeded', paid_at = now()
			WHERE external_id = $1
		`, event.Object.ID)

		// Активируем подписку пользователю
		var userID int64
		fmt.Sscanf(event.Object.Metadata.UserID, "%d", &userID)
		planID := event.Object.Metadata.PlanID

		var limit int
		switch planID {
		case "pro":
			limit = 12
		case "business":
			limit = 24
		default:
			limit = 3
		}

		_, _ = a.db.Exec(r.Context(), `
			UPDATE users
			SET plan = $1, cars_limit = $2, plan_expires_at = now() + interval '1 month'
			WHERE id = $3
		`, planID, limit, userID)

	case "payment.canceled":
		_, _ = a.db.Exec(r.Context(), `
			UPDATE payments SET status = 'canceled'
			WHERE external_id = $1
		`, event.Object.ID)
	}

	// Всегда отвечаем 200, иначе ЮKassa будет слать повторно
	write(w, 200, map[string]bool{"ok": true})
}