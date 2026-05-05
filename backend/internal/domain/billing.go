package domain

import (
	"time"

	"github.com/google/uuid"
)

type InvoiceStatus string

const (
	InvoiceStatusUnpaid InvoiceStatus = "UNPAID"
	InvoiceStatusPaid   InvoiceStatus = "PAID"
)

// Invoice represents a billing invoice generated when a submission reaches SH_TERBIT.
type Invoice struct {
	ID           int64         `gorm:"primaryKey" json:"id"`
	SubmissionID uuid.UUID     `gorm:"type:uuid;index" json:"submission_id"`
	Submission   Submission    `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`
	PayerID      *uuid.UUID    `gorm:"type:uuid;index" json:"payer_id,omitempty"` // User ID of the Payer (e.g. Coordinator)
	Payer        *User         `gorm:"foreignKey:PayerID" json:"payer,omitempty"`
	ServiceType  string        `gorm:"not null" json:"service_type"` // REGULER, SELF_DECLARE
	Amount       float64       `gorm:"not null" json:"amount"`
	Status       InvoiceStatus `gorm:"default:'UNPAID'" json:"status"`
	PaymentID    *int64        `gorm:"index" json:"payment_id,omitempty"`
	Payment      *Payment      `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
	RegencyID    *int64        `json:"regency_id,omitempty"`
	DistrictID   *int64        `json:"district_id,omitempty"`
	Notes        string        `json:"notes"`
	CreatedAt    time.Time     `json:"created_at"`
	PaidAt       *time.Time    `json:"paid_at,omitempty"`
}

// CoordinatorRate stores specific rate per SH for a coordinator.
type CoordinatorRate struct {
	ID            int64     `gorm:"primaryKey" json:"id"`
	CoordinatorID uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"coordinator_id"`
	Coordinator   User      `gorm:"foreignKey:CoordinatorID" json:"coordinator,omitempty"`
	RatePerSH     float64   `gorm:"not null" json:"rate_per_sh"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// PaymentConfig stores configurable payment item types and amounts.
type PaymentConfig struct {
	ID          int64   `gorm:"primaryKey" json:"id"`
	ServiceType string  `gorm:"not null;index" json:"service_type"` // REGULER, SELF_DECLARE
	ItemName    string  `gorm:"not null" json:"item_name"`          // e.g. "Biaya Pendampingan", "Biaya Ceklist"
	Amount      float64 `gorm:"not null" json:"amount"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
}

type InvoiceRepository interface {
	FindAll(filter map[string]interface{}, page, limit int) ([]Invoice, int64, error)
	FindBySubmissionID(submissionID uuid.UUID) (*Invoice, error)
	FindByIDs(ids []int64) ([]Invoice, error)
	Create(invoice *Invoice) error
	Update(invoice *Invoice) error
}

type CoordinatorRateRepository interface {
	FindByCoordinatorID(coordinatorID uuid.UUID) (*CoordinatorRate, error)
	FindAll() ([]CoordinatorRate, error)
	Save(rate *CoordinatorRate) error
}

type PaymentConfigRepository interface {
	FindByServiceType(serviceType string) ([]PaymentConfig, error)
	FindAll() ([]PaymentConfig, error)
	Create(config *PaymentConfig) error
	Update(config *PaymentConfig) error
	Delete(id int64) error
}
