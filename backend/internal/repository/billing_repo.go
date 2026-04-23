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

	query := r.db.Model(&domain.Invoice{}).Preload("Submission.Client")
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
