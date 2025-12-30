package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type submissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository(db *gorm.DB) domain.SubmissionRepository {
	return &submissionRepository{db: db}
}

func (r *submissionRepository) Create(submission *domain.Submission) error {
	return r.db.Create(submission).Error
}

func (r *submissionRepository) FindByID(id uuid.UUID) (*domain.Submission, error) {
	var submission domain.Submission
	if err := r.db.Preload("Client").Preload("Payments").First(&submission, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) FindAll(filter map[string]interface{}) ([]domain.Submission, error) {
	var submissions []domain.Submission
	db := r.db.Preload("Client")
	
	if status, ok := filter["status"]; ok && status != "" {
		db = db.Where("status = ?", status)
	}
	
	if err := db.Find(&submissions).Error; err != nil {
		return nil, err
	}
	return submissions, nil
}

func (r *submissionRepository) UpdateStatus(id uuid.UUID, status domain.SubmissionStatus, assigneeRole int) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":                status,
		"current_assignee_role": assigneeRole,
	}).Error
}
