package usecase

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
)

type BillingConfigUsecase interface {
	// Master Data CRUDs
	GetSalesSchemes() ([]domain.SalesScheme, error)
	CreateSalesScheme(ss *domain.SalesScheme) error

	GetBusinessTypes() ([]domain.BusinessType, error)
	CreateBusinessType(bt *domain.BusinessType) error

	GetProductCategories() ([]domain.ProductCategory, error)
	GetProductCategoriesFiltered(filter map[string]interface{}) ([]domain.ProductCategory, error)
	CreateProductCategory(pc *domain.ProductCategory) error
	
	GetBusinessScales() ([]domain.BusinessScale, error)
	CreateBusinessScale(bs *domain.BusinessScale) error
	
	
	GetBillingComponents() ([]domain.BillingComponent, error)
	GetBillingComponentsFiltered(filter map[string]interface{}) ([]domain.BillingComponent, error)
	CreateBillingComponent(bc *domain.BillingComponent) error

	// SalesSchemePrice CRUD
	GetSalesSchemePrices(filter map[string]interface{}) ([]domain.SalesSchemePrice, error)
	CreateSalesSchemePrice(sp *domain.SalesSchemePrice) error
	UpdateSalesSchemePrice(sp *domain.SalesSchemePrice) error
	DeleteSalesSchemePrice(id int64) error
	
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

func (uc *billingConfigUsecase) GetSalesSchemes() ([]domain.SalesScheme, error) {
	return uc.repo.FindAllSalesSchemes()
}
func (uc *billingConfigUsecase) CreateSalesScheme(ss *domain.SalesScheme) error {
	return uc.repo.CreateSalesScheme(ss)
}

func (uc *billingConfigUsecase) GetBusinessTypes() ([]domain.BusinessType, error) {
	return uc.repo.FindAllBusinessTypes()
}
func (uc *billingConfigUsecase) CreateBusinessType(bt *domain.BusinessType) error {
	return uc.repo.CreateBusinessType(bt)
}

func (uc *billingConfigUsecase) GetProductCategories() ([]domain.ProductCategory, error) {
	return uc.repo.FindAllProductCategories(nil)
}
func (uc *billingConfigUsecase) GetProductCategoriesFiltered(filter map[string]interface{}) ([]domain.ProductCategory, error) {
	return uc.repo.FindAllProductCategories(filter)
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


func (uc *billingConfigUsecase) GetBillingComponents() ([]domain.BillingComponent, error) {
	return uc.repo.FindAllBillingComponents(nil)
}
func (uc *billingConfigUsecase) GetBillingComponentsFiltered(filter map[string]interface{}) ([]domain.BillingComponent, error) {
	return uc.repo.FindAllBillingComponents(filter)
}
func (uc *billingConfigUsecase) CreateBillingComponent(bc *domain.BillingComponent) error {
	return uc.repo.CreateBillingComponent(bc)
}

// SalesSchemePrice
func (uc *billingConfigUsecase) GetSalesSchemePrices(filter map[string]interface{}) ([]domain.SalesSchemePrice, error) {
	return uc.repo.FindAllSalesSchemePrices(filter)
}
func (uc *billingConfigUsecase) CreateSalesSchemePrice(sp *domain.SalesSchemePrice) error {
	return uc.repo.CreateSalesSchemePrice(sp)
}
func (uc *billingConfigUsecase) UpdateSalesSchemePrice(sp *domain.SalesSchemePrice) error {
	return uc.repo.UpdateSalesSchemePrice(sp)
}
func (uc *billingConfigUsecase) DeleteSalesSchemePrice(id int64) error {
	return uc.repo.DeleteSalesSchemePrice(id)
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
