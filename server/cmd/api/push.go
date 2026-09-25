package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// sendPush шлёт push-уведомление конкретному пользователю через OneSignal.
// externalID — это user.id в виде строки, который мы связали через OneSignal.login() на фронте.
func sendPush(externalID, title, body, url string) error {
	appID := os.Getenv("ONESIGNAL_APP_ID")
	apiKey := os.Getenv("ONESIGNAL_REST_API_KEY")

	if appID == "" || apiKey == "" {
		return fmt.Errorf("OneSignal не настроен")
	}

	payload := map[string]any{
		"app_id":          appID,
		"target_channel":  "push",
		"include_aliases": map[string][]string{"external_id": {externalID}},
		"headings":        map[string]string{"en": title, "ru": title},
		"contents":        map[string]string{"en": body, "ru": body},
		"url":             url,
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequest(
		http.MethodPost,
		"https://api.onesignal.com/notifications",
		bytes.NewBuffer(raw),
	)
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Key "+apiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var buf bytes.Buffer
		_, _ = buf.ReadFrom(resp.Body)
		return fmt.Errorf("onesignal %d: %s", resp.StatusCode, buf.String())
	}
	return nil
}

// sendChatPush — обёртка для уведомления о новом сообщении в чате.
// isOwner=true — получателю-владельцу, ссылка на /app/rentals.
// isOwner=false — получателю-клиенту, ссылка на /account.
func sendChatPush(externalID, carName, bookingCode, senderName, body string, isOwner bool, rentalID int64) error {
	title := fmt.Sprintf("Новое сообщение · %s", bookingCode)

	preview := body
	if len(preview) > 120 {
		preview = preview[:120] + "…"
	}
	text := fmt.Sprintf("%s: %s", senderName, preview)

	baseURL := os.Getenv("PUBLIC_URL")
	if baseURL == "" {
		baseURL = "https://keyfleet.ru"
	}

	url := fmt.Sprintf("%s/account/bookings/%d?tab=chat", baseURL, rentalID)
    if isOwner {
        url = fmt.Sprintf("%s/app/rentals?open=%d&tab=chat", baseURL, rentalID)
    }

	return sendPush(externalID, title, text, url)
}

func sendStatusPush(externalID, title, message string, isOwner bool, rentalID int64) error {
	baseURL := os.Getenv("PUBLIC_URL")
	if baseURL == "" {
		baseURL = "https://keyfleet.ru"
	}

	var url string
	if rentalID > 0 {
		if isOwner {
			url = fmt.Sprintf("%s/app/rentals?open=%d", baseURL, rentalID)
		} else {
			url = fmt.Sprintf("%s/account/bookings/%d", baseURL, rentalID)
		}
	} else {
		if isOwner {
			url = baseURL + "/app/rentals"
		} else {
			url = baseURL + "/account"
		}
	}

	return sendPush(externalID, title, message, url)
}