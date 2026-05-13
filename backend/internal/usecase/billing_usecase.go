package usecase

import (
	"ananahnu/internal/domain"
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

	// Referral Commissions
	GetReferralCommissions(page, limit int, status string) ([]domain.ReferralCommission, int64, error)
	PayReferralCommission(id uuid.UUID) error


	// Payment Config
	GetPaymentConfigs() ([]domain.PaymentConfig, error)
	GetPaymentConfigsByService(serviceType string) ([]domain.PaymentConfig, error)
	CreatePaymentConfig(config *domain.PaymentConfig) error
	UpdatePaymentConfig(config *domain.PaymentConfig) error
	DeletePaymentConfig(id int64) error
}

type billingUsecase struct {
	invoiceRepo    domain.InvoiceRepository
	configRepo     domain.PaymentConfigRepository
	rateRepo       domain.BillingRateRepository
	userRepo       domain.UserRepository
	notifUC        NotificationUsecase
	commissionRepo domain.ReferralCommissionRepository
	settingRepo    domain.SystemSettingRepository
	submissionRepo domain.SubmissionRepository
}

func NewBillingUsecase(i domain.InvoiceRepository, c domain.PaymentConfigRepository, r domain.BillingRateRepository, u domain.UserRepository, n NotificationUsecase, com domain.ReferralCommissionRepository, s domain.SystemSettingRepository, sub domain.SubmissionRepository) BillingUsecase {
	return &billingUsecase{
		invoiceRepo:    i,
		configRepo:     c,
		rateRepo:       r,
		userRepo:       u,
		notifUC:        n,
		commissionRepo: com,
		settingRepo:    s,
		submissionRepo: sub,
	}
}

func (uc *billingUsecase) GetMyInvoices(userID uuid.UUID, roleName string, status string, page, limit int) ([]domain.Invoice, int64, error) {
	filter := map[string]interface{}{}
	
	if status != "" {
		filter["status"] = status
	}

	if roleName == "KOORDINATOR" {
		// Get team members
		team, err := uc.userRepo.FindByLeaderID(userID)
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

	return uc.invoiceRepo.FindAll(filter, page, limit)
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
	invoices, _, err := uc.invoiceRepo.FindAll(map[string]interface{}{"id": invoiceID}, 1, 1)
	if err != nil || len(invoices) == 0 {
		return fmt.Errorf("invoice not found")
	}

	invoice := &invoices[0]
	invoice.Status = domain.InvoiceStatusPaid
	now := time.Now()
	invoice.PaidAt = &now

	if err := uc.invoiceRepo.Update(invoice); err != nil {
		return err
	}

	// Trigger Referral Fee check
	// We need to reload invoice to get submission details if not preloaded
	sub, err := uc.submissionRepo.FindByID(invoice.SubmissionID)
	if err == nil && sub != nil && sub.Status == domain.StatusSHTerbit {
		// Get the user who is the "referred" one.
		// Usually the ConsultantID or the person who created the client.
		// Let's check ConsultantID first.
		var referredID uuid.UUID
		if sub.ConsultantID != nil {
			referredID = *sub.ConsultantID
		}

		if referredID != uuid.Nil {
			user, _ := uc.userRepo.FindByID(referredID)
			if user != nil && user.ReferredByID != nil {
				// This user was referred! Create a commission for the referrer.
				
				// Get Fee from settings
				feeStr := "0"
				setting, _ := uc.settingRepo.GetSetting("REFERRAL_FEE_PER_SH")
				if setting != nil {
					feeStr = setting.Value
				}
				
				var feeAmount float64
				fmt.Sscanf(feeStr, "%f", &feeAmount)

				if feeAmount > 0 {
					commission := &domain.ReferralCommission{
						ID:           uuid.New(),
						ReferrerID:   *user.ReferredByID,
						ReferredID:   user.ID,
						SubmissionID: sub.ID,
						Amount:       feeAmount,
						Status:       domain.CommissionStatusPending,
						CreatedAt:    time.Now(),
					}
					_ = uc.commissionRepo.Create(commission)
				}
			}
		}
	}

	return nil
}

func (uc *billingUsecase) GetReferralCommissions(page, limit int, status string) ([]domain.ReferralCommission, int64, error) {
	filter := map[string]interface{}{}
	if status != "" {
		filter["status"] = status
	}
	return uc.commissionRepo.FindAll(filter, page, limit)
}

func (uc *billingUsecase) PayReferralCommission(id uuid.UUID) error {
	now := time.Now()
	return uc.commissionRepo.UpdateStatus(id, domain.CommissionStatusPaid, &now)
}


func (uc *billingUsecase) RemindPayment(invoiceID int64, senderID uuid.UUID) error {
	invoices, _, err := uc.invoiceRepo.FindAll(map[string]interface{}{"id": invoiceID}, 1, 1)
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

	sender, _ := uc.userRepo.FindByID(senderID)
	senderName := "Koordinator"
	if sender != nil {
		senderName = sender.FullName
	}

	msg := fmt.Sprintf("%s mengingatkan Anda untuk membayar tagihan SH Terbit untuk %s sebesar Rp %.0f", 
		senderName, invoice.Submission.Client.BusinessName, invoice.Amount)
	
	return uc.notifUC.CreateNotification(*invoice.PayerID, "Pengingat Pembayaran", msg, invoice.SubmissionID)
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
