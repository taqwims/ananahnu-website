package usecase

import "ananahnu/internal/domain"

type CMSUsecase interface {
	GetNews() ([]domain.News, error)
	CreateNews(news *domain.News) error
	GetContentBlock(key string) (*domain.ContentBlock, error)
	UpdateContentBlock(input domain.ContentBlock) error
}

type cmsUsecase struct {
	cmsRepo domain.CMSRepository
}

func NewCMSUsecase(r domain.CMSRepository) CMSUsecase {
	return &cmsUsecase{cmsRepo: r}
}

func (uc *cmsUsecase) GetNews() ([]domain.News, error) {
	return uc.cmsRepo.FindAllNews(nil)
}

func (uc *cmsUsecase) CreateNews(news *domain.News) error {
	return uc.cmsRepo.CreateNews(news)
}

func (uc *cmsUsecase) GetContentBlock(key string) (*domain.ContentBlock, error) {
	return uc.cmsRepo.FindContentBlock(key)
}

func (uc *cmsUsecase) UpdateContentBlock(input domain.ContentBlock) error {
	// Check if exists logic could be here
	return uc.cmsRepo.UpdateContentBlock(&input)
}
