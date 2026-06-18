package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	PromotionStatusPending  = "PENDING_VERIFICATION"
	PromotionStatusTraining = "IN_TRAINING"
	PromotionStatusPassed   = "PASSED"
	PromotionStatusRejected = "REJECTED"
)

type PromotionRequest struct {
	ID                   int64     `gorm:"primaryKey" json:"id"`
	UserID               uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User                 User      `gorm:"foreignKey:UserID" json:"user"`
	TargetRole           string    `gorm:"not null" json:"target_role"`
	Status               string    `gorm:"default:'PENDING_VERIFICATION'" json:"status"`
	CertificateURL       string    `json:"certificate_url"`
	RequirementsSnapshot string    `json:"requirements_snapshot"` // JSON string of omset and team size
	Note                 string    `json:"note"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type PromotionRepository interface {
	Create(req *PromotionRequest) error
	Update(req *PromotionRequest) error
	FindByID(id int64) (*PromotionRequest, error)
	FindAll(filter map[string]interface{}) ([]PromotionRequest, error)
}
