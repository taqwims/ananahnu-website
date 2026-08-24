package whatsapp

type WhatsAppSender interface {
	Send(target string, message string) error
	SendSync(target string, message string) (string, error)
}
