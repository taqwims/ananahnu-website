package usecase

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
)

type BillingConfigUsecase interface {
	// Master Data CRUDs
	GetProductCategories() ([]domain.ProductCategory, error)
	CreateProductCategory(pc *domain.ProductCategory) error
	
	GetBusinessScales() ([]domain.BusinessScale, error)
	CreateBusinessScale(bs *domain.BusinessScale) error
	
	GetHalalAgencies() ([]domain.HalalAgency, error)
	CreateHalalAgency(ha *domain.HalalAgency) error
	
	GetBillingComponents() ([]domain.BillingComponent, error)
	CreateBillingComponent(bc *domain.BillingComponent) error
	
	// Calculation
	SaveSubmissionCost(detail *domain.SubmissionCostDetail) error
	GetSubmissionCost(submissionID uuid.UUID) (*domain.SubmissionCostDetail, error)

	// Coordinator Rates
	GetCoordinatorRates() ([]domain.CoordinatorRate, error)
	SetCoordinatorRate(rate *domain.CoordinatorRate) error
}

type billingConfigUsecase struct {
	repo     domain.BillingConfigRepository
	rateRepo domain.CoordinatorRateRepository
}

func NewBillingConfigUsecase(repo domain.BillingConfigRepository, rateRepo domain.CoordinatorRateRepository) BillingConfigUsecase {
	return &billingConfigUsecase{repo: repo, rateRepo: rateRepo}
}

func (uc *billingConfigUsecase) GetProductCategories() ([]domain.ProductCategory, error) {
	return uc.repo.FindAllProductCategories()
}
func (uc *billingConfigUsecase) CreateProductCategory(pc *domain.ProductCategory) error {
	return uc.repo.CreateProductCategory(pc)
}

func (uc *billingConfigUsecase) GetBusinessScales() ([]domain.BusinessScale, error) {
	return uc.repo.FindAllBusinessScales()
}
func (uc *billingConfigUsecase) CreateBusinessScale(bs *domain.BusinessScale) error {
	return uc.repo.CreateBusinessScale(bs)
}

func (uc *billingConfigUsecase) GetHalalAgencies() ([]domain.HalalAgency, error) {
	return uc.repo.FindAllHalalAgencies()
}
func (uc *billingConfigUsecase) CreateHalalAgency(ha *domain.HalalAgency) error {
	return uc.repo.CreateHalalAgency(ha)
}

func (uc *billingConfigUsecase) GetBillingComponents() ([]domain.BillingComponent, error) {
	return uc.repo.FindAllBillingComponents(nil)
}
func (uc *billingConfigUsecase) CreateBillingComponent(bc *domain.BillingComponent) error {
	return uc.repo.CreateBillingComponent(bc)
}

func (uc *billingConfigUsecase) SaveSubmissionCost(detail *domain.SubmissionCostDetail) error {
	return uc.repo.SaveSubmissionCostDetail(detail)
}
func (uc *billingConfigUsecase) GetSubmissionCost(submissionID uuid.UUID) (*domain.SubmissionCostDetail, error) {
	return uc.repo.GetSubmissionCostDetail(submissionID)
}

func (uc *billingConfigUsecase) GetCoordinatorRates() ([]domain.CoordinatorRate, error) {
	return uc.rateRepo.FindAll()
}

func (uc *billingConfigUsecase) SetCoordinatorRate(rate *domain.CoordinatorRate) error {
	return uc.rateRepo.Save(rate)
}
