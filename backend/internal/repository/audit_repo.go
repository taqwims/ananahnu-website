package repository

import (
	"ananahnu/internal/domain"

	"gorm.io/gorm"
)

type auditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) domain.AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(log *domain.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *auditLogRepository) FindLogsByEntity(entityType string, entityID string) ([]domain.AuditLog, error) {
	var logs []domain.AuditLog
	query := r.db.Order("created_at DESC")
	
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if entityID != "" {
		query = query.Where("entity_id = ?", entityID)
	}

	err := query.Find(&logs).Error
	return logs, err
}
