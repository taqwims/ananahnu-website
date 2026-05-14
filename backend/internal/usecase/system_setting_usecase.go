package usecase

import (
	"time"

	"ananahnu/internal/domain"
)

type SystemSettingUsecase interface {
	GetSetting(key string, defaultValue string) (string, error)
	UpdateSetting(key string, value string) error
	GetAllSettings() ([]domain.SystemSetting, error)
}

type SystemSettingUsecaseDeps struct {
	Repo domain.SystemSettingRepository
}

type systemSettingUsecase struct {
	SystemSettingUsecaseDeps
}

func NewSystemSettingUsecase(deps SystemSettingUsecaseDeps) SystemSettingUsecase {
	return &systemSettingUsecase{
		SystemSettingUsecaseDeps: deps,
	}
}

func (u *systemSettingUsecase) GetSetting(key string, defaultValue string) (string, error) {
	setting, err := u.Repo.GetSetting(key)
	if err != nil {
		return "", err
	}
	if setting == nil || setting.Value == "" {
		return defaultValue, nil
	}
	return setting.Value, nil
}

func (u *systemSettingUsecase) UpdateSetting(key string, value string) error {
	setting := &domain.SystemSetting{
		Key:       key,
		Value:     value,
		UpdatedAt: time.Now(),
	}
	return u.Repo.UpdateSetting(setting)
}

func (u *systemSettingUsecase) GetAllSettings() ([]domain.SystemSetting, error) {
	return u.Repo.GetAllSettings()
}
