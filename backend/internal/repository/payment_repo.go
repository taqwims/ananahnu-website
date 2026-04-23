package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) domain.PaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) Create(payment *domain.Payment) error {
	return r.db.Create(payment).Error
}

func (r *paymentRepository) FindByExternalID(externalID string) (*domain.Payment, error) {
	var p domain.Payment
	if err := r.db.First(&p, "external_id = ?", externalID).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *paymentRepository) FindByID(id int64) (*domain.Payment, error) {
	var p domain.Payment
	if err := r.db.First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *paymentRepository) FindBySubmissionID(submissionID uuid.UUID) ([]domain.Payment, error) {
	var payments []domain.Payment
	if err := r.db.Where("submission_id = ?", submissionID).Order("created_at DESC").Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

func (r *paymentRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error) {
	var payments []domain.Payment
	var count int64

	query := r.db.Model(&domain.Payment{})
	if len(filter) > 0 {
		query = query.Where(filter)
	}

	if err := query.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && limit > 0 {
		query = query.Offset((page - 1) * limit).Limit(limit)
	}

	if err := query.Order("created_at DESC").Find(&payments).Error; err != nil {
		return nil, 0, err
	}

	return payments, count, nil
}

func (r *paymentRepository) Update(payment *domain.Payment) error {
	return r.db.Save(payment).Error
}

