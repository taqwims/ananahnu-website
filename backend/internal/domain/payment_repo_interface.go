package domain

type PaymentRepository interface {
	Create(payment *Payment) error
	FindByExternalID(externalID string) (*Payment, error)
	Update(payment *Payment) error
}
