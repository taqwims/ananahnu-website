package usecase

import (
	"ananahnu/internal/domain"
	"log"
	"time"

	"github.com/google/uuid"
)

func (uc *paymentUsecase) logPaymentActivity(submissionID uuid.UUID, action, note string) {
	uc.AuditRepo.Create(&domain.AuditLog{
		UserID:     nil, // System action
		Action:     action,
		EntityType: "SUBMISSION",
		EntityID:   submissionID.String(),
		Notes:      note,
	})
}

func (uc *paymentUsecase) CleanupExpiredPayments() error {
	payments, _, err := uc.PaymentRepo.FindAll(map[string]interface{}{"status": domain.PaymentStatusPending}, 1, 100)
	if err != nil {
		return err
	}

	cutoff := time.Now().Add(-24 * time.Hour)
	for _, p := range payments {
		if p.CreatedAt.Before(cutoff) {
			linkedInvoices, _, err := uc.InvoiceRepo.FindAll(map[string]interface{}{"payment_id": p.ID}, 1, 1)
			if err == nil && len(linkedInvoices) > 0 {
				log.Printf("[CLEANUP] Skipping payment %d (Order ID: %s) because it is linked to invoices", p.ID, p.ExternalID)
				continue
			}

			log.Printf("[CLEANUP] Deleting expired pending payment %d (Order ID: %s, Created at %v)", p.ID, p.ExternalID, p.CreatedAt)
			uc.PaymentRepo.Delete(p.ID)
		}
	}

	return nil
}

func (uc *paymentUsecase) updateLinkedInvoices(paymentID int64) error {
	invoices, _, err := uc.InvoiceRepo.FindAll(map[string]interface{}{"payment_id": paymentID}, 1, 1000)
	if err != nil {
		return err
	}

	for _, inv := range invoices {
		// Use BillingUsecase to mark paid so it triggers referral commissions
		if err := uc.BillingUC.MarkInvoicePaid(inv.ID); err != nil {
			log.Printf("[PAYMENT UC] Failed to mark invoice %d as paid: %v", inv.ID, err)
		}
	}
	return nil
}

func (uc *paymentUsecase) GetPaymentsBySubmission(submissionID uuid.UUID) ([]domain.Payment, error) {
	return uc.PaymentRepo.FindBySubmissionID(submissionID)
}

func (uc *paymentUsecase) GetAllPayments(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error) {
	// Auto cleanup before listing
	go uc.CleanupExpiredPayments()
	return uc.PaymentRepo.FindAll(filter, page, limit)
}
