package usecase

import (
	"ananahnu/internal/domain"
	midtransPkg "ananahnu/pkg/midtrans"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

// --- Result Types ---

type MidtransPaymentResult struct {
	SnapToken string `json:"snap_token"`
	SnapURL   string `json:"snap_url"`
	OrderID   string `json:"order_id"`
}

// --- Interface ---

type PaymentUsecase interface {
	CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error
	CreateMidtransPayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*MidtransPaymentResult, error)
	HandleMidtransNotification(payload map[string]interface{}) error
	VerifyManualPayment(paymentID int64, approved bool, verifierID uuid.UUID) error
	GetPaymentsBySubmission(submissionID uuid.UUID) ([]domain.Payment, error)
	GetAllPayments(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error)
}

// --- Implementation ---

type paymentUsecase struct {
	paymentRepo    domain.PaymentRepository
	submissionRepo domain.SubmissionRepository
	midtrans       midtransPkg.PaymentGateway
}

func NewPaymentUsecase(p domain.PaymentRepository, s domain.SubmissionRepository, m midtransPkg.PaymentGateway) PaymentUsecase {
	return &paymentUsecase{
		paymentRepo:    p,
		submissionRepo: s,
		midtrans:       m,
	}
}

// CreateManualPayment creates a manual transfer payment with a proof URL.
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

	// Manual payment stays PENDING until admin verifies via VerifyManualPayment
	return nil
}

// CreateMidtransPayment initiates a Snap transaction with Midtrans and stores the payment record.
func (uc *paymentUsecase) CreateMidtransPayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*MidtransPaymentResult, error) {
	// Generate unique order ID with timestamp to avoid duplicates
	orderID := fmt.Sprintf("ANN-%s-%d", submissionID.String()[:8], time.Now().Unix())

	customer := midtransPkg.CustomerDetail{
		FirstName: customerName,
		Email:     email,
		Phone:     phone,
	}

	items := []midtransPkg.ItemDetail{
		{
			ID:    "halal-cert",
			Name:  "Sertifikasi Halal",
			Price: int64(amount),
			Qty:   1,
		},
	}

	result, err := uc.midtrans.CreateSnapTransaction(orderID, int64(amount), customer, items)
	if err != nil {
		return nil, fmt.Errorf("failed to create snap transaction: %w", err)
	}

	payment := &domain.Payment{
		SubmissionID: submissionID,
		Amount:       amount,
		Method:       domain.PaymentMethodMidtrans,
		Status:       domain.PaymentStatusPending,
		ExternalID:   orderID,
		SnapToken:    result.Token,
		SnapURL:      result.RedirectURL,
	}

	if err := uc.paymentRepo.Create(payment); err != nil {
		return nil, fmt.Errorf("failed to save payment record: %w", err)
	}

	return &MidtransPaymentResult{
		SnapToken: result.Token,
		SnapURL:   result.RedirectURL,
		OrderID:   orderID,
	}, nil
}

// HandleMidtransNotification processes incoming Midtrans webhook notifications.
// It performs:
// 1. SHA512 signature verification
// 2. CoreAPI transaction status re-check (best practice)
// 3. Payment status update
// 4. Submission workflow transition on successful payment
func (uc *paymentUsecase) HandleMidtransNotification(payload map[string]interface{}) error {
	// Extract required fields from notification payload
	orderID, _ := payload["order_id"].(string)
	statusCode, _ := payload["status_code"].(string)
	grossAmount, _ := payload["gross_amount"].(string)
	signatureKey, _ := payload["signature_key"].(string)

	if orderID == "" {
		return errors.New("missing order_id in notification payload")
	}

	// Step 1: Verify signature — SHA512(order_id + status_code + gross_amount + server_key)
	if !uc.midtrans.VerifySignature(orderID, statusCode, grossAmount, signatureKey) {
		log.Printf("[MIDTRANS WEBHOOK] Invalid signature for order %s", orderID)
		return errors.New("invalid notification signature")
	}

	// Step 2: Re-verify with Midtrans CoreAPI (recommended best practice)
	txStatus, err := uc.midtrans.CheckTransactionStatus(orderID)
	if err != nil {
		log.Printf("[MIDTRANS WEBHOOK] Failed to check transaction status for %s: %v", orderID, err)
		return fmt.Errorf("failed to check transaction status: %w", err)
	}

	// Step 3: Find payment in database
	payment, err := uc.paymentRepo.FindByExternalID(orderID)
	if err != nil {
		log.Printf("[MIDTRANS WEBHOOK] Payment not found for order %s: %v", orderID, err)
		return fmt.Errorf("payment not found for order %s: %w", orderID, err)
	}

	// Step 4: Map Midtrans transaction status to our payment status
	previousStatus := payment.Status

	switch txStatus.TransactionStatus {
	case "capture":
		if txStatus.FraudStatus == "accept" {
			payment.Status = domain.PaymentStatusPaid
		} else if txStatus.FraudStatus == "challenge" {
			// Keep pending, requires manual review on Midtrans dashboard
			log.Printf("[MIDTRANS WEBHOOK] Order %s fraud status: challenge", orderID)
		}
	case "settlement":
		payment.Status = domain.PaymentStatusPaid
	case "deny", "cancel", "expire":
		payment.Status = domain.PaymentStatusFailed
	case "pending":
		// Stay PENDING — waiting for customer to complete payment
	default:
		log.Printf("[MIDTRANS WEBHOOK] Unknown transaction status '%s' for order %s", txStatus.TransactionStatus, orderID)
	}

	// Step 5: Update payment metadata
	payment.PaymentType = txStatus.PaymentType
	payment.MidtransID = txStatus.TransactionID
	if payment.Status == domain.PaymentStatusPaid {
		now := time.Now()
		payment.PaidAt = &now
	}

	if err := uc.paymentRepo.Update(payment); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	log.Printf("[MIDTRANS WEBHOOK] Order %s: %s -> %s (midtrans: %s)",
		orderID, previousStatus, payment.Status, txStatus.TransactionStatus)

	// Step 6: If payment succeeded, transition submission to next state
	if payment.Status == domain.PaymentStatusPaid && previousStatus != domain.PaymentStatusPaid {
		if err := uc.submissionRepo.UpdateStatus(payment.SubmissionID, domain.StatusVervalPendamping, 0); err != nil {
			log.Printf("[MIDTRANS WEBHOOK] Failed to transition submission %s: %v", payment.SubmissionID, err)
			return fmt.Errorf("failed to transition submission: %w", err)
		}
		log.Printf("[MIDTRANS WEBHOOK] Submission %s transitioned to VERVAL_PENDAMPING", payment.SubmissionID)
	}

	return nil
}

// VerifyManualPayment allows an admin/finance user to approve or reject a manual payment.
func (uc *paymentUsecase) VerifyManualPayment(paymentID int64, approved bool, verifierID uuid.UUID) error {
	payment, err := uc.paymentRepo.FindByID(paymentID)
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

	if err := uc.paymentRepo.Update(payment); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	// Transition submission on approval
	if approved {
		if err := uc.submissionRepo.UpdateStatus(payment.SubmissionID, domain.StatusVervalPendamping, 0); err != nil {
			log.Printf("[MANUAL VERIFY] Failed to transition submission %s: %v", payment.SubmissionID, err)
			return fmt.Errorf("failed to transition submission: %w", err)
		}
		log.Printf("[MANUAL VERIFY] Payment %d approved by %s, submission %s -> VERVAL_PENDAMPING",
			paymentID, verifierID, payment.SubmissionID)
	}

	return nil
}

// GetPaymentsBySubmission returns all payments for a given submission.
func (uc *paymentUsecase) GetPaymentsBySubmission(submissionID uuid.UUID) ([]domain.Payment, error) {
	return uc.paymentRepo.FindBySubmissionID(submissionID)
}

// GetAllPayments returns a paginated list of all payments (for admin/finance dashboard).
func (uc *paymentUsecase) GetAllPayments(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error) {
	return uc.paymentRepo.FindAll(filter, page, limit)
}
