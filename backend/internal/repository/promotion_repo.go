package repository

import (
	"ananahnu/internal/domain"
	"gorm.io/gorm"
)

type promotionRepository struct {
	db *gorm.DB
}

func NewPromotionRepository(db *gorm.DB) domain.PromotionRepository {
	return &promotionRepository{db: db}
}

func (r *promotionRepository) Create(req *domain.PromotionRequest) error {
	return r.db.Create(req).Error
}

func (r *promotionRepository) Update(req *domain.PromotionRequest) error {
	return r.db.Save(req).Error
}

func (r *promotionRepository) FindByID(id int64) (*domain.PromotionRequest, error) {
	var req domain.PromotionRequest
	if err := r.db.Preload("User.Role").First(&req, id).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *promotionRepository) FindAll(filter map[string]interface{}) ([]domain.PromotionRequest, error) {
	var reqs []domain.PromotionRequest
	db := r.db.Model(&domain.PromotionRequest{}).Preload("User.Role")
	
	if userID, ok := filter["user_id"]; ok {
		db = db.Where("user_id = ?", userID)
	}
	if status, ok := filter["status"]; ok {
		db = db.Where("status = ?", status)
	}
	
	if err := db.Order("created_at desc").Find(&reqs).Error; err != nil {
		return nil, err
	}
	return reqs, nil
}
