package usecase

import (
	"ananahnu/internal/domain"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type BillingUsecase interface {
	// Invoice
	GetInvoices(filter map[string]interface{}, page, limit int) ([]domain.Invoice, int64, error)
	GetInvoiceBySubmission(submissionID uuid.UUID) (*domain.Invoice, error)
	CreateInvoiceForSubmission(submissionID uuid.UUID, serviceType string, regencyID *int64, districtID *int64) error
	MarkInvoicePaid(invoiceID int64) error

	// Payment Config
	GetPaymentConfigs() ([]domain.PaymentConfig, error)
	GetPaymentConfigsByService(serviceType string) ([]domain.PaymentConfig, error)
	CreatePaymentConfig(config *domain.PaymentConfig) error
	UpdatePaymentConfig(config *domain.PaymentConfig) error
	DeletePaymentConfig(id int64) error
}

type billingUsecase struct {
	invoiceRepo domain.InvoiceRepository
	configRepo  domain.PaymentConfigRepository
	rateRepo    domain.BillingRateRepository
}

func NewBillingUsecase(i domain.InvoiceRepository, c domain.PaymentConfigRepository, r domain.BillingRateRepository) BillingUsecase {
	return &billingUsecase{invoiceRepo: i, configRepo: c, rateRepo: r}
}

func (uc *billingUsecase) GetInvoices(filter map[string]interface{}, page, limit int) ([]domain.Invoice, int64, error) {
	return uc.invoiceRepo.FindAll(filter, page, limit)
}

func (uc *billingUsecase) GetInvoiceBySubmission(submissionID uuid.UUID) (*domain.Invoice, error) {
	return uc.invoiceRepo.FindBySubmissionID(submissionID)
}

// CreateInvoiceForSubmission generates an invoice when a submission reaches SH_TERBIT.
// It calculates the amount based on geography billing rates.
func (uc *billingUsecase) CreateInvoiceForSubmission(submissionID uuid.UUID, serviceType string, regencyID *int64, districtID *int64) error {
	// Check if invoice already exists
	if existing, _ := uc.invoiceRepo.FindBySubmissionID(submissionID); existing != nil {
		return nil // Already created, idempotent
	}

	var amount float64

	// Try geography-based billing rate first
	if regencyID != nil {
		rate, err := uc.rateRepo.FindByFilter(serviceType, *regencyID, districtID)
		if err == nil {
			amount = rate.Amount
		}
	}

	// If no geography rate found, sum payment config items
	if amount == 0 {
		configs, err := uc.configRepo.FindByServiceType(serviceType)
		if err != nil {
			return fmt.Errorf("failed to get payment config: %w", err)
		}
		for _, c := range configs {
			amount += c.Amount
		}
	}

	invoice := &domain.Invoice{
		SubmissionID: submissionID,
		ServiceType:  serviceType,
		Amount:       amount,
		Status:       domain.InvoiceStatusUnpaid,
		RegencyID:    regencyID,
		DistrictID:   districtID,
	}

	return uc.invoiceRepo.Create(invoice)
}

func (uc *billingUsecase) MarkInvoicePaid(invoiceID int64) error {
	invoices, _, err := uc.invoiceRepo.FindAll(map[string]interface{}{"id": invoiceID}, 0, 0)
	if err != nil || len(invoices) == 0 {
		return fmt.Errorf("invoice not found")
	}

	invoice := &invoices[0]
	invoice.Status = domain.InvoiceStatusPaid
	now := time.Now()
	invoice.PaidAt = &now

	return uc.invoiceRepo.Update(invoice)
}

// Payment Config CRUD
func (uc *billingUsecase) GetPaymentConfigs() ([]domain.PaymentConfig, error) {
	return uc.configRepo.FindAll()
}

func (uc *billingUsecase) GetPaymentConfigsByService(serviceType string) ([]domain.PaymentConfig, error) {
	return uc.configRepo.FindByServiceType(serviceType)
}

func (uc *billingUsecase) CreatePaymentConfig(config *domain.PaymentConfig) error {
	return uc.configRepo.Create(config)
}

func (uc *billingUsecase) UpdatePaymentConfig(config *domain.PaymentConfig) error {
	return uc.configRepo.Update(config)
}

func (uc *billingUsecase) DeletePaymentConfig(id int64) error {
	return uc.configRepo.Delete(id)
}
