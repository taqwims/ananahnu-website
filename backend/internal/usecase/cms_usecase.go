package usecase

import "ananahnu/internal/domain"

type CMSUsecase interface {
	// News
	GetNews() ([]domain.News, error)
	CreateNews(news *domain.News) error
	UpdateNews(id int64, news *domain.News) error
	DeleteNews(id int64) error

	// Content Blocks
	GetContentBlock(key string) (*domain.ContentBlock, error)
	ListContentBlocks() ([]domain.ContentBlock, error)
	UpdateContentBlock(input domain.ContentBlock) error

	// Affiliates
	ListAffiliates() ([]domain.Affiliate, error)
	CreateAffiliate(a *domain.Affiliate) error
	UpdateAffiliate(id int64, a *domain.Affiliate) error
	DeleteAffiliate(id int64) error

	// Certified Products
	ListCertifiedProducts() ([]domain.CertifiedProduct, error)
	CreateCertifiedProduct(p *domain.CertifiedProduct) error
	UpdateCertifiedProduct(id int64, p *domain.CertifiedProduct) error
	DeleteCertifiedProduct(id int64) error
}

type CMSUsecaseDeps struct {
	CMSRepo domain.CMSRepository
}

type cmsUsecase struct {
	CMSUsecaseDeps
}

func NewCMSUsecase(deps CMSUsecaseDeps) CMSUsecase {
	return &cmsUsecase{
		CMSUsecaseDeps: deps,
	}
}

// --- News ---

func (uc *cmsUsecase) GetNews() ([]domain.News, error) {
	return uc.CMSRepo.FindAllNews(nil)
}

func (uc *cmsUsecase) CreateNews(news *domain.News) error {
	return uc.CMSRepo.CreateNews(news)
}

func (uc *cmsUsecase) UpdateNews(id int64, news *domain.News) error {
	news.ID = id
	return uc.CMSRepo.UpdateNews(news)
}

func (uc *cmsUsecase) DeleteNews(id int64) error {
	return uc.CMSRepo.DeleteNews(id)
}

// --- Content Blocks ---

func (uc *cmsUsecase) GetContentBlock(key string) (*domain.ContentBlock, error) {
	return uc.CMSRepo.FindContentBlock(key)
}

func (uc *cmsUsecase) ListContentBlocks() ([]domain.ContentBlock, error) {
	return uc.CMSRepo.FindAllContentBlocks()
}

func (uc *cmsUsecase) UpdateContentBlock(input domain.ContentBlock) error {
	return uc.CMSRepo.UpdateContentBlock(&input)
}

// --- Affiliates ---

func (uc *cmsUsecase) ListAffiliates() ([]domain.Affiliate, error) {
	return uc.CMSRepo.FindAllAffiliates()
}

func (uc *cmsUsecase) CreateAffiliate(a *domain.Affiliate) error {
	return uc.CMSRepo.CreateAffiliate(a)
}

func (uc *cmsUsecase) UpdateAffiliate(id int64, a *domain.Affiliate) error {
	a.ID = id
	return uc.CMSRepo.UpdateAffiliate(a)
}

func (uc *cmsUsecase) DeleteAffiliate(id int64) error {
	return uc.CMSRepo.DeleteAffiliate(id)
}

// --- Certified Products ---

func (uc *cmsUsecase) ListCertifiedProducts() ([]domain.CertifiedProduct, error) {
	return uc.CMSRepo.FindAllCertifiedProducts()
}

func (uc *cmsUsecase) CreateCertifiedProduct(p *domain.CertifiedProduct) error {
	return uc.CMSRepo.CreateCertifiedProduct(p)
}

func (uc *cmsUsecase) UpdateCertifiedProduct(id int64, p *domain.CertifiedProduct) error {
	p.ID = id
	return uc.CMSRepo.UpdateCertifiedProduct(p)
}

func (uc *cmsUsecase) DeleteCertifiedProduct(id int64) error {
	return uc.CMSRepo.DeleteCertifiedProduct(id)
}
