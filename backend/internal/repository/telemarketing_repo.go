package repository

import (
	"ananahnu/internal/domain"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ── TeleForm Repository ────────────────────────────────────────────────

type teleFormRepository struct {
	db *gorm.DB
}

func NewTeleFormRepository(db *gorm.DB) domain.TeleFormRepository {
	return &teleFormRepository{db: db}
}

func (r *teleFormRepository) Create(form *domain.TeleForm) error {
	return r.db.Create(form).Error
}

func (r *teleFormRepository) FindByID(id uuid.UUID) (*domain.TeleForm, error) {
	var form domain.TeleForm
	err := r.db.Preload("Province").
		Preload("Telemarketer").Preload("Telemarketer.Role").
		Preload("ClientUser").Preload("ClientUser.Role").
		Preload("SharedBy").
		Preload("Submission").
		Where("id = ?", id).First(&form).Error
	return &form, err
}

func (r *teleFormRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.TeleForm, int64, error) {
	var forms []domain.TeleForm
	var total int64

	query := r.db.Model(&domain.TeleForm{})

	if status, ok := filter["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if routeType, ok := filter["route_type"]; ok {
		query = query.Where("route_type = ?", routeType)
	}
	if telemarketerID, ok := filter["telemarketer_id"]; ok {
		query = query.Where("telemarketer_id = ?", telemarketerID)
	}
	if sharedByID, ok := filter["shared_by_id"]; ok {
		query = query.Where("shared_by_id = ?", sharedByID)
	}
	if clientUserID, ok := filter["client_user_id"]; ok {
		query = query.Where("client_user_id = ?", clientUserID)
	}
	if search, ok := filter["search"]; ok && search != "" {
		s := fmt.Sprintf("%%%s%%", search)
		query = query.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ?", s, s, s)
	}

	query.Count(&total)

	if limit > 0 {
		query = query.Offset((page - 1) * limit).Limit(limit)
	}

	err := query.Order("created_at DESC").
		Preload("Province").
		Preload("Telemarketer").Preload("Telemarketer.Role").
		Preload("SharedBy").
		Find(&forms).Error

	return forms, total, err
}

func (r *teleFormRepository) FindByTelemarketerID(telemarketerID uuid.UUID, page, limit int) ([]domain.TeleForm, int64, error) {
	return r.FindAll(map[string]interface{}{"telemarketer_id": telemarketerID}, page, limit)
}

func (r *teleFormRepository) FindBySharedByID(sharedByID uuid.UUID, page, limit int) ([]domain.TeleForm, int64, error) {
	return r.FindAll(map[string]interface{}{"shared_by_id": sharedByID}, page, limit)
}

func (r *teleFormRepository) Update(form *domain.TeleForm) error {
	return r.db.Save(form).Error
}

func (r *teleFormRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.TeleForm{}, "id = ?", id).Error
}

func (r *teleFormRepository) FindExpiredUnpaid(cutoffDate time.Time) ([]domain.TeleForm, error) {
	var forms []domain.TeleForm
	err := r.db.Where("status = ? AND created_at < ?", domain.TeleFormStatusInvoiceSent, cutoffDate).
		Find(&forms).Error
	return forms, err
}

func (r *teleFormRepository) CountByStatus(filter map[string]interface{}) (map[string]int64, error) {
	type Result struct {
		Status string
		Count  int64
	}
	var results []Result

	query := r.db.Model(&domain.TeleForm{}).Select("status, count(*) as count")

	if telemarketerID, ok := filter["telemarketer_id"]; ok {
		query = query.Where("telemarketer_id = ?", telemarketerID)
	}
	if sharedByID, ok := filter["shared_by_id"]; ok {
		query = query.Where("shared_by_id = ?", sharedByID)
	}

	err := query.Group("status").Find(&results).Error
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Status] = r.Count
	}
	return counts, nil
}

// ── TeleMeeting Repository ────────────────────────────────────────────

type teleMeetingRepository struct {
	db *gorm.DB
}

func NewTeleMeetingRepository(db *gorm.DB) domain.TeleMeetingRepository {
	return &teleMeetingRepository{db: db}
}

func (r *teleMeetingRepository) Create(meeting *domain.TeleMeeting) error {
	return r.db.Create(meeting).Error
}

func (r *teleMeetingRepository) FindByID(id uuid.UUID) (*domain.TeleMeeting, error) {
	var meeting domain.TeleMeeting
	err := r.db.Preload("TeleForm").
		Preload("Telemarketer").Preload("Telemarketer.Role").
		Where("id = ?", id).First(&meeting).Error
	return &meeting, err
}

func (r *teleMeetingRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.TeleMeeting, int64, error) {
	var meetings []domain.TeleMeeting
	var total int64

	query := r.db.Model(&domain.TeleMeeting{})

	if status, ok := filter["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if telemarketerID, ok := filter["telemarketer_id"]; ok {
		query = query.Where("telemarketer_id = ?", telemarketerID)
	}
	if dateFrom, ok := filter["date_from"]; ok {
		query = query.Where("scheduled_at >= ?", dateFrom)
	}
	if dateTo, ok := filter["date_to"]; ok {
		query = query.Where("scheduled_at <= ?", dateTo)
	}

	query.Count(&total)

	if limit > 0 {
		query = query.Offset((page - 1) * limit).Limit(limit)
	}

	err := query.Order("scheduled_at ASC").
		Preload("TeleForm").
		Preload("Telemarketer").Preload("Telemarketer.Role").
		Find(&meetings).Error

	return meetings, total, err
}

func (r *teleMeetingRepository) FindByTelemarketerID(telemarketerID uuid.UUID, page, limit int) ([]domain.TeleMeeting, int64, error) {
	return r.FindAll(map[string]interface{}{"telemarketer_id": telemarketerID}, page, limit)
}

func (r *teleMeetingRepository) Update(meeting *domain.TeleMeeting) error {
	return r.db.Save(meeting).Error
}

func (r *teleMeetingRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.TeleMeeting{}, "id = ?", id).Error
}

// ── TeleAgreement Repository ──────────────────────────────────────────

type teleAgreementRepository struct {
	db *gorm.DB
}

func NewTeleAgreementRepository(db *gorm.DB) domain.TeleAgreementRepository {
	return &teleAgreementRepository{db: db}
}

func (r *teleAgreementRepository) Create(agreement *domain.TeleAgreement) error {
	return r.db.Create(agreement).Error
}

func (r *teleAgreementRepository) FindByID(id uuid.UUID) (*domain.TeleAgreement, error) {
	var agreement domain.TeleAgreement
	err := r.db.Preload("TeleForm").
		Preload("ClientUser").
		Where("id = ?", id).First(&agreement).Error
	return &agreement, err
}

func (r *teleAgreementRepository) FindByTeleFormID(teleFormID uuid.UUID) (*domain.TeleAgreement, error) {
	var agreement domain.TeleAgreement
	err := r.db.Where("tele_form_id = ?", teleFormID).First(&agreement).Error
	return &agreement, err
}

func (r *teleAgreementRepository) GetNextAgreementNumber() (string, error) {
	var count int64
	err := r.db.Model(&domain.TeleAgreement{}).Count(&count).Error
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("HC-%06d", count+1), nil
}
