package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- InvoiceRepository ---

type invoiceRepository struct {
	db *gorm.DB
}

func NewInvoiceRepository(db *gorm.DB) domain.InvoiceRepository {
	return &invoiceRepository{db: db}
}

func (r *invoiceRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.Invoice, int64, error) {
	var invoices []domain.Invoice
	var count int64

	query := r.db.Model(&domain.Invoice{}).Preload("Payer").Preload("Submission.Client")
	if len(filter) > 0 {
		query = query.Where(filter)
	}

	if err := query.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && limit > 0 {
		query = query.Offset((page - 1) * limit).Limit(limit)
	}

	if err := query.Order("created_at DESC").Find(&invoices).Error; err != nil {
		return nil, 0, err
	}

	return invoices, count, nil
}

func (r *invoiceRepository) FindBySubmissionID(submissionID uuid.UUID) (*domain.Invoice, error) {
	var invoice domain.Invoice
	if err := r.db.Where("submission_id = ?", submissionID).First(&invoice).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

func (r *invoiceRepository) FindByIDs(ids []int64) ([]domain.Invoice, error) {
	var invoices []domain.Invoice
	if err := r.db.Preload("Payer").Preload("Submission.Client").Where("id IN ?", ids).Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *invoiceRepository) Create(invoice *domain.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *invoiceRepository) Update(invoice *domain.Invoice) error {
	return r.db.Save(invoice).Error
}

// --- PaymentConfigRepository ---

type paymentConfigRepository struct {
	db *gorm.DB
}

func NewPaymentConfigRepository(db *gorm.DB) domain.PaymentConfigRepository {
	return &paymentConfigRepository{db: db}
}

func (r *paymentConfigRepository) FindByServiceType(serviceType string) ([]domain.PaymentConfig, error) {
	var configs []domain.PaymentConfig
	if err := r.db.Where("service_type = ? AND is_active = ?", serviceType, true).Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *paymentConfigRepository) FindAll() ([]domain.PaymentConfig, error) {
	var configs []domain.PaymentConfig
	if err := r.db.Order("service_type ASC, item_name ASC").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *paymentConfigRepository) Create(config *domain.PaymentConfig) error {
	return r.db.Create(config).Error
}

func (r *paymentConfigRepository) Update(config *domain.PaymentConfig) error {
	return r.db.Save(config).Error
}

func (r *paymentConfigRepository) Delete(id int64) error {
	return r.db.Delete(&domain.PaymentConfig{}, id).Error
}

// --- CoordinatorRateRepository ---

type coordinatorRateRepository struct {
	db *gorm.DB
}

func NewCoordinatorRateRepository(db *gorm.DB) domain.CoordinatorRateRepository {
	return &coordinatorRateRepository{db: db}
}

func (r *coordinatorRateRepository) FindByCoordinatorID(coordinatorID uuid.UUID) (*domain.CoordinatorRate, error) {
	var rate domain.CoordinatorRate
	if err := r.db.Where("coordinator_id = ?", coordinatorID).First(&rate).Error; err != nil {
		return nil, err
	}
	return &rate, nil
}

func (r *coordinatorRateRepository) FindAll() ([]domain.CoordinatorRate, error) {
	var rates []domain.CoordinatorRate
	if err := r.db.Preload("Coordinator").Find(&rates).Error; err != nil {
		return nil, err
	}
	return rates, nil
}

func (r *coordinatorRateRepository) Save(rate *domain.CoordinatorRate) error {
	return r.db.Save(rate).Error
}
