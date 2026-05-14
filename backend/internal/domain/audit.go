package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type AuditLog struct {
	ID         int64          `gorm:"primaryKey" json:"id"`
	UserID     *uuid.UUID     `gorm:"type:uuid" json:"user_id"`
	User       *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Action     string         `json:"action"`
	EntityType string         `json:"entity_type"`
	EntityID   string         `json:"entity_id"`
	Payload    datatypes.JSON `json:"payload"`
	Notes      string         `json:"notes"`
	CreatedAt  time.Time      `json:"created_at"`
}

type AuditLogRepository interface {
	Create(log *AuditLog) error
	FindLogsByEntity(entityType string, entityID string) ([]AuditLog, error)
	FindRecent(limit int, filter map[string]interface{}) ([]AuditLog, error)
}
