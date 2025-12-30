package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) domain.NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notif *domain.Notification) error {
	return r.db.Create(notif).Error
}

func (r *notificationRepository) FindByUserID(userID uuid.UUID) ([]domain.Notification, error) {
	var notifs []domain.Notification
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&notifs).Error; err != nil {
		return nil, err
	}
	return notifs, nil
}
