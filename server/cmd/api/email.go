package main

import (
	"crypto/tls"
	"fmt"
	"html"
	"net/smtp"
	"os"
)

// sendHTMLEmail — общая функция отправки HTML-письма через SMTP (TLS 465).
func sendHTMLEmail(to, subject, body string) error {
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

	msg := fmt.Sprintf(
		"From: %s <%s>\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=UTF-8\r\n"+
			"\r\n"+
			"%s\r\n",
		fromName, from, to, subject, body,
	)

	auth := smtp.PlainAuth("", user, pass, host)
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
	if err = client.Rcpt(to); err != nil {
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

// sendEmailCode — письмо с кодом входа.
func sendEmailCode(toEmail, code string) error {
	subject := "Код для входа в KEY"
	body := fmt.Sprintf(`Ваш код для входа: <b>%s</b><br><br>
Код действует 5 минут.<br>
Если вы не запрашивали код — просто проигнорируйте это письмо.`, code)
	return sendHTMLEmail(toEmail, subject, body)
}

// sendChatNotification — письмо о непрочитанном сообщении в чате.
// isOwner=true означает, что получатель — владелец (ссылка на /app/rentals),
// isOwner=false — клиент (ссылка на /account).
func sendChatNotification(to, carName, bookingCode, senderName, body string, isOwner bool) error {
	subject := fmt.Sprintf("Новое сообщение · %s", bookingCode)

	baseURL := os.Getenv("PUBLIC_URL")
	if baseURL == "" {
		baseURL = "https://keyfleet.ru"
	}

	var link, linkLabel string
	if isOwner {
		link = baseURL + "/app/rentals"
		linkLabel = "Открыть аренды"
	} else {
		link = baseURL + "/account"
		linkLabel = "Открыть мои поездки"
	}

	// Обрезаем длинные сообщения, чтобы письмо не разъезжалось.
	preview := body
	if len(preview) > 300 {
		preview = preview[:300] + "…"
	}

	htmlBody := fmt.Sprintf(`<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
  <h2 style="font-size: 18px; margin: 0 0 8px;">Новое сообщение от %s</h2>
  <p style="color: #666; font-size: 14px; margin: 0 0 16px;">Аренда %s · %s</p>
  <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">%s</div>
  <a href="%s" style="display: inline-block; background: #111; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">%s</a>
  <p style="color: #999; font-size: 12px; margin: 24px 0 0;">KEY — сервис аренды автомобилей<br>Это письмо отправлено автоматически, отвечать на него не нужно.</p>
</div>`,
		html.EscapeString(senderName),
		html.EscapeString(bookingCode),
		html.EscapeString(carName),
		html.EscapeString(preview),
		link,
		linkLabel,
	)

	return sendHTMLEmail(to, subject, htmlBody)
}