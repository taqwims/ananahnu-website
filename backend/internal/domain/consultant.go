package domain

import (
	"time"

	"github.com/google/uuid"
)

// ConsultantProfile stores recruitment documents for a Halal Consultant.
type ConsultantProfile struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"user_id"`
	User           User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	KTPURL         string    `json:"ktp_url"`
	Photo3x4URL    string    `json:"photo_3x4_url"`    // Latar merah
	IjazahSTAURL   string    `json:"ijazah_sta_url"`
	BankAccountURL string    `json:"bank_account_url"`
	NPWPURL        string    `json:"npwp_url,omitempty"` // Opsional
	IsVerified     bool      `gorm:"default:false" json:"is_verified"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ConsultantProfileRepository interface {
	FindByUserID(userID uuid.UUID) (*ConsultantProfile, error)
	FindAll() ([]ConsultantProfile, error)
	Create(profile *ConsultantProfile) error
	Update(profile *ConsultantProfile) error
}
