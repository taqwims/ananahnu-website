package usecase

import (
	"ananahnu/internal/domain"
	mayarPkg "ananahnu/pkg/mayar"
	midtransPkg "ananahnu/pkg/midtrans"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

func (uc *paymentUsecase) InitiateBulkPayment(invoiceIDs []int64, payerID uuid.UUID) (*domain.Payment, error) {
	invoices, err := uc.InvoiceRepo.FindByIDs(invoiceIDs)
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

	activeGW := uc.GetActivePaymentGateway()

	if activeGW == "MAYAR" && uc.Mayar != nil {
		orderID := fmt.Sprintf("BULK-MYR-%d", time.Now().UnixNano())
		apiKey, isProd := uc.getMayarConfig()

		mayarReq := mayarPkg.MayarInvoiceRequest{
			Name:        "Coordinator / Tim Ana Nahnu",
			Email:       "keuangan@ananahnu.id",
			Mobile:      "08123456789",
			Description: fmt.Sprintf("Pembayaran Kolektif %d Tagihan Self Declare (%s)", len(invoices), orderID),
			Items: []mayarPkg.MayarItem{
				{
					Quantity:    1,
					Rate:        int64(totalAmount),
					Description: fmt.Sprintf("Tagihan Kolektif %d SH", len(invoices)),
				},
			},
			ExtraData: map[string]string{
				"orderId": orderID,
			},
		}

		mayarRes, err := uc.Mayar.CreateInvoice(mayarReq, apiKey, isProd)
		if err != nil {
			return nil, fmt.Errorf("failed to create bulk mayar invoice: %w", err)
		}

		payment := &domain.Payment{
			Amount:     totalAmount,
			Method:     domain.PaymentMethodMayar,
			Status:     domain.PaymentStatusPending,
			ExternalID: orderID,
			SnapToken:  mayarRes.ID,
			SnapURL:    mayarRes.Link,
			MidtransID: mayarRes.TransactionID,
		}

		if err := uc.PaymentRepo.Create(payment); err != nil {
			return nil, err
		}

		for _, inv := range invoices {
			inv.PaymentID = &payment.ID
			if err := uc.InvoiceRepo.Update(&inv); err != nil {
				return nil, err
			}
		}

		return payment, nil
	}

	// Default Midtrans request
	payment := &domain.Payment{
		Amount:     totalAmount,
		Method:     domain.PaymentMethodMidtrans,
		Status:     domain.PaymentStatusPending,
		ExternalID: fmt.Sprintf("BULK-%d", time.Now().UnixNano()),
	}

	midtransRes, err := uc.Midtrans.CreateSnapTransaction(payment.ExternalID, int64(totalAmount), midtransPkg.CustomerDetail{
		FirstName: "Coordinator",
		Email:     "coordinator@ananahnu.com",
	}, nil)
	if err != nil {
		return nil, err
	}

	payment.SnapToken = midtransRes.Token
	payment.SnapURL = midtransRes.RedirectURL

	if err := uc.PaymentRepo.Create(payment); err != nil {
		return nil, err
	}

	// Link Invoices to this Payment
	for _, inv := range invoices {
		inv.PaymentID = &payment.ID
		if err := uc.InvoiceRepo.Update(&inv); err != nil {
			return nil, err
		}
	}

	return payment, nil
}
