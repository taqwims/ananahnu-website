package usecase

import (
	"ananahnu/internal/domain"
	"time"

	"github.com/google/uuid"
)

type NotificationUsecase interface {
	GetUserNotifications(userID uuid.UUID) ([]domain.Notification, error)
	CreateNotification(userID uuid.UUID, title, message string, entityID uuid.UUID) error
}

type notificationUsecase struct {
	notifRepo domain.NotificationRepository
}

func NewNotificationUsecase(r domain.NotificationRepository) NotificationUsecase {
	return &notificationUsecase{notifRepo: r}
}

func (uc *notificationUsecase) GetUserNotifications(userID uuid.UUID) ([]domain.Notification, error) {
	return uc.notifRepo.FindByUserID(userID)
}

func (uc *notificationUsecase) CreateNotification(userID uuid.UUID, title, message string, entityID uuid.UUID) error {
	notif := &domain.Notification{
		UserID:          userID,
		Title:           title,
		Message:         message,
		RelatedEntityID: entityID,
		CreatedAt:       time.Now(),
		IsRead:          false,
	}
	return uc.notifRepo.Create(notif)
}
