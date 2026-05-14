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

	result, err := uc.Midtrans.CreateSnapTransaction(orderID, int64(amount), customer, items)
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

	if err := uc.PaymentRepo.Create(payment); err != nil {
		return nil, fmt.Errorf("failed to save payment record: %w", err)
	}

	// Link Invoice to Payment (if single payment for submission)
	inv, _ := uc.InvoiceRepo.FindBySubmissionID(submissionID)
	if inv != nil {
		inv.PaymentID = &payment.ID
		_ = uc.InvoiceRepo.Update(inv)
	}

	uc.logPaymentActivity(submissionID, "PAYMENT_INITIATED", fmt.Sprintf("Pembayaran Midtrans dimulai: Rp %.2f (Order ID: %s)", amount, orderID))

	return &MidtransPaymentResult{
		SnapToken: result.Token,
		SnapURL:   result.RedirectURL,
		OrderID:   orderID,
	}, nil
}

// HandleMidtransNotification processes incoming Midtrans webhook notifications.
func (uc *paymentUsecase) HandleMidtransNotification(payload map[string]interface{}) error {
	orderID, _ := payload["order_id"].(string)
	statusCode, _ := payload["status_code"].(string)
	grossAmount, _ := payload["gross_amount"].(string)
	signatureKey, _ := payload["signature_key"].(string)

	if orderID == "" {
		return errors.New("missing order_id in notification payload")
	}

	if !uc.Midtrans.VerifySignature(orderID, statusCode, grossAmount, signatureKey) {
		log.Printf("[MIDTRANS WEBHOOK] Invalid signature for order %s", orderID)
		return errors.New("invalid notification signature")
	}

	txStatus, err := uc.Midtrans.CheckTransactionStatus(orderID)
	if err != nil {
		log.Printf("[MIDTRANS WEBHOOK] Failed to check transaction status for %s: %v", orderID, err)
		return fmt.Errorf("failed to check transaction status: %w", err)
	}

	payment, err := uc.PaymentRepo.FindByExternalID(orderID)
	if err != nil {
		log.Printf("[MIDTRANS WEBHOOK] Payment not found for order %s: %v", orderID, err)
		return fmt.Errorf("payment not found for order %s: %w", orderID, err)
	}

	previousStatus := payment.Status

	switch txStatus.TransactionStatus {
	case "capture", "settlement":
		payment.Status = domain.PaymentStatusPaid
	case "deny", "cancel":
		payment.Status = domain.PaymentStatusFailed
	case "expire":
		log.Printf("[MIDTRANS WEBHOOK] Deleting expired payment %d (Order ID: %s)", payment.ID, orderID)
		return uc.PaymentRepo.Delete(payment.ID)
	case "pending":
		// Stay PENDING
	default:
		log.Printf("[MIDTRANS WEBHOOK] Unknown transaction status '%s' for order %s", txStatus.TransactionStatus, orderID)
	}

	payment.PaymentType = txStatus.PaymentType
	payment.MidtransID = txStatus.TransactionID
	if payment.Status == domain.PaymentStatusPaid {
		now := time.Now()
		payment.PaidAt = &now
	}

	if err := uc.PaymentRepo.Update(payment); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	if payment.Status == domain.PaymentStatusPaid && previousStatus != domain.PaymentStatusPaid {
		_ = uc.updateLinkedInvoices(payment.ID)

		if payment.SubmissionID != nil {
			// Delegate to WorkflowUC
			_ = uc.WorkflowUC.HandlePaymentSuccess(*payment.SubmissionID, payment.Amount)
		}
	}

	return nil
}

// SyncPaymentStatus manually queries Midtrans API to update the local payment status.
func (uc *paymentUsecase) SyncPaymentStatus(paymentID int64) error {
	payment, err := uc.PaymentRepo.FindByID(paymentID)
	if err != nil {
		return err
	}

	if payment.Status == domain.PaymentStatusPaid {
		return nil
	}

	txStatus, err := uc.Midtrans.CheckTransactionStatus(payment.ExternalID)
	if err != nil {
		return err
	}

	previousStatus := payment.Status
	
	switch txStatus.TransactionStatus {
	case "capture", "settlement":
		payment.Status = domain.PaymentStatusPaid
	case "deny", "cancel":
		payment.Status = domain.PaymentStatusFailed
	case "expire":
		return uc.PaymentRepo.Delete(payment.ID)
	}

	if payment.Status == domain.PaymentStatusPaid {
		now := time.Now()
		payment.PaidAt = &now
		payment.PaymentType = txStatus.PaymentType
		payment.MidtransID = txStatus.TransactionID
		
		if err := uc.PaymentRepo.Update(payment); err != nil {
			return err
		}

		if previousStatus != domain.PaymentStatusPaid {
			_ = uc.updateLinkedInvoices(payment.ID)

			if payment.SubmissionID != nil {
				// Delegate to WorkflowUC
				_ = uc.WorkflowUC.HandlePaymentSuccess(*payment.SubmissionID, payment.Amount)
			}
		}
	}
	return nil
}
