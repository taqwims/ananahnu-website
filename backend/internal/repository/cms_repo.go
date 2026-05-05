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

// --- News ---

func (r *cmsRepository) FindAllNews(filter map[string]interface{}) ([]domain.News, error) {
	var news []domain.News
	if err := r.db.Order("published_at DESC").Find(&news).Error; err != nil {
		return nil, err
	}
	return news, nil
}

func (r *cmsRepository) CreateNews(news *domain.News) error {
	return r.db.Create(news).Error
}

func (r *cmsRepository) UpdateNews(news *domain.News) error {
	return r.db.Save(news).Error
}

func (r *cmsRepository) DeleteNews(id int64) error {
	return r.db.Delete(&domain.News{}, id).Error
}

// --- Content Blocks ---

func (r *cmsRepository) FindContentBlock(key string) (*domain.ContentBlock, error) {
	var block domain.ContentBlock
	if err := r.db.Where("section_key = ?", key).First(&block).Error; err != nil {
		return nil, err
	}
	return &block, nil
}

func (r *cmsRepository) FindAllContentBlocks() ([]domain.ContentBlock, error) {
	var blocks []domain.ContentBlock
	if err := r.db.Order("id ASC").Find(&blocks).Error; err != nil {
		return nil, err
	}
	return blocks, nil
}

func (r *cmsRepository) UpdateContentBlock(block *domain.ContentBlock) error {
	return r.db.Save(block).Error
}

// --- Affiliates ---

func (r *cmsRepository) FindAllAffiliates() ([]domain.Affiliate, error) {
	var affiliates []domain.Affiliate
	if err := r.db.Order("id ASC").Find(&affiliates).Error; err != nil {
		return nil, err
	}
	return affiliates, nil
}

func (r *cmsRepository) CreateAffiliate(a *domain.Affiliate) error {
	return r.db.Create(a).Error
}

func (r *cmsRepository) UpdateAffiliate(a *domain.Affiliate) error {
	return r.db.Save(a).Error
}

func (r *cmsRepository) DeleteAffiliate(id int64) error {
	return r.db.Delete(&domain.Affiliate{}, id).Error
}

// --- Certified Products ---

func (r *cmsRepository) FindAllCertifiedProducts() ([]domain.CertifiedProduct, error) {
	var products []domain.CertifiedProduct
	if err := r.db.Order("id ASC").Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (r *cmsRepository) CreateCertifiedProduct(p *domain.CertifiedProduct) error {
	return r.db.Create(p).Error
}

func (r *cmsRepository) UpdateCertifiedProduct(p *domain.CertifiedProduct) error {
	return r.db.Save(p).Error
}

func (r *cmsRepository) DeleteCertifiedProduct(id int64) error {
	return r.db.Delete(&domain.CertifiedProduct{}, id).Error
}
