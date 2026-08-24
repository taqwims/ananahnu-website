package domain

type CMSRepository interface {
	// News
	FindAllNews(filter map[string]interface{}) ([]News, error)
	FindAllNewsWithFilter(search string, category string, isPublishedOnly bool, landingOnly bool, featuredOnly bool, limit int, offset int) ([]News, int64, error)
	FindNewsBySlug(slug string) (*News, error)
	FindNewsByID(id int64) (*News, error)
	CreateNews(news *News) error
	UpdateNews(news *News) error
	DeleteNews(id int64) error
	IncrementNewsViews(id int64) error
	GetNewsCategories() ([]string, error)
	FindRelatedNews(category string, excludeID int64, limit int) ([]News, error)

	// Content Blocks
	FindContentBlock(key string) (*ContentBlock, error)
	FindAllContentBlocks() ([]ContentBlock, error)
	UpdateContentBlock(block *ContentBlock) error

	// Affiliates
	FindAllAffiliates() ([]Affiliate, error)
	CreateAffiliate(a *Affiliate) error
	UpdateAffiliate(a *Affiliate) error
	DeleteAffiliate(id int64) error

	// Certified Products
	FindAllCertifiedProducts() ([]CertifiedProduct, error)
	CreateCertifiedProduct(p *CertifiedProduct) error
	UpdateCertifiedProduct(p *CertifiedProduct) error
	DeleteCertifiedProduct(id int64) error
}
