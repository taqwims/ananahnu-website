package repository

import (
	"ananahnu/internal/domain"
	"time"

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
	if err := r.db.Preload("Client").Preload("Payments").Preload("Invoice").Preload("CostDetail").Preload("AssignedDrafter").Preload("Consultant").Preload("BusinessType").First(&submission, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) FindAll(filter map[string]interface{}) ([]domain.Submission, error) {
	var submissions []domain.Submission
	db := r.db.Preload("Client.Facilitator.Leader").Preload("AssignedDrafter").Preload("Consultant")
	
	if status, ok := filter["status"]; ok && status != "" {
		db = db.Where("submissions.status = ?", status)
	}

	if serviceType, ok := filter["service_type"]; ok && serviceType != "" {
		db = db.Where("submissions.service_type = ?", serviceType)
	}

	if preloadInvoice, ok := filter["preload_invoice"]; ok && preloadInvoice == true {
		db = db.Preload("Invoice")
	}

	if preloadExpenses, ok := filter["preload_expenses"]; ok && preloadExpenses == true {
		db = db.Preload("Expenses")
	}

	// Filter by Facilitator ID (Consultant/Coordinator logic or Marketing)
	if fIDs, ok := filter["facilitator_ids"]; ok {
		ids := fIDs.([]uuid.UUID)
		if len(ids) > 0 {
			db = db.Joins("JOIN clients ON clients.id = submissions.client_id").
				Where("clients.facilitator_id IN ? OR submissions.consultant_id IN ?", ids, ids)
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

func (r *submissionRepository) UpdateConsultant(id uuid.UUID, consultantID *uuid.UUID) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("consultant_id", consultantID).Error
}

func (r *submissionRepository) UpdateRejectNote(id uuid.UUID, note string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("reject_note", note).Error
}

func (r *submissionRepository) UpdateSH(id uuid.UUID, shURL string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("sh_url", shURL).Error
}

func (r *submissionRepository) UpdateAuditInfo(id uuid.UUID, auditDate *time.Time) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("audit_date", auditDate).Error
}

func (r *submissionRepository) UpdateAuditResult(id uuid.UUID, url1, url2 string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"audit_result_1_url": url1,
		"audit_result_2_url": url2,
	}).Error
}

func (r *submissionRepository) UpdateDataSource(id uuid.UUID, dataSource string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("data_source", dataSource).Error
}

func (r *submissionRepository) UpdateBusinessType(id uuid.UUID, businessTypeID int64) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("business_type_id", businessTypeID).Error
}

func (r *submissionRepository) UpdateTrackingNumber(id uuid.UUID, trackingNumber string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("tracking_number", trackingNumber).Error
}

func (r *submissionRepository) FindByTrackingNumber(trackingNumber string) (*domain.Submission, error) {
	var submission domain.Submission
	if err := r.db.Preload("Client").Preload("Invoice").Preload("CostDetail").Preload("AssignedDrafter").Preload("Consultant").Preload("BusinessType").First(&submission, "tracking_number = ?", trackingNumber).Error; err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) Delete(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete related field values first
		if err := tx.Where("submission_id = ?", id).Delete(&domain.FormFieldValue{}).Error; err != nil {
			return err
		}
		// Delete payments
		if err := tx.Where("submission_id = ?", id).Delete(&domain.Payment{}).Error; err != nil {
			return err
		}
		// Delete invoices
		if err := tx.Where("submission_id = ?", id).Delete(&domain.Invoice{}).Error; err != nil {
			return err
		}
		// Delete the submission itself
		if err := tx.Where("id = ?", id).Delete(&domain.Submission{}).Error; err != nil {
			return err
		}
		return nil
	})
}
