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
	if err := r.db.Preload("Client").
		Preload("Payments").
		Preload("Invoice").
		Preload("Invoices").
		Preload("CostDetail").
		Preload("CostDetail.Province").
		Preload("CostDetail.Regency").
		Preload("CostDetail.District").
		Preload("CostDetail.ProductCategory").
		Preload("CostDetail.BusinessScale").
		Preload("AssignedDrafter").
		Preload("Consultant").
		Preload("BusinessType").
		Preload("ProductCategory").
		Preload("FieldValues").
		Preload("FieldValues.FormField").
		First(&submission, "id = ?", id).Error; err != nil {
		return nil, err
	}
	if submission.ProductCategoryID == nil && submission.CostDetail != nil && submission.CostDetail.ProductCategoryID != nil {
		submission.ProductCategoryID = submission.CostDetail.ProductCategoryID
	}
	if submission.ProductCategory == nil && submission.CostDetail != nil && submission.CostDetail.ProductCategory.ID != 0 {
		submission.ProductCategory = &submission.CostDetail.ProductCategory
	}
	if submission.BusinessTypeID == nil && submission.CostDetail != nil && submission.CostDetail.BusinessTypeID != nil {
		submission.BusinessTypeID = submission.CostDetail.BusinessTypeID
	}
	return &submission, nil
}

func (r *submissionRepository) FindAll(filter map[string]interface{}) ([]domain.Submission, error) {
	var submissions []domain.Submission
	db := r.db.Preload("Client").
		Preload("Client.Facilitator.Role").
		Preload("Client.Facilitator.Leader.Role").
		Preload("Client.Facilitator.Leader.Leader.Role").
		Preload("AssignedDrafter").
		Preload("Consultant").
		Preload("Consultant.Role").
		Preload("Consultant.Leader.Role").
		Preload("Consultant.Leader.Leader.Role").
		Preload("Invoice").
		Preload("Invoices").
		Preload("Payments").
		Preload("CostDetail")
	
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

	// Filter by Client User ID (Client role visibility)
	if clientUserID, ok := filter["client_user_id"]; ok {
		db = db.Where("submissions.client_id IN (SELECT id FROM clients WHERE created_by = ?) OR submissions.id IN (SELECT submission_id FROM tele_forms WHERE client_user_id = ?)", clientUserID, clientUserID)
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

func (r *submissionRepository) UpdateHasBeenReturned(id uuid.UUID, returned bool) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("has_been_returned", returned).Error
}

func (r *submissionRepository) UpdateSH(id uuid.UUID, shURL string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("sh_url", shURL).Error
}

func (r *submissionRepository) UpdateSJPH(id uuid.UUID, sjphURL string, notes string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"sjph_url":   sjphURL,
		"sjph_notes": notes,
	}).Error
}

func (r *submissionRepository) ApproveSJPH(id uuid.UUID, approvedBy uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"sjph_approved_at": &now,
		"sjph_approved_by": &approvedBy,
	}).Error
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
		// 1. Delete field values
		if err := tx.Where("submission_id = ?", id).Delete(&domain.FormFieldValue{}).Error; err != nil {
			return err
		}
		// 2. Delete submission files
		if err := tx.Where("submission_id = ?", id).Delete(&domain.SubmissionFile{}).Error; err != nil {
			return err
		}
		// 3. Delete cost details
		if err := tx.Where("submission_id = ?", id).Delete(&domain.SubmissionCostDetail{}).Error; err != nil {
			return err
		}
		// 4. Delete SPH
		if err := tx.Where("submission_id = ?", id).Delete(&domain.SPH{}).Error; err != nil {
			return err
		}
		// 5. Delete commissions (referral/sales)
		if err := tx.Where("submission_id = ?", id).Delete(&domain.Commission{}).Error; err != nil {
			return err
		}
		// 6. Delete expenses
		if err := tx.Where("submission_id = ?", id).Delete(&domain.Expense{}).Error; err != nil {
			return err
		}
		// 7. Unlink telemarketing forms
		if err := tx.Model(&domain.TeleForm{}).Where("submission_id = ?", id).Update("submission_id", nil).Error; err != nil {
			return err
		}
		// 8. Delete payments
		if err := tx.Where("submission_id = ?", id).Delete(&domain.Payment{}).Error; err != nil {
			return err
		}
		// 9. Delete invoices
		if err := tx.Where("submission_id = ?", id).Delete(&domain.Invoice{}).Error; err != nil {
			return err
		}
		// 10. Delete audit logs
		if err := tx.Where("entity_type = ? AND entity_id = ?", "SUBMISSION", id.String()).Delete(&domain.AuditLog{}).Error; err != nil {
			return err
		}
		// 11. Delete the submission itself
		if err := tx.Where("id = ?", id).Delete(&domain.Submission{}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *submissionRepository) PurgeAll() error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM form_field_values").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM submission_files").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM submission_cost_details").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM sphs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM commissions WHERE submission_id IS NOT NULL").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM expenses WHERE submission_id IS NOT NULL").Error; err != nil {
			return err
		}
		if err := tx.Exec("UPDATE tele_forms SET submission_id = NULL WHERE submission_id IS NOT NULL").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM payments WHERE submission_id IS NOT NULL").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM invoices WHERE submission_id IS NOT NULL").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM audit_logs WHERE entity_type = 'SUBMISSION'").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM submissions").Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *submissionRepository) UpdateBPJPHPayment(id uuid.UUID, status string, amount float64, paidAt *time.Time) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"bpjph_payment_status": status,
		"bpjph_amount":         amount,
		"bpjph_paid_at":        paidAt,
	}).Error
}

func (r *submissionRepository) UpdateBPJPHPaymentBulk(ids []uuid.UUID, status string, amount float64, paidAt *time.Time) error {
	return r.db.Model(&domain.Submission{}).Where("id IN ?", ids).Updates(map[string]interface{}{
		"bpjph_payment_status": status,
		"bpjph_amount":         amount,
		"bpjph_paid_at":        paidAt,
	}).Error
}

func (r *submissionRepository) Update(submission *domain.Submission) error {
	return r.db.Model(submission).Updates(submission).Error
}

func (r *submissionRepository) CountSubmissionsWithContractInYear(year int) (int64, error) {
	var count int64
	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	err := r.db.Model(&domain.Submission{}).
		Where("contract_number IS NOT NULL AND contract_number != '' AND created_at >= ? AND created_at < ?", startDate, endDate).
		Count(&count).Error
	return count, err
}
