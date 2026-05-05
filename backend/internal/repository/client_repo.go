package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type clientRepository struct {
	db *gorm.DB
}

func NewClientRepository(db *gorm.DB) domain.ClientRepository {
	return &clientRepository{db: db}
}

func (r *clientRepository) Create(client *domain.Client) error {
	return r.db.Create(client).Error
}

func (r *clientRepository) ImportBulk(clients []domain.Client) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, client := range clients {
			if err := tx.Create(&client).Error; err != nil {
				return err // Rollback
			}
		}
		return nil
	})
}

func (r *clientRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error) {
	var clients []domain.Client
	var total int64

	// Base query
	query := r.db.Model(&domain.Client{}).Preload("Facilitator")

	// Apply Filters
	if s, ok := filter["search"]; ok && s != "" {
		query = query.Where("business_name ILIKE ? OR nib ILIKE ?", "%"+s.(string)+"%", "%"+s.(string)+"%")
	}

	// Status filter requires JOIN
	if s, ok := filter["status"]; ok && s != "" {
		query = query.Joins("JOIN submissions ON submissions.client_id = clients.id").
			Where("submissions.status = ?", s)
	}

	// Single facilitator filter (for konsultan viewing own clients)
	if fid, ok := filter["facilitator_id"]; ok && fid != "" {
		query = query.Where("facilitator_id = ?", fid)
	}

	// Multiple facilitator IDs filter (for koordinator viewing team clients)
	if fids, ok := filter["facilitator_ids"]; ok {
		query = query.Where("facilitator_id IN ?", fids)
	}

	// Count Total
	countQuery := query.Session(&gorm.Session{})
	if err := countQuery.Distinct("clients.id").Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination
	offset := (page - 1) * limit
	if limit > 0 {
		query = query.Offset(offset).Limit(limit)
	}

	if err := query.Order("created_at DESC").Find(&clients).Error; err != nil {
		return nil, 0, err
	}

	return clients, total, nil
}

func (r *clientRepository) FindByID(id uuid.UUID) (*domain.Client, error) {
	var client domain.Client
	if err := r.db.First(&client, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) FindByNIB(nib string) (*domain.Client, error) {
	var client domain.Client
	if err := r.db.Where("nib = ?", nib).First(&client).Error; err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) Update(client *domain.Client) error {
	return r.db.Save(client).Error
}
