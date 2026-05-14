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
	SyncPaymentStatus(paymentID int64) error
	InitiateBulkPayment(invoiceIDs []int64, payerID uuid.UUID) (*domain.Payment, error)
	CleanupExpiredPayments() error
}

// --- Implementation ---

type paymentUsecase struct {
	paymentRepo    domain.PaymentRepository
	submissionRepo domain.SubmissionRepository
	auditRepo      domain.AuditLogRepository
	midtrans       midtransPkg.PaymentGateway
	invoiceRepo    domain.InvoiceRepository
}

func NewPaymentUsecase(p domain.PaymentRepository, s domain.SubmissionRepository, a domain.AuditLogRepository, m midtransPkg.PaymentGateway, i domain.InvoiceRepository) PaymentUsecase {
	return &paymentUsecase{
		paymentRepo:    p,
		submissionRepo: s,
		auditRepo:      a,
		midtrans:       m,
		invoiceRepo:    i,
	}
}

func (uc *paymentUsecase) logPaymentActivity(submissionID uuid.UUID, action, note string) {
	uc.auditRepo.Create(&domain.AuditLog{
		UserID:     nil, // System action
		Action:     action,
		EntityType: "SUBMISSION",
		EntityID:   submissionID.String(),
		Notes:      note,
	})
}

// CreateManualPayment creates a manual transfer payment with a proof URL.
func (uc *paymentUsecase) CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error {
	payment := &domain.Payment{
		SubmissionID: &submissionID,
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
		log.Printf("[MIDTRANS] Failed to create transaction for order %s: %v", orderID, err)
		return nil, fmt.Errorf("failed to create snap transaction: %w", err)
	}

	payment := &domain.Payment{
		SubmissionID: &submissionID,
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

	uc.logPaymentActivity(submissionID, "PAYMENT_INITIATED", fmt.Sprintf("Pembayaran Midtrans dimulai: Rp %.2f (Order ID: %s)", amount, orderID))

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
	case "capture", "settlement":
		payment.Status = domain.PaymentStatusPaid
	case "deny", "cancel":
		payment.Status = domain.PaymentStatusFailed
	case "expire":
		// User requested to delete if expired
		log.Printf("[MIDTRANS WEBHOOK] Deleting expired payment %d (Order ID: %s)", payment.ID, orderID)
		return uc.paymentRepo.Delete(payment.ID)
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

	// Step 6: If payment succeeded, update invoices and transition submission
	if payment.Status == domain.PaymentStatusPaid && previousStatus != domain.PaymentStatusPaid {
		// Update linked invoices
		if err := uc.updateLinkedInvoices(payment.ID); err != nil {
			log.Printf("[MIDTRANS WEBHOOK] Failed to update linked invoices for payment %d: %v", payment.ID, err)
		}

		if payment.SubmissionID != nil {
			sub, _ := uc.submissionRepo.FindByID(*payment.SubmissionID)
			
			// Transition logic:
			// 1. Marketing / Partner / Self Declare -> Go straight to QC_OFFICER
			// 2. Organic Reguler WITH Consultant -> Go straight to QC_OFFICER (already has someone handling)
			// 3. Organic Reguler WITHOUT Consultant -> Must go to VERVAL_PENDAMPING for claiming
			nextStatus := domain.StatusQCOfficer
			if sub != nil && (sub.DataSource == "ORGANIK" || sub.DataSource == "") && sub.ServiceType == "REGULER" && sub.ConsultantID == nil {
				nextStatus = domain.StatusVervalPendamping
			}
			
			if err := uc.submissionRepo.UpdateStatus(*payment.SubmissionID, nextStatus, 0); err != nil {
				log.Printf("[MIDTRANS WEBHOOK] Failed to transition submission %s: %v", *payment.SubmissionID, err)
				return fmt.Errorf("failed to transition submission: %w", err)
			}
			uc.logPaymentActivity(*payment.SubmissionID, "PAYMENT_SUCCESS", fmt.Sprintf("Pembayaran Midtrans berhasil: Rp %.2f", payment.Amount))
			log.Printf("[MIDTRANS WEBHOOK] Submission %s transitioned to %s (DataSource: %s, Consultant: %v)", 
				*payment.SubmissionID, nextStatus, sub.DataSource, sub.ConsultantID)
		}
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

	// Transition and Update Invoices on approval
	if approved {
		// Update linked invoices
		uc.updateLinkedInvoices(payment.ID)

		if payment.SubmissionID != nil {
			sub, _ := uc.submissionRepo.FindByID(*payment.SubmissionID)
			
			nextStatus := domain.StatusQCOfficer
			if sub != nil && (sub.DataSource == "ORGANIK" || sub.DataSource == "") && sub.ServiceType == "REGULER" && sub.ConsultantID == nil {
				nextStatus = domain.StatusVervalPendamping
			}

			if err := uc.submissionRepo.UpdateStatus(*payment.SubmissionID, nextStatus, 0); err != nil {
				log.Printf("[MANUAL VERIFY] Failed to transition submission %s: %v", *payment.SubmissionID, err)
			}
			uc.logPaymentActivity(*payment.SubmissionID, "PAYMENT_VERIFIED", fmt.Sprintf("Pembayaran manual disetujui: Rp %.2f", payment.Amount))
			log.Printf("[MANUAL VERIFY] Payment %d approved by %s, submission %s -> %s (Consultant: %v)",
				paymentID, verifierID, *payment.SubmissionID, nextStatus, sub.ConsultantID)
		}
	} else if !approved && payment.SubmissionID != nil {
		uc.logPaymentActivity(*payment.SubmissionID, "PAYMENT_REJECTED", fmt.Sprintf("Pembayaran manual ditolak: Rp %.2f", payment.Amount))
	}

	return nil
}

// GetPaymentsBySubmission returns all payments for a given submission.
func (uc *paymentUsecase) GetPaymentsBySubmission(submissionID uuid.UUID) ([]domain.Payment, error) {
	return uc.paymentRepo.FindBySubmissionID(submissionID)
}

// GetAllPayments returns a paginated list of all payments (for admin/finance dashboard).
func (uc *paymentUsecase) GetAllPayments(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error) {
	// Auto cleanup before listing
	go uc.CleanupExpiredPayments()
	return uc.paymentRepo.FindAll(filter, page, limit)
}

// SyncPaymentStatus manually queries Midtrans API to update the local payment status.
func (uc *paymentUsecase) SyncPaymentStatus(paymentID int64) error {
	payment, err := uc.paymentRepo.FindByID(paymentID)
	if err != nil {
		return err
	}

	if payment.Status == domain.PaymentStatusPaid {
		return nil // Already paid
	}

	txStatus, err := uc.midtrans.CheckTransactionStatus(payment.ExternalID)
	if err != nil {
		return err
	}

	previousStatus := payment.Status
	
	// Map status (Reuse logic from webhook or extract to helper)
	switch txStatus.TransactionStatus {
	case "capture", "settlement":
		payment.Status = domain.PaymentStatusPaid
	case "deny", "cancel":
		payment.Status = domain.PaymentStatusFailed
	case "expire":
		log.Printf("[SYNC] Deleting expired payment %d", payment.ID)
		return uc.paymentRepo.Delete(payment.ID)
	}

	if payment.Status == domain.PaymentStatusPaid {
		now := time.Now()
		payment.PaidAt = &now
		payment.PaymentType = txStatus.PaymentType
		payment.MidtransID = txStatus.TransactionID
		
		if err := uc.paymentRepo.Update(payment); err != nil {
			return err
		}

		// Transition and Update Invoices
		if previousStatus != domain.PaymentStatusPaid {
			// Update linked invoices
			uc.updateLinkedInvoices(payment.ID)

			if payment.SubmissionID != nil {
				sub, _ := uc.submissionRepo.FindByID(*payment.SubmissionID)
				
				// Transition logic consistent with notification handler:
				nextStatus := domain.StatusQCOfficer
				if sub != nil && (sub.DataSource == "ORGANIK" || sub.DataSource == "") && sub.ServiceType == "REGULER" && sub.ConsultantID == nil {
					nextStatus = domain.StatusVervalPendamping
				}
				
				uc.logPaymentActivity(*payment.SubmissionID, "PAYMENT_SYNCED", fmt.Sprintf("Status pembayaran disinkronisasi: PAID (Rp %.2f)", payment.Amount))
				return uc.submissionRepo.UpdateStatus(*payment.SubmissionID, nextStatus, 0)
			}
		}
	}
	return nil
}

func (uc *paymentUsecase) InitiateBulkPayment(invoiceIDs []int64, payerID uuid.UUID) (*domain.Payment, error) {
	invoices, err := uc.invoiceRepo.FindByIDs(invoiceIDs)
	if err != nil {
		return nil, err
	}

	if len(invoices) == 0 {
		return nil, errors.New("no invoices found")
	}

	var totalAmount float64
	for _, inv := range invoices {
		if inv.Status == domain.InvoiceStatusPaid {
			return nil, fmt.Errorf("invoice %d is already paid", inv.ID)
		}
		totalAmount += inv.Amount
	}

	// Create Payment record
	payment := &domain.Payment{
		Amount:     totalAmount,
		Method:     domain.PaymentMethodMidtrans,
		Status:     domain.PaymentStatusPending,
		ExternalID: fmt.Sprintf("BULK-%d", time.Now().UnixNano()),
	}

	// Midtrans request
	midtransRes, err := uc.midtrans.CreateSnapTransaction(payment.ExternalID, int64(totalAmount), midtransPkg.CustomerDetail{
		FirstName: "Coordinator",
		Email:     "coordinator@ananahnu.com",
	}, nil)
	if err != nil {
		return nil, err
	}

	payment.SnapToken = midtransRes.Token
	payment.SnapURL = midtransRes.RedirectURL

	if err := uc.paymentRepo.Create(payment); err != nil {
		return nil, err
	}

	// Link Invoices to this Payment
	for _, inv := range invoices {
		inv.PaymentID = &payment.ID
		uc.invoiceRepo.Update(&inv)
	}

	return payment, nil
}

func (uc *paymentUsecase) CleanupExpiredPayments() error {
	// Simple cleanup: delete pending payments older than 24 hours
	// Note: Midtrans default expiry is 24h.
	// For production, this should be a scheduled task, but for now we can trigger it.
	
	// We can't easily query by time in FindAll currently without more complex filters,
	// so let's just do a targeted check.
	
	// We'll just look for PENDING payments
	payments, _, err := uc.paymentRepo.FindAll(map[string]interface{}{"status": domain.PaymentStatusPending}, 1, 100)
	if err != nil {
		return err
	}

	cutoff := time.Now().Add(-24 * time.Hour)
	for _, p := range payments {
		if p.CreatedAt.Before(cutoff) {
			log.Printf("[CLEANUP] Deleting expired pending payment %d (Created at %v)", p.ID, p.CreatedAt)
			uc.paymentRepo.Delete(p.ID)
		}
	}

	return nil
}

func (uc *paymentUsecase) updateLinkedInvoices(paymentID int64) error {
	invoices, _, err := uc.invoiceRepo.FindAll(map[string]interface{}{"payment_id": paymentID}, 1, 1000)
	if err != nil {
		return err
	}

	now := time.Now()
	for _, inv := range invoices {
		inv.Status = domain.InvoiceStatusPaid
		inv.PaidAt = &now
		uc.invoiceRepo.Update(&inv)
	}
	return nil
}
