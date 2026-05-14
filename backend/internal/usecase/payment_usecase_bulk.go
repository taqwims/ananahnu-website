package usecase

import (
	"ananahnu/internal/domain"
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

	// Create Payment record
	payment := &domain.Payment{
		Amount:     totalAmount,
		Method:     domain.PaymentMethodMidtrans,
		Status:     domain.PaymentStatusPending,
		ExternalID: fmt.Sprintf("BULK-%d", time.Now().UnixNano()),
	}

	// Midtrans request
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
		uc.InvoiceRepo.Update(&inv)
	}

	return payment, nil
}
