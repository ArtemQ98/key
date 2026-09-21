package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	smsaero "github.com/smsaero/smsaero_golang/v2/smsaero"
)

func sendSmsCode(phone, code string) error {
	email := os.Getenv("SMSAERO_EMAIL")
	apiKey := os.Getenv("SMSAERO_API_KEY")

	if email == "" || apiKey == "" {
		return fmt.Errorf("SMSAERO_EMAIL и SMSAERO_API_KEY обязательны")
	}

	client, err := smsaero.NewSmsAeroClient(
		email,
		apiKey,
		smsaero.WithTimeout(30*time.Second),
		smsaero.WithTest(false),
		smsaero.WithPhoneValidation(true),
	)
	if err != nil {
		return fmt.Errorf("smsaero client: %w", err)
	}

	// phone приходит как "+79999999999" или "79999999999"
	// Нужно: int 79999999999
	number, err := strconv.Atoi(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	text := fmt.Sprintf("Ваш код для входа в KEY: %s. Никому не сообщайте.", code)

	_, err = client.SendSms(
		number,
		text,
		smsaero.WithSendSmsSign("SMS Aero"),
	)
	if err != nil {
		return fmt.Errorf("smsaero send: %w", err)
	}

	log.Printf("SMS Aero: код отправлен на %d", number)
	return nil
}