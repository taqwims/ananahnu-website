package domain

type AuditLogRepository interface {
	Create(log *AuditLog) error
}
