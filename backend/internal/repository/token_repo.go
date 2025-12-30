package repository

import (
	"ananahnu/internal/domain"

	"gorm.io/gorm"
)

type passwordTokenRepository struct {
	db *gorm.DB
}

func NewPasswordTokenRepository(db *gorm.DB) domain.PasswordTokenRepository {
	return &passwordTokenRepository{db: db}
}

func (r *passwordTokenRepository) Create(token *domain.PasswordResetToken) error {
	return r.db.Create(token).Error
}

func (r *passwordTokenRepository) FindByToken(token string) (*domain.PasswordResetToken, error) {
	var t domain.PasswordResetToken
	if err := r.db.First(&t, "token = ?", token).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *passwordTokenRepository) Delete(token string) error {
	return r.db.Delete(&domain.PasswordResetToken{}, "token = ?", token).Error
}
