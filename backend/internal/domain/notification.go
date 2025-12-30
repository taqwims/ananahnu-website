package domain

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID              int64     `gorm:"primaryKey" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid" json:"user_id"`
	Title           string    `json:"title"`
	Message         string    `json:"message"` // Text
	IsRead          bool      `json:"is_read"`
	RelatedEntityID uuid.UUID `gorm:"type:uuid" json:"related_entity_id"`
	CreatedAt       time.Time `json:"created_at"`
}

type NotificationRepository interface {
	Create(notif *Notification) error
	FindByUserID(userID uuid.UUID) ([]Notification, error)
}
