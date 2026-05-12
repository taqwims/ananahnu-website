package usecase

import (
	"time"

	"ananahnu/internal/domain"
)

type SystemSettingUsecase struct {
	repo domain.SystemSettingRepository
}

func NewSystemSettingUsecase(repo domain.SystemSettingRepository) *SystemSettingUsecase {
	return &SystemSettingUsecase{repo: repo}
}

func (u *SystemSettingUsecase) GetSetting(key string, defaultValue string) (string, error) {
	setting, err := u.repo.GetSetting(key)
	if err != nil {
		return "", err
	}
	if setting == nil || setting.Value == "" {
		return defaultValue, nil
	}
	return setting.Value, nil
}

func (u *SystemSettingUsecase) UpdateSetting(key string, value string) error {
	setting := &domain.SystemSetting{
		Key:       key,
		Value:     value,
		UpdatedAt: time.Now(),
	}
	return u.repo.UpdateSetting(setting)
}

func (u *SystemSettingUsecase) GetAllSettings() ([]domain.SystemSetting, error) {
	return u.repo.GetAllSettings()
}
