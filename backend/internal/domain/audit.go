package domain

type AuditLogRepository interface {
	Create(log *AuditLog) error
	FindLogsByEntity(entityType string, entityID string) ([]AuditLog, error)
	FindRecent(limit int, filter map[string]interface{}) ([]AuditLog, error)
}
