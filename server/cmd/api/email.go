package main

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"os"
)

func sendEmailCode(toEmail, code string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")
	fromName := os.Getenv("SMTP_FROM_NAME")

	if host == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP не настроен")
	}
	if port == "" {
		port = "465"
	}
	if from == "" {
		from = user
	}
	if fromName == "" {
		fromName = "KEY"
	}

	subject := "Код для входа в KEY"
	body := fmt.Sprintf(`Ваш код для входа: <b>%s</b><br><br>
Код действует 5 минут.<br>
Если вы не запрашивали код — просто проигнорируйте это письмо.`, code)

	// Правильный MIME с HTML и UTF-8
	msg := fmt.Sprintf(
		"From: %s <%s>\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=UTF-8\r\n"+
			"\r\n"+
			"%s\r\n",
		fromName, from, toEmail, subject, body,
	)

	auth := smtp.PlainAuth("", user, pass, host)

	// TLS-соединение на 465 порт
	tlsConfig := &tls.Config{
		ServerName: host,
		MinVersion: tls.VersionTLS12,
	}

	conn, err := tls.Dial("tcp", host+":"+port, tlsConfig)
	if err != nil {
		return fmt.Errorf("smtp dial: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("smtp client: %w", err)
	}
	defer client.Close()

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err = client.Mail(from); err != nil {
		return fmt.Errorf("smtp mail: %w", err)
	}
	if err = client.Rcpt(toEmail); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err = w.Write([]byte(msg)); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	if err = w.Close(); err != nil {
		return fmt.Errorf("smtp close: %w", err)
	}
	return client.Quit()
}