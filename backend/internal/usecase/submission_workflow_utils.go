package usecase

import (
	"ananahnu/internal/domain"
	"fmt"
	"log"

	"github.com/google/uuid"
)

func (uc *submissionWorkflowUsecase) logChange(id uuid.UUID, userID uuid.UUID, action string, oldStatus, newStatus domain.SubmissionStatus, note string) {
	uc.AuditRepo.Create(&domain.AuditLog{
		UserID:     &userID,
		Action:     action,
		EntityType: "SUBMISSION",
		EntityID:   id.String(),
		Notes:      "Status change: " + string(oldStatus) + " -> " + string(newStatus) + ". " + note,
	})
}

func (uc *submissionWorkflowUsecase) HandlePaymentSuccess(id uuid.UUID, amount float64) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	log.Printf("[WORKFLOW] Handling payment success for submission %s, amount %f", id, amount)

	// Update status if it was waiting for payment
	if sub.Status == domain.StatusWaitingPayment {
		nextStatus := domain.StatusQCOfficer
		if err := uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
			return err
		}
		uc.logChange(id, uuid.Nil, "PAYMENT_SUCCESS", sub.Status, nextStatus, fmt.Sprintf("Payment confirmed: %f", amount))
		
		// Notify QC
		users, _, _ := uc.UserRepo.FindAll(map[string]interface{}{}, 1, 100)
		for _, u := range users {
			if u.Role.Name == "QC_OFFICER" || (u.Role.Name == "VERIFIKATOR" && sub.ServiceType == "REGULER") {
				_ = uc.NotifUC.SendWorkflowNotification("payment_confirmed_internal", map[string]string{
					"business_name": sub.Client.BusinessName,
				}, u.Phone, &u.ID, id, "Pembayaran Diterima", "Pembayaran untuk *"+sub.Client.BusinessName+"* telah diverifikasi. Silakan distribusikan ke Drafter.")
			}
		}

		// Notify Client
		_ = uc.NotifUC.SendWorkflowNotification("payment_success", map[string]string{
			"client_name":   sub.Client.ClientName,
			"business_name": sub.Client.BusinessName,
			"amount":        fmt.Sprintf("%.0f", amount),
		}, sub.Client.Phone, nil, id, "Pembayaran Terverifikasi", "Halo *"+sub.Client.ClientName+"*, pembayaran Anda sebesar Rp "+fmt.Sprintf("%.0f", amount)+" untuk *"+sub.Client.BusinessName+"* telah terverifikasi. Pengajuan Anda kini masuk ke tahap verifikasi dokumen.")
	}

	return nil
}

func (uc *submissionWorkflowUsecase) generateSHTerbitInvoice(id uuid.UUID, sub *domain.Submission) {
	// Implementation for SH Terbit invoice
}

func (uc *submissionWorkflowUsecase) SubmitFieldValues(subID uuid.UUID, userID uuid.UUID, values []FieldValueInput) error {
	var domainValues []domain.FormFieldValue
	for _, v := range values {
		domainValues = append(domainValues, domain.FormFieldValue{
			SubmissionID: subID,
			FormFieldID:  v.FormFieldID,
			TextValue:    v.TextValue,
			FileURL:      v.FileURL,
			LinkValue:    v.LinkValue,
			UploadedBy:   userID,
		})
	}
	return uc.FieldValueRepo.CreateBulk(domainValues)
}
