package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Username     string     `gorm:"unique" json:"username"` // Optional/Nullable if using Email
	Email        string     `gorm:"unique;not null" json:"email"`
	PasswordHash string     `json:"-"`
	FullName     string     `json:"full_name"`
	Phone        string     `json:"phone"`
	Address      string     `json:"address"`
	ProvinceID   int64      `json:"province_id"`
	RegencyID    int64      `json:"regency_id"`
	AvatarURL    string     `json:"avatar_url"`
	RoleID       int        `json:"role_id"`
	Role         Role       `gorm:"foreignKey:RoleID" json:"role"`
	LeaderID     *uuid.UUID `gorm:"type:uuid" json:"leader_id,omitempty"` // Halal Manager
	Leader       *User      `gorm:"foreignKey:LeaderID" json:"leader,omitempty"`
	ReferralCode string     `gorm:"unique" json:"referral_code"`
	ReferredByID *uuid.UUID `gorm:"type:uuid" json:"referred_by_id,omitempty"`
	ReferredBy   *User      `gorm:"foreignKey:ReferredByID" json:"referred_by,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CommissionStatus string

const (
	CommissionStatusPending CommissionStatus = "PENDING"
	CommissionStatusPaid    CommissionStatus = "PAID"
)

type CommissionType string

const (
	CommissionTypeReferral    CommissionType = "REFERRAL"
	CommissionTypeStructural  CommissionType = "STRUCTURAL"
	CommissionTypeDirectSales CommissionType = "DIRECT_SALES"
	CommissionTypeOverride    CommissionType = "OVERRIDE"
)

type Commission struct {
	ID             uuid.UUID        `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Type           CommissionType   `gorm:"default:'REFERRAL'" json:"type"`
	
	// Referral specific
	ReferrerID     *uuid.UUID       `gorm:"type:uuid;index" json:"referrer_id,omitempty"`
	Referrer       *User            `gorm:"foreignKey:ReferrerID" json:"referrer,omitempty"`
	ReferredID     *uuid.UUID       `gorm:"type:uuid;index" json:"referred_id,omitempty"`
	Referred       *User            `gorm:"foreignKey:ReferredID" json:"referred,omitempty"`
	
	// Structural/Monthly specific
	UserID         *uuid.UUID       `gorm:"type:uuid;index" json:"user_id,omitempty"`
	User           *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Period         string           `json:"period,omitempty"` // e.g. "2026-05"
	BaseOmset      float64          `json:"base_omset,omitempty"`
	
	// General
	SubmissionID   *uuid.UUID       `gorm:"type:uuid;index" json:"submission_id,omitempty"`
	Submission     *Submission      `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`
	Amount         float64          `json:"amount"`
	Status         CommissionStatus `gorm:"default:'PENDING'" json:"status"`
	PaidAt         *time.Time       `json:"paid_at,omitempty"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
}

type PasswordResetToken struct {
	Token     string    `gorm:"primaryKey" json:"token"`
	UserID    uuid.UUID `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

type UserRepository interface {
	Create(user *User) error
	FindByEmail(email string) (*User, error)
	FindByID(id uuid.UUID) (*User, error)
	FindByReferralCode(code string) (*User, error)
	FindByReferredByID(id uuid.UUID) ([]User, error)
	GetAllReferralAnalytics() ([]map[string]interface{}, error)
	FindByLeaderID(leaderID uuid.UUID) ([]User, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]User, int64, error)
	Update(user *User) error
	Delete(id uuid.UUID) error
}

type CommissionRepository interface {
	Create(commission *Commission) error
	UpsertStructural(commission *Commission) error
	FindAll(filter map[string]interface{}, page, limit int) ([]Commission, int64, error)
	UpdateStatus(id uuid.UUID, status CommissionStatus, paidAt *time.Time) error
	FindBySubmissionID(submissionID uuid.UUID) (*Commission, error)
}

type PasswordTokenRepository interface {
	Create(token *PasswordResetToken) error
	FindByToken(token string) (*PasswordResetToken, error)
	Delete(token string) error
}
