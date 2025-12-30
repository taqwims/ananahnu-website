package email

import (
	"fmt"
	"net/smtp"
	"os"
)

type EmailSender interface {
	SendEmail(to []string, subject string, body string) error
}

type gmailSender struct {
	from     string
	password string
	host     string
	port     string
}

func NewGmailSender() EmailSender {
	return &gmailSender{
		from:     os.Getenv("SMTP_EMAIL"),
		password: os.Getenv("SMTP_PASSWORD"),
		host:     os.Getenv("SMTP_HOST"),
		port:     os.Getenv("SMTP_PORT"),
	}
}

func (s *gmailSender) SendEmail(to []string, subject string, body string) error {
	auth := smtp.PlainAuth("", s.from, s.password, s.host)

	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	msg := []byte(fmt.Sprintf("Subject: %s\n%s\n%s", subject, mime, body))

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	if err := smtp.SendMail(addr, auth, s.from, to, msg); err != nil {
		return err
	}
	return nil
}
