package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/midtrans"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type PaymentUsecase interface {
	CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error
	CreateMidtransPayment(submissionID uuid.UUID, amount float64, email string) (string, error) // Returns SnapToken
	HandleMidtransNotification(orderID string, status string) error
	VerifyManualPayment(paymentID int64, approved bool) error
}

type paymentUsecase struct {
	paymentRepo    domain.PaymentRepository
	submissionRepo domain.SubmissionRepository
	midtrans       midtrans.PaymentGateway
}

func NewPaymentUsecase(p domain.PaymentRepository, s domain.SubmissionRepository, m midtrans.PaymentGateway) PaymentUsecase {
	return &paymentUsecase{
		paymentRepo:    p,
		submissionRepo: s,
		midtrans:       m,
	}
}

func (uc *paymentUsecase) CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error {
	payment := &domain.Payment{
		SubmissionID: submissionID,
		Amount:       amount,
		Method:       domain.PaymentMethodManual,
		Status:       domain.PaymentStatusPending,
		ProofURL:     proofURL,
	}
	
	if err := uc.paymentRepo.Create(payment); err != nil {
		return err
	}
	
	// Update Submission status?
	// Maybe "WAITING_PAYMENT_VERIFICATION"?
	// Checking Plan: "If ... requires payment ... halts at WAITING_PAYMENT"
	// Manual -> PENDING -> Admin Verifies -> PAID.
	
	return nil
}

func (uc *paymentUsecase) CreateMidtransPayment(submissionID uuid.UUID, amount float64, email string) (string, error) {
	orderID := fmt.Sprintf("ORD-%s-%d", submissionID.String(), time.Now().Unix())
	
	snapToken, err := uc.midtrans.GenerateSnapToken(orderID, int64(amount), email)
	if err != nil {
		return "", err
	}

	payment := &domain.Payment{
		SubmissionID: submissionID,
		Amount:       amount,
		Method:       domain.PaymentMethodMidtrans,
		Status:       domain.PaymentStatusPending,
		ExternalID:   orderID,
	}

	if err := uc.paymentRepo.Create(payment); err != nil {
		return "", err
	}

	return snapToken, nil
}

func (uc *paymentUsecase) HandleMidtransNotification(orderID string, status string) error {
	payment, err := uc.paymentRepo.FindByExternalID(orderID)
	if err != nil {
		return err
	}

	if status == "capture" || status == "settlement" {
		payment.Status = domain.PaymentStatusPaid
		// Update Submission to Next Step?
		// e.g. WAITING_PAYMENT -> VERVAL_PENDAMPING?
	} else if status == "deny" || status == "expire" || status == "cancel" {
		payment.Status = domain.PaymentStatusFailed
	}

	return uc.paymentRepo.Update(payment)
}

func (uc *paymentUsecase) VerifyManualPayment(paymentID int64, approved bool) error {
	// Simple stub
	return nil
}
