package repository

import (
	"errors"

	"ananahnu/internal/domain"
	"gorm.io/gorm"
)

type PostgresSystemSettingRepository struct {
	db *gorm.DB
}

func NewPostgresSystemSettingRepository(db *gorm.DB) domain.SystemSettingRepository {
	return &PostgresSystemSettingRepository{db: db}
}

func (r *PostgresSystemSettingRepository) GetSetting(key string) (*domain.SystemSetting, error) {
	var setting domain.SystemSetting
	err := r.db.Where("key = ?", key).First(&setting).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil if not found, let usecase handle default
		}
		return nil, err
	}
	return &setting, nil
}

func (r *PostgresSystemSettingRepository) UpdateSetting(setting *domain.SystemSetting) error {
	// Use Save for upsert behavior since Key is primary key
	return r.db.Save(setting).Error
}

func (r *PostgresSystemSettingRepository) GetAllSettings() ([]domain.SystemSetting, error) {
	var settings []domain.SystemSetting
	err := r.db.Find(&settings).Error
	return settings, err
}
