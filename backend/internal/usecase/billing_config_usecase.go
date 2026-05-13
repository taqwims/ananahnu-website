package usecase

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
)

type BillingConfigUsecase interface {
	// Master Data CRUDs
	GetSalesSchemes() ([]domain.SalesScheme, error)
	CreateSalesScheme(ss *domain.SalesScheme) error
	UpdateSalesScheme(ss *domain.SalesScheme) error
	DeleteSalesScheme(id int64) error

	GetBusinessTypes() ([]domain.BusinessType, error)
	CreateBusinessType(bt *domain.BusinessType) error
	UpdateBusinessType(bt *domain.BusinessType) error
	DeleteBusinessType(id int64) error

	GetProductCategories() ([]domain.ProductCategory, error)
	GetProductCategoriesFiltered(filter map[string]interface{}) ([]domain.ProductCategory, error)
	CreateProductCategory(pc *domain.ProductCategory) error
	UpdateProductCategory(pc *domain.ProductCategory) error
	DeleteProductCategory(id int64) error
	
	GetBusinessScales() ([]domain.BusinessScale, error)
	CreateBusinessScale(bs *domain.BusinessScale) error
	UpdateBusinessScale(bs *domain.BusinessScale) error
	DeleteBusinessScale(id int64) error
	
	
	GetBillingComponents() ([]domain.BillingComponent, error)
	GetBillingComponentsFiltered(filter map[string]interface{}) ([]domain.BillingComponent, error)
	CreateBillingComponent(bc *domain.BillingComponent) error
	UpdateBillingComponent(bc *domain.BillingComponent) error
	DeleteBillingComponent(id int64) error

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
func (uc *billingConfigUsecase) UpdateSalesScheme(ss *domain.SalesScheme) error {
	return uc.repo.UpdateSalesScheme(ss)
}
func (uc *billingConfigUsecase) DeleteSalesScheme(id int64) error {
	return uc.repo.DeleteSalesScheme(id)
}

func (uc *billingConfigUsecase) GetBusinessTypes() ([]domain.BusinessType, error) {
	return uc.repo.FindAllBusinessTypes()
}
func (uc *billingConfigUsecase) CreateBusinessType(bt *domain.BusinessType) error {
	return uc.repo.CreateBusinessType(bt)
}
func (uc *billingConfigUsecase) UpdateBusinessType(bt *domain.BusinessType) error {
	return uc.repo.UpdateBusinessType(bt)
}
func (uc *billingConfigUsecase) DeleteBusinessType(id int64) error {
	return uc.repo.DeleteBusinessType(id)
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
func (uc *billingConfigUsecase) UpdateProductCategory(pc *domain.ProductCategory) error {
	return uc.repo.UpdateProductCategory(pc)
}
func (uc *billingConfigUsecase) DeleteProductCategory(id int64) error {
	return uc.repo.DeleteProductCategory(id)
}

func (uc *billingConfigUsecase) GetBusinessScales() ([]domain.BusinessScale, error) {
	return uc.repo.FindAllBusinessScales()
}
func (uc *billingConfigUsecase) CreateBusinessScale(bs *domain.BusinessScale) error {
	return uc.repo.CreateBusinessScale(bs)
}
func (uc *billingConfigUsecase) UpdateBusinessScale(bs *domain.BusinessScale) error {
	return uc.repo.UpdateBusinessScale(bs)
}
func (uc *billingConfigUsecase) DeleteBusinessScale(id int64) error {
	return uc.repo.DeleteBusinessScale(id)
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
func (uc *billingConfigUsecase) UpdateBillingComponent(bc *domain.BillingComponent) error {
	return uc.repo.UpdateBillingComponent(bc)
}
func (uc *billingConfigUsecase) DeleteBillingComponent(id int64) error {
	return uc.repo.DeleteBillingComponent(id)
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
