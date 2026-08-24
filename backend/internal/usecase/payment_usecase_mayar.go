package usecase

import (
	"ananahnu/internal/domain"
	mayarPkg "ananahnu/pkg/mayar"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// getMayarConfig retrieves dynamic API key and environment mode from SystemSetting
func (uc *paymentUsecase) getMayarConfig() (string, *bool) {
	var apiKey string
	var isProd *bool

	if uc.SettingRepo != nil {
		settingKey, err := uc.SettingRepo.GetSetting("MAYAR_API_KEY")
		if err == nil && settingKey != nil && strings.TrimSpace(settingKey.Value) != "" {
			apiKey = strings.TrimSpace(settingKey.Value)
		}
		settingProd, err := uc.SettingRepo.GetSetting("MAYAR_IS_PRODUCTION")
		if err == nil && settingProd != nil && strings.TrimSpace(settingProd.Value) != "" {
			val, parseErr := strconv.ParseBool(strings.TrimSpace(settingProd.Value))
			if parseErr == nil {
				isProd = &val
			}
		}
	}

	return apiKey, isProd
}

// CreateMayarPayment initiates a payment invoice with Mayar.id and stores the payment record.
func (uc *paymentUsecase) CreateMayarPayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*MayarPaymentResult, error) {
	if uc.Mayar == nil {
		return nil, errors.New("mayar gateway is not initialized")
	}

	apiKey, isProd := uc.getMayarConfig()

	// Generate unique order ID
	orderID := fmt.Sprintf("ANN-MYR-%s-%d", submissionID.String()[:8], time.Now().Unix())

	var redirectURL string
	if uc.SettingRepo != nil {
		settingURL, err := uc.SettingRepo.GetSetting("MAYAR_REDIRECT_URL")
		if err == nil && settingURL != nil && strings.TrimSpace(settingURL.Value) != "" {
			redirectURL = strings.TrimSpace(settingURL.Value)
		}
	}

	req := mayarPkg.MayarInvoiceRequest{
		Name:        customerName,
		Email:       email,
		Mobile:      phone,
		RedirectURL: redirectURL,
		Description: fmt.Sprintf("Pembayaran Sertifikasi Halal (%s)", orderID),
		Items: []mayarPkg.MayarItem{
			{
				Quantity:    1,
				Rate:        int64(amount),
				Description: "Sertifikasi Halal Ana Nahnu",
			},
		},
		ExtraData: map[string]string{
			"orderId":      orderID,
			"submissionId": submissionID.String(),
		},
	}

	res, err := uc.Mayar.CreateInvoice(req, apiKey, isProd)
	if err != nil {
		log.Printf("[MAYAR] Failed to create invoice for order %s: %v", orderID, err)
		return nil, fmt.Errorf("failed to create mayar invoice: %w", err)
	}

	payment := &domain.Payment{
		SubmissionID: &submissionID,
		Amount:       amount,
		Method:       domain.PaymentMethodMayar,
		Status:       domain.PaymentStatusPending,
		ExternalID:   orderID,
		SnapToken:    res.ID,
		SnapURL:      res.Link,
		MidtransID:   res.TransactionID,
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

	uc.logPaymentActivity(submissionID, "PAYMENT_INITIATED", fmt.Sprintf("Pembayaran Mayar.id dimulai: Rp %.2f (Order ID: %s, Invoice ID: %s)", amount, orderID, res.ID))

	return &MayarPaymentResult{
		InvoiceID:     res.ID,
		TransactionID: res.TransactionID,
		PaymentURL:    res.Link,
		OrderID:       orderID,
	}, nil
}

// HandleMayarNotification processes incoming Mayar.id webhook callbacks.
func (uc *paymentUsecase) HandleMayarNotification(payload map[string]interface{}) error {
	log.Printf("[MAYAR WEBHOOK] Received payload: %v", payload)

	var invoiceID, transactionID, status, orderID, paymentMethod string

	// Parse event and data wrapper if present
	if data, ok := payload["data"].(map[string]interface{}); ok {
		invoiceID, _ = data["id"].(string)
		transactionID, _ = data["transactionId"].(string)
		status, _ = data["status"].(string)
		paymentMethod, _ = data["paymentMethod"].(string)

		if extraData, ok := data["extraData"].(map[string]interface{}); ok {
			orderID, _ = extraData["orderId"].(string)
		}
	}

	// Fallback to top-level fields
	if invoiceID == "" {
		invoiceID, _ = payload["id"].(string)
	}
	if transactionID == "" {
		transactionID, _ = payload["transactionId"].(string)
	}
	if status == "" {
		status, _ = payload["status"].(string)
	}
	if status == "" {
		if event, ok := payload["event"].(string); ok {
			if strings.EqualFold(event, "payment.received") || strings.EqualFold(event, "invoice.paid") {
				status = "PAID"
			}
		}
	}
	if orderID == "" {
		if extraData, ok := payload["extraData"].(map[string]interface{}); ok {
			orderID, _ = extraData["orderId"].(string)
		}
	}

	// Locate payment by Order ID, or Invoice ID (SnapToken), or ExternalID
	var payment *domain.Payment

	if orderID != "" {
		payment, _ = uc.PaymentRepo.FindByExternalID(orderID)
	}
	if payment == nil && invoiceID != "" {
		// Search by external ID as well
		payment, _ = uc.PaymentRepo.FindByExternalID(invoiceID)
	}

	if payment == nil {
		// Fallback query pending Mayar payments to match SnapToken
		payments, _, fErr := uc.PaymentRepo.FindAll(map[string]interface{}{
			"method": domain.PaymentMethodMayar,
			"status": domain.PaymentStatusPending,
		}, 1, 50)
		if fErr == nil {
			for _, p := range payments {
				if (invoiceID != "" && p.SnapToken == invoiceID) || (transactionID != "" && p.MidtransID == transactionID) {
					pCopy := p
					payment = &pCopy
					break
				}
			}
		}
	}

	if payment == nil {
		log.Printf("[MAYAR WEBHOOK] Payment not found for invoice %s / order %s", invoiceID, orderID)
		return fmt.Errorf("payment not found for mayar order %s", orderID)
	}

	previousStatus := payment.Status
	normalizedStatus := strings.ToUpper(strings.TrimSpace(status))

	switch normalizedStatus {
	case "PAID", "SUCCESS", "SETTLED", "COMPLETED", "SETTLEMENT":
		payment.Status = domain.PaymentStatusPaid
		now := time.Now()
		payment.PaidAt = &now
	case "FAILED", "CANCELLED", "DENY":
		payment.Status = domain.PaymentStatusFailed
	case "EXPIRED":
		log.Printf("[MAYAR WEBHOOK] Deleting expired Mayar payment %d (Order ID: %s)", payment.ID, payment.ExternalID)
		return uc.PaymentRepo.Delete(payment.ID)
	default:
		log.Printf("[MAYAR WEBHOOK] Unhandled Mayar transaction status '%s' for payment %d", status, payment.ID)
	}

	if paymentMethod != "" {
		payment.PaymentType = paymentMethod
	} else if payment.PaymentType == "" {
		payment.PaymentType = "mayar"
	}
	if transactionID != "" {
		payment.MidtransID = transactionID
	}

	if err := uc.PaymentRepo.Update(payment); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	if payment.Status == domain.PaymentStatusPaid && previousStatus != domain.PaymentStatusPaid {
		_ = uc.updateLinkedInvoices(payment.ID)

		if payment.SubmissionID != nil {
			_ = uc.WorkflowUC.HandlePaymentSuccess(*payment.SubmissionID, payment.Amount)
		}
	}

	return nil
}
