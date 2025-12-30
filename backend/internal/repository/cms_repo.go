package repository

import (
	"ananahnu/internal/domain"

	"gorm.io/gorm"
)

type cmsRepository struct {
	db *gorm.DB
}

func NewCMSRepository(db *gorm.DB) domain.CMSRepository {
	return &cmsRepository{db: db}
}

func (r *cmsRepository) FindAllNews(filter map[string]interface{}) ([]domain.News, error) {
	var news []domain.News
	if err := r.db.Find(&news).Error; err != nil {
		return nil, err
	}
	return news, nil
}
// Simplified implementations for other methods
func (r *cmsRepository) CreateNews(news *domain.News) error {
	return r.db.Create(news).Error
}
func (r *cmsRepository) UpdateNews(news *domain.News) error {
	return r.db.Save(news).Error
}
func (r *cmsRepository) DeleteNews(id int64) error {
	return r.db.Delete(&domain.News{}, id).Error
}

// Blocks, Affiliates, Products similiar
func (r *cmsRepository) FindContentBlock(key string) (*domain.ContentBlock, error) {
	var block domain.ContentBlock
	if err := r.db.Where("section_key = ?", key).First(&block).Error; err != nil {
		return nil, err
	}
	return &block, nil
}
func (r *cmsRepository) UpdateContentBlock(block *domain.ContentBlock) error {
	// Upsert
	return r.db.Save(block).Error
}
