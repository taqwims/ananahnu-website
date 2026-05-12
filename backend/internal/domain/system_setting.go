package domain

import "time"

type SystemSetting struct {
	Key       string    `gorm:"primaryKey" json:"key"`
	Value     string    `gorm:"not null" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SystemSettingRepository interface {
	GetSetting(key string) (*SystemSetting, error)
	UpdateSetting(setting *SystemSetting) error
	GetAllSettings() ([]SystemSetting, error)
}
