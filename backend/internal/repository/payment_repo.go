package repository

import (
	"ananahnu/internal/domain"

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

func (r *paymentRepository) Update(payment *domain.Payment) error {
	return r.db.Save(payment).Error
}
