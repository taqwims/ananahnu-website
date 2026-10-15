package domain

import (
	"time"

	"github.com/google/uuid"
)

// Training represents a training program/session.
type Training struct {
	ID             int64                 `gorm:"primaryKey" json:"id"`
	Title          string                `gorm:"not null" json:"title"`
	Description    string                `json:"description"`
	StartDate      time.Time             `json:"start_date"`
	EndDate        time.Time             `json:"end_date"`
	Location       string                `json:"location"`
	Status         string                `gorm:"default:'APPROVED'" json:"status"` // PENDING, APPROVED, REJECTED
	ProposedBy     *uuid.UUID            `gorm:"type:uuid" json:"proposed_by,omitempty"`
	Proposer       *User                 `gorm:"foreignKey:ProposedBy" json:"proposer,omitempty"`
	ApprovedBy     *uuid.UUID            `gorm:"type:uuid" json:"approved_by,omitempty"`
	Approver       *User                 `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
	ApprovedAt     *time.Time            `json:"approved_at,omitempty"`
	RejectedBy     *uuid.UUID            `gorm:"type:uuid" json:"rejected_by,omitempty"`
	Rejector       *User                 `gorm:"foreignKey:RejectedBy" json:"rejector,omitempty"`
	RejectedAt     *time.Time            `json:"rejected_at,omitempty"`
	RejectedReason string                `json:"rejected_reason,omitempty"`
	Participants   []TrainingParticipant `gorm:"foreignKey:TrainingID" json:"participants,omitempty"`
	CreatedAt      time.Time             `json:"created_at"`
	UpdatedAt      time.Time             `json:"updated_at"`
}

// TrainingParticipant links a user to a training with status tracking.
type TrainingParticipant struct {
	ID         int64     `gorm:"primaryKey" json:"id"`
	TrainingID int64     `gorm:"index" json:"training_id"`
	Training   Training  `gorm:"foreignKey:TrainingID" json:"training,omitempty"`
	UserID     uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Status     string    `gorm:"default:'PESERTA'" json:"status"` // PESERTA, LULUS
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type TrainingRepository interface {
	FindAll(filter map[string]interface{}) ([]Training, error)
	FindByID(id int64) (*Training, error)
	Create(training *Training) error
	Update(training *Training) error
	UpdateStatus(id int64, status string, reason string, approverID *uuid.UUID) error
	Delete(id int64) error
}

type TrainingParticipantRepository interface {
	FindByTraining(trainingID int64) ([]TrainingParticipant, error)
	FindByUser(userID uuid.UUID) ([]TrainingParticipant, error)
	Create(participant *TrainingParticipant) error
	UpdateStatus(trainingID int64, userID uuid.UUID, status string) error
	Delete(id int64) error
}
