package domain

import (
	"time"

	"github.com/google/uuid"
)

type KPIPerformance struct {
	ID            int64     `gorm:"primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid" json:"user_id"`
	Date          time.Time `gorm:"type:date" json:"date"`
	InputCount    int       `json:"input_count"`
	RevisionCount int       `json:"revision_count"`
	TotalNominal  float64   `json:"total_nominal"`
	CreatedAt     time.Time `json:"created_at"`
}
