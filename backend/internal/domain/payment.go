package domain

import "github.com/google/uuid"

type PaymentMethod string
const (
	PaymentMethodManual   PaymentMethod = "MANUAL"
	PaymentMethodMidtrans PaymentMethod = "MIDTRANS"
)

type PaymentStatus string
const (
	PaymentStatusPending PaymentStatus = "PENDING"
	PaymentStatusPaid    PaymentStatus = "PAID"
	PaymentStatusFailed  PaymentStatus = "FAILED"
)

type Payment struct {
	ID           int64         `gorm:"primaryKey" json:"id"`
	SubmissionID uuid.UUID     `gorm:"type:uuid" json:"submission_id"`
	Amount       float64       `json:"amount"`
	Method       PaymentMethod `json:"method"`
	Status       PaymentStatus `json:"status"`
	ProofURL     string        `json:"proof_url"`     // For Manual
	ExternalID   string        `json:"external_id"`   // for Midtrans
}
