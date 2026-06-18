package domain

import (
	"time"

	"github.com/google/uuid"
)

// Expense represents an outgoing financial transaction (Pos Pengeluaran).
// It can be tied to a specific submission (e.g. BPJPH, MUI) or general operational.
type Expense struct {
	ID           int64       `gorm:"primaryKey" json:"id"`
	SubmissionID *uuid.UUID  `gorm:"type:uuid;index" json:"submission_id,omitempty"` // Nil for operational expenses
	Submission   *Submission `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`
	Category     string      `gorm:"not null" json:"category"` // e.g. "BPJPH", "Operasional", "Listrik"
	Amount       float64     `gorm:"not null" json:"amount"`
	Description  string      `json:"description"`
	Date         time.Time   `gorm:"not null;index" json:"date"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

type ExpenseRepository interface {
	Create(expense *Expense) error
	FindAll(filter map[string]interface{}, page, limit int) ([]Expense, int64, error)
	Delete(id int64) error
}
