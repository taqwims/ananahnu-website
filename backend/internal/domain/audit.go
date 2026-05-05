package domain

type AuditLogRepository interface {
	Create(log *AuditLog) error
	FindLogsByEntity(entityType string, entityID string) ([]AuditLog, error)
}
