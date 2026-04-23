package domain

import (
	"time"

	"github.com/google/uuid"
)

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
	ProofURL     string        `json:"proof_url"`               // For Manual
	ExternalID   string        `json:"external_id"`             // Midtrans order_id
	SnapToken    string        `json:"snap_token,omitempty"`    // Midtrans Snap token
	SnapURL      string        `json:"snap_url,omitempty"`      // Midtrans Snap redirect URL
	MidtransID   string        `json:"midtrans_id,omitempty"`   // Midtrans transaction_id
	PaymentType  string        `json:"payment_type,omitempty"`  // e.g. "bank_transfer", "gopay", "qris"
	PaidAt       *time.Time    `json:"paid_at,omitempty"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}
