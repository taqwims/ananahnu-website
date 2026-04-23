package domain

import "github.com/google/uuid"

type PaymentRepository interface {
	Create(payment *Payment) error
	FindByExternalID(externalID string) (*Payment, error)
	FindByID(id int64) (*Payment, error)
	FindBySubmissionID(submissionID uuid.UUID) ([]Payment, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]Payment, int64, error)
	Update(payment *Payment) error
}

