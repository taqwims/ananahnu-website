package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type consultantProfileRepository struct {
	db *gorm.DB
}

func NewConsultantProfileRepository(db *gorm.DB) domain.ConsultantProfileRepository {
	return &consultantProfileRepository{db: db}
}

func (r *consultantProfileRepository) FindByUserID(userID uuid.UUID) (*domain.ConsultantProfile, error) {
	var profile domain.ConsultantProfile
	if err := r.db.Preload("User").Where("user_id = ?", userID).First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *consultantProfileRepository) FindAll() ([]domain.ConsultantProfile, error) {
	var profiles []domain.ConsultantProfile
	if err := r.db.Preload("User").Order("created_at DESC").Find(&profiles).Error; err != nil {
		return nil, err
	}
	return profiles, nil
}

func (r *consultantProfileRepository) Create(profile *domain.ConsultantProfile) error {
	return r.db.Create(profile).Error
}

func (r *consultantProfileRepository) Update(profile *domain.ConsultantProfile) error {
	return r.db.Save(profile).Error
}
