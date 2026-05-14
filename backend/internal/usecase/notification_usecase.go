package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/whatsapp"
	"time"

	"github.com/google/uuid"
)

type NotificationUsecase interface {
	GetUserNotifications(userID uuid.UUID) ([]domain.Notification, error)
	CreateNotification(userID uuid.UUID, title, message string, entityID uuid.UUID) error
	SendWhatsAppNotification(target string, message string) error
	MarkAsRead(id int64) error
}

type notificationUsecase struct {
	notifRepo domain.NotificationRepository
	waSender  whatsapp.WhatsAppSender
}

func NewNotificationUsecase(r domain.NotificationRepository, wa whatsapp.WhatsAppSender) NotificationUsecase {
	return &notificationUsecase{
		notifRepo: r,
		waSender:  wa,
	}
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

func (uc *notificationUsecase) SendWhatsAppNotification(target string, message string) error {
	if uc.waSender == nil {
		return nil // No WA sender configured
	}
	return uc.waSender.Send(target, message)
}

func (uc *notificationUsecase) MarkAsRead(id int64) error {
	return uc.notifRepo.MarkAsRead(id)
}
