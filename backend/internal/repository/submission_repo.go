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
	if err := r.db.Preload("Client").Preload("Payments").Preload("AssignedDrafter").First(&submission, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) FindAll(filter map[string]interface{}) ([]domain.Submission, error) {
	var submissions []domain.Submission
	db := r.db.Preload("Client.Facilitator.Leader").Preload("AssignedDrafter")
	
	if status, ok := filter["status"]; ok && status != "" {
		db = db.Where("submissions.status = ?", status)
	}

	// Filter by Facilitator ID (Consultant/Coordinator logic)
	if fIDs, ok := filter["facilitator_ids"]; ok {
		ids := fIDs.([]uuid.UUID)
		if len(ids) > 0 {
			db = db.Joins("JOIN clients ON clients.id = submissions.client_id").
				Where("clients.facilitator_id IN ?", ids)
		}
	}

	// Filter by Assigned Drafter (Drafter role visibility)
	if drafterID, ok := filter["assigned_drafter_id"]; ok {
		db = db.Where("submissions.assigned_drafter_id = ?", drafterID)
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

func (r *submissionRepository) UpdateAssignee(id uuid.UUID, drafterID *uuid.UUID) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("assigned_drafter_id", drafterID).Error
}

func (r *submissionRepository) UpdateRejectNote(id uuid.UUID, note string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("reject_note", note).Error
}
