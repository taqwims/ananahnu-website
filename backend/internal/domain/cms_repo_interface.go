package domain

type CMSRepository interface {
	// News
	FindAllNews(filter map[string]interface{}) ([]News, error)
	CreateNews(news *News) error
	UpdateNews(news *News) error
	DeleteNews(id int64) error

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
