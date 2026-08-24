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
	query := r.db.Model(&domain.News{}).Order("published_at DESC, created_at DESC")
	if filter != nil {
		query = query.Where(filter)
	}
	if err := query.Find(&news).Error; err != nil {
		return nil, err
	}
	return news, nil
}

func (r *cmsRepository) FindAllNewsWithFilter(search string, category string, isPublishedOnly bool, landingOnly bool, featuredOnly bool, limit int, offset int) ([]domain.News, int64, error) {
	var news []domain.News
	var total int64

	query := r.db.Model(&domain.News{})

	if isPublishedOnly {
		query = query.Where("is_published = ?", true)
	}
	if landingOnly {
		query = query.Where("show_on_landing = ?", true)
	}
	if featuredOnly {
		query = query.Where("is_featured = ?", true)
	}
	if category != "" && category != "Semua" && category != "all" {
		query = query.Where("category = ?", category)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title LIKE ? OR content LIKE ? OR tags LIKE ? OR meta_keywords LIKE ?", searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query = query.Order("is_featured DESC, published_at DESC, created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	if err := query.Find(&news).Error; err != nil {
		return nil, 0, err
	}

	return news, total, nil
}

func (r *cmsRepository) FindNewsBySlug(slug string) (*domain.News, error) {
	var news domain.News
	if err := r.db.Where("slug = ?", slug).First(&news).Error; err != nil {
		return nil, err
	}
	return &news, nil
}

func (r *cmsRepository) FindNewsByID(id int64) (*domain.News, error) {
	var news domain.News
	if err := r.db.Where("id = ?", id).First(&news).Error; err != nil {
		return nil, err
	}
	return &news, nil
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

func (r *cmsRepository) IncrementNewsViews(id int64) error {
	return r.db.Model(&domain.News{}).Where("id = ?", id).UpdateColumn("views", gorm.Expr("views + 1")).Error
}

func (r *cmsRepository) GetNewsCategories() ([]string, error) {
	var categories []string
	if err := r.db.Model(&domain.News{}).
		Where("is_published = ?", true).
		Where("category != '' AND category IS NOT NULL").
		Distinct("category").
		Pluck("category", &categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *cmsRepository) FindRelatedNews(category string, excludeID int64, limit int) ([]domain.News, error) {
	var news []domain.News
	if limit <= 0 {
		limit = 3
	}
	query := r.db.Where("is_published = ? AND id != ?", true, excludeID)
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if err := query.Order("published_at DESC").Limit(limit).Find(&news).Error; err != nil {
		return nil, err
	}
	return news, nil
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
