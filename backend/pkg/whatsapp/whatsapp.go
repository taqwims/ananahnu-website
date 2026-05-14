package whatsapp

type WhatsAppSender interface {
	Send(target string, message string) error
}
