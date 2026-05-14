package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// CreateManualPayment creates a manual transfer payment with a proof URL.
func (uc *paymentUsecase) CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error {
	payment := &domain.Payment{
		SubmissionID: &submissionID,
		Amount:       amount,
		Method:       domain.PaymentMethodManual,
		Status:       domain.PaymentStatusPending,
		ProofURL:     proofURL,
	}

	if err := uc.PaymentRepo.Create(payment); err != nil {
		return err
	}

	return nil
}

// VerifyManualPayment allows an admin/finance user to approve or reject a manual payment.
func (uc *paymentUsecase) VerifyManualPayment(paymentID int64, approved bool, verifierID uuid.UUID) error {
	payment, err := uc.PaymentRepo.FindByID(paymentID)
	if err != nil {
		return fmt.Errorf("payment not found: %w", err)
	}

	if payment.Status != domain.PaymentStatusPending {
		return errors.New("payment is not in PENDING status")
	}

	if payment.Method != domain.PaymentMethodManual {
		return errors.New("only manual payments can be verified")
	}

	if approved {
		payment.Status = domain.PaymentStatusPaid
		now := time.Now()
		payment.PaidAt = &now
	} else {
		payment.Status = domain.PaymentStatusFailed
	}

	if err := uc.PaymentRepo.Update(payment); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	if approved {
		// Update linked invoices
		uc.updateLinkedInvoices(payment.ID)

		if payment.SubmissionID != nil {
			// Delegate workflow transition to WorkflowUC
			_ = uc.WorkflowUC.HandlePaymentSuccess(*payment.SubmissionID, payment.Amount)
		}
	} else if !approved && payment.SubmissionID != nil {
		uc.logPaymentActivity(*payment.SubmissionID, "PAYMENT_REJECTED", fmt.Sprintf("Pembayaran manual ditolak: Rp %.2f", payment.Amount))
	}

	return nil
}
