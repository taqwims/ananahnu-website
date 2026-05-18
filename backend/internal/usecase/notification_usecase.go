package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/whatsapp"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

type NotificationUsecase interface {
	GetUserNotifications(userID uuid.UUID) ([]domain.Notification, error)
	CreateNotification(userID uuid.UUID, title, message string, entityID uuid.UUID) error
	SendWhatsAppNotification(target string, message string) error
	MarkAsRead(id int64) error
	
	// Workflow specific
	SendWorkflowNotification(key string, replacements map[string]string, targetPhone string, userID *uuid.UUID, entityID uuid.UUID, title, fallbackMsg string) error
}

type NotificationUsecaseDeps struct {
	NotifRepo   domain.NotificationRepository
	WASender    whatsapp.WhatsAppSender
	SettingRepo domain.SystemSettingRepository
}

type notificationUsecase struct {
	NotificationUsecaseDeps
}

func NewNotificationUsecase(deps NotificationUsecaseDeps) NotificationUsecase {
	return &notificationUsecase{
		NotificationUsecaseDeps: deps,
	}
}

func (uc *notificationUsecase) GetUserNotifications(userID uuid.UUID) ([]domain.Notification, error) {
	return uc.NotifRepo.FindByUserID(userID)
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
	return uc.NotifRepo.Create(notif)
}

func (uc *notificationUsecase) SendWhatsAppNotification(target string, message string) error {
	if uc.WASender == nil {
		return nil
	}
	
	// Normalize phone number
	target = strings.ReplaceAll(target, " ", "")
	target = strings.ReplaceAll(target, "-", "")
	target = strings.ReplaceAll(target, "+", "")
	if strings.HasPrefix(target, "0") {
		target = "62" + target[1:]
	} else if !strings.HasPrefix(target, "62") {
		target = "62" + target
	}
	
	return uc.WASender.Send(target, message)
}

func (uc *notificationUsecase) SendWorkflowNotification(key string, replacements map[string]string, targetPhone string, userID *uuid.UUID, entityID uuid.UUID, title, fallbackMsg string) error {
	// 1. Resolve template
	msg := fallbackMsg
	setting, _ := uc.SettingRepo.GetSetting("template_" + key)
	if setting != nil && setting.Value != "" {
		msg = setting.Value
	}
	
	for k, v := range replacements {
		msg = strings.ReplaceAll(msg, "{{"+k+"}}", v)
	}
	
	// 2. Check toggles
	globalWA, _ := uc.SettingRepo.GetSetting("wa_notifications_enabled")
	globalWAEnabled := globalWA == nil || globalWA.Value == "true"

	enableApp, _ := uc.SettingRepo.GetSetting("enable_app_" + key)
	enableWA, _ := uc.SettingRepo.GetSetting("enable_wa_" + key)

	appEnabled := enableApp == nil || enableApp.Value == "true"
	waEnabled := (enableWA == nil || enableWA.Value == "true") && globalWAEnabled
	
	// 3. Dispatch
	if waEnabled && targetPhone != "" {
		err := uc.SendWhatsAppNotification(targetPhone, msg)
		if err != nil {
			log.Printf("[NOTIF] Failed to send WA notification to %s: %v", targetPhone, err)
		} else {
			log.Printf("[NOTIF] WA notification sent to %s (key: %s)", targetPhone, key)
		}
	}
	
	if appEnabled && userID != nil {
		err := uc.CreateNotification(*userID, title, msg, entityID)
		if err != nil {
			log.Printf("[NOTIF] Failed to create App notification for user %s: %v", userID, err)
		} else {
			log.Printf("[NOTIF] App notification created for user %s (key: %s)", userID, key)
		}
	}
	
	return nil
}

func (uc *notificationUsecase) MarkAsRead(id int64) error {
	return uc.NotifRepo.MarkAsRead(id)
}
