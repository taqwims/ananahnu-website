package usecase

import (
	"ananahnu/internal/domain"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type BillingUsecase interface {
	// Invoice
	GetMyInvoices(userID uuid.UUID, roleName string, status string, page, limit int) ([]domain.Invoice, int64, error)
	GetInvoiceBySubmission(submissionID uuid.UUID) (*domain.Invoice, error)
	CreateInvoiceForSubmission(submissionID uuid.UUID, serviceType string, regencyID *int64, districtID *int64) error
	MarkInvoicePaid(invoiceID int64) error
	RemindPayment(invoiceID int64, senderID uuid.UUID) error

	// Commissions
	GetReferralCommissions(page, limit int, status string) ([]domain.Commission, int64, error)
	PayReferralCommission(id uuid.UUID) error

	// Payment Config
	GetPaymentConfigs() ([]domain.PaymentConfig, error)
	GetPaymentConfigsByService(serviceType string) ([]domain.PaymentConfig, error)
	CreatePaymentConfig(config *domain.PaymentConfig) error
	UpdatePaymentConfig(config *domain.PaymentConfig) error
	DeletePaymentConfig(id int64) error
}

type BillingUsecaseDeps struct {
	InvoiceRepo       domain.InvoiceRepository
	ConfigRepo        domain.PaymentConfigRepository
	RateRepo          domain.BillingRateRepository
	UserRepo          domain.UserRepository
	NotifUC           NotificationUsecase
	CommissionRepo    domain.CommissionRepository
	SettingRepo       domain.SystemSettingRepository
	SubmissionRepo    domain.SubmissionRepository
	BillingConfigRepo domain.BillingConfigRepository
}

type billingUsecase struct {
	BillingUsecaseDeps
}

func NewBillingUsecase(deps BillingUsecaseDeps) BillingUsecase {
	return &billingUsecase{
		BillingUsecaseDeps: deps,
	}
}

func (uc *billingUsecase) GetMyInvoices(userID uuid.UUID, roleName string, status string, page, limit int) ([]domain.Invoice, int64, error) {
	filter := map[string]interface{}{}
	
	if status != "" {
		filter["status"] = status
	}

	if roleName == "HALAL_MANAGER" {
		// Get team members
		team, err := uc.UserRepo.FindByLeaderID(userID)
		if err == nil {
			ids := []uuid.UUID{userID}
			for _, member := range team {
				ids = append(ids, member.ID)
			}
			filter["payer_id"] = ids // GORM handles slices as IN clause
		} else {
			filter["payer_id"] = userID
		}
	} else {
		filter["payer_id"] = userID
	}

	return uc.InvoiceRepo.FindAll(filter, page, limit)
}

func (uc *billingUsecase) GetInvoices(filter map[string]interface{}, page, limit int) ([]domain.Invoice, int64, error) {
	return uc.InvoiceRepo.FindAll(filter, page, limit)
}

func (uc *billingUsecase) GetInvoiceBySubmission(submissionID uuid.UUID) (*domain.Invoice, error) {
	return uc.InvoiceRepo.FindBySubmissionID(submissionID)
}

// CreateInvoiceForSubmission generates an invoice when a submission reaches SH_TERBIT.
func (uc *billingUsecase) CreateInvoiceForSubmission(submissionID uuid.UUID, serviceType string, regencyID *int64, districtID *int64) error {
	// Check if invoice already exists
	if existing, _ := uc.InvoiceRepo.FindBySubmissionID(submissionID); existing != nil {
		return nil // Already created, idempotent
	}

	var amount float64

	// Try geography-based billing rate first
	if regencyID != nil {
		rate, err := uc.RateRepo.FindByFilter(serviceType, *regencyID, districtID)
		if err == nil {
			amount = rate.Amount
		}
	}

	// If no geography rate found, sum payment config items
	if amount == 0 {
		configs, err := uc.ConfigRepo.FindByServiceType(serviceType)
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

	return uc.InvoiceRepo.Create(invoice)
}

func (uc *billingUsecase) MarkInvoicePaid(invoiceID int64) error {
	invoices, _, err := uc.InvoiceRepo.FindAll(map[string]interface{}{"id": invoiceID}, 1, 1)
	if err != nil || len(invoices) == 0 {
		return fmt.Errorf("invoice not found")
	}

	invoice := &invoices[0]
	invoice.Status = domain.InvoiceStatusPaid
	now := time.Now()
	invoice.PaidAt = &now

	if err := uc.InvoiceRepo.Update(invoice); err != nil {
		return err
	}

	// Calculate base omset from submission cost detail (Pendampingan component)
	var pendampinganAmount float64
	if costDetail, err := uc.BillingConfigRepo.GetSubmissionCostDetail(invoice.SubmissionID); err == nil && costDetail != nil {
		var breakdown []map[string]interface{}
		if err := json.Unmarshal([]byte(costDetail.CostBreakdownData), &breakdown); err == nil {
			for _, item := range breakdown {
				if cat, ok := item["category"].(string); ok && cat == "PENDAMPINGAN" {
					if amt, ok := item["total"].(float64); ok {
						pendampinganAmount += amt
					}
				}
			}
		}
	}

	period := time.Now().Format("2006-01") // YYYY-MM

	// Structural Commissions based on Pendampingan Omset
	if pendampinganAmount > 0 {
		submission, _ := uc.SubmissionRepo.FindByID(invoice.SubmissionID)
		if submission != nil && submission.ConsultantID != nil {
			// 1. Komisi Direct Sales (25%)
			_ = uc.CommissionRepo.UpsertStructural(&domain.Commission{
				ID:        uuid.New(),
				Type:      domain.CommissionTypeDirectSales,
				UserID:    submission.ConsultantID,
				Period:    period,
				BaseOmset: pendampinganAmount,
				Amount:    pendampinganAmount * 0.25,
				Status:    domain.CommissionStatusPending,
			})

			// 2. Hierarchical Commissions (Upline Traversal)
			consultant, _ := uc.UserRepo.FindByID(*submission.ConsultantID)
			if consultant != nil && consultant.LeaderID != nil {
				currentNodeID := consultant.LeaderID
				foundManager := false

				for currentNodeID != nil {
					nodeUser, _ := uc.UserRepo.FindByID(*currentNodeID)
					if nodeUser == nil {
						break
					}

					roleName := nodeUser.Role.Name

					if roleName == "HALAL_ADVISOR" {
						// Upline Advisor gets 1%
						_ = uc.CommissionRepo.UpsertStructural(&domain.Commission{
							ID:        uuid.New(),
							Type:      domain.CommissionTypeStructural,
							UserID:    &nodeUser.ID,
							Period:    period,
							BaseOmset: pendampinganAmount,
							Amount:    pendampinganAmount * 0.01,
							Status:    domain.CommissionStatusPending,
						})
					} else if roleName == "HALAL_MANAGER" {
						if !foundManager {
							// First Manager in line gets 5%
							_ = uc.CommissionRepo.UpsertStructural(&domain.Commission{
								ID:        uuid.New(),
								Type:      domain.CommissionTypeStructural,
								UserID:    &nodeUser.ID,
								Period:    period,
								BaseOmset: pendampinganAmount,
								Amount:    pendampinganAmount * 0.05,
								Status:    domain.CommissionStatusPending,
							})
							foundManager = true
						} else {
							// Second Manager in line (Senior Manager) gets 1%
							_ = uc.CommissionRepo.UpsertStructural(&domain.Commission{
								ID:        uuid.New(),
								Type:      domain.CommissionTypeStructural,
								UserID:    &nodeUser.ID,
								Period:    period,
								BaseOmset: pendampinganAmount,
								Amount:    pendampinganAmount * 0.01,
								Status:    domain.CommissionStatusPending,
							})
						}
					} else if roleName == "HALAL_DIRECTOR" {
						// Director gets 2.5%, and stops traversal
						_ = uc.CommissionRepo.UpsertStructural(&domain.Commission{
							ID:        uuid.New(),
							Type:      domain.CommissionTypeStructural,
							UserID:    &nodeUser.ID,
							Period:    period,
							BaseOmset: pendampinganAmount,
							Amount:    pendampinganAmount * 0.025,
							Status:    domain.CommissionStatusPending,
						})
						break // Stop traversing up after finding a director
					}

					currentNodeID = nodeUser.LeaderID
				}
			}
		}
	}

	return nil
}

func (uc *billingUsecase) GetReferralCommissions(page, limit int, status string) ([]domain.Commission, int64, error) {
	filter := map[string]interface{}{}
	if status != "" {
		filter["status"] = status
	}
	return uc.CommissionRepo.FindAll(filter, page, limit)
}

func (uc *billingUsecase) PayReferralCommission(id uuid.UUID) error {
	now := time.Now()
	return uc.CommissionRepo.UpdateStatus(id, domain.CommissionStatusPaid, &now)
}

func (uc *billingUsecase) RemindPayment(invoiceID int64, senderID uuid.UUID) error {
	invoices, _, err := uc.InvoiceRepo.FindAll(map[string]interface{}{"id": invoiceID}, 1, 1)
	if err != nil || len(invoices) == 0 {
		return fmt.Errorf("invoice not found")
	}

	invoice := &invoices[0]
	if invoice.Status == domain.InvoiceStatusPaid {
		return fmt.Errorf("invoice already paid")
	}

	if invoice.PayerID == nil {
		return fmt.Errorf("invoice has no payer")
	}

	sender, _ := uc.UserRepo.FindByID(senderID)
	senderName := "Halal Manager"
	if sender != nil {
		senderName = sender.FullName
	}

	msg := fmt.Sprintf("%s mengingatkan Anda untuk membayar tagihan SH Terbit untuk %s sebesar Rp %.0f", 
		senderName, invoice.Submission.Client.BusinessName, invoice.Amount)
	
	return uc.NotifUC.CreateNotification(*invoice.PayerID, "Pengingat Pembayaran", msg, invoice.SubmissionID)
}

// Payment Config CRUD
func (uc *billingUsecase) GetPaymentConfigs() ([]domain.PaymentConfig, error) {
	return uc.ConfigRepo.FindAll()
}

func (uc *billingUsecase) GetPaymentConfigsByService(serviceType string) ([]domain.PaymentConfig, error) {
	return uc.ConfigRepo.FindByServiceType(serviceType)
}

func (uc *billingUsecase) CreatePaymentConfig(config *domain.PaymentConfig) error {
	return uc.ConfigRepo.Create(config)
}

func (uc *billingUsecase) UpdatePaymentConfig(config *domain.PaymentConfig) error {
	return uc.ConfigRepo.Update(config)
}

func (uc *billingUsecase) DeletePaymentConfig(id int64) error {
	return uc.ConfigRepo.Delete(id)
}
