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

type BillingConfigUsecaseDeps struct {
	Repo           domain.BillingConfigRepository
	RateRepo       domain.CoordinatorRateRepository
	InvoiceRepo    domain.InvoiceRepository
	SubmissionRepo domain.SubmissionRepository
}

type billingConfigUsecase struct {
	BillingConfigUsecaseDeps
}

func NewBillingConfigUsecase(deps BillingConfigUsecaseDeps) BillingConfigUsecase {
	return &billingConfigUsecase{
		BillingConfigUsecaseDeps: deps,
	}
}

func (uc *billingConfigUsecase) GetSalesSchemes() ([]domain.SalesScheme, error) {
	return uc.Repo.FindAllSalesSchemes()
}
func (uc *billingConfigUsecase) CreateSalesScheme(ss *domain.SalesScheme) error {
	return uc.Repo.CreateSalesScheme(ss)
}
func (uc *billingConfigUsecase) UpdateSalesScheme(ss *domain.SalesScheme) error {
	return uc.Repo.UpdateSalesScheme(ss)
}
func (uc *billingConfigUsecase) DeleteSalesScheme(id int64) error {
	return uc.Repo.DeleteSalesScheme(id)
}

func (uc *billingConfigUsecase) GetBusinessTypes() ([]domain.BusinessType, error) {
	return uc.Repo.FindAllBusinessTypes()
}
func (uc *billingConfigUsecase) CreateBusinessType(bt *domain.BusinessType) error {
	return uc.Repo.CreateBusinessType(bt)
}
func (uc *billingConfigUsecase) UpdateBusinessType(bt *domain.BusinessType) error {
	return uc.Repo.UpdateBusinessType(bt)
}
func (uc *billingConfigUsecase) DeleteBusinessType(id int64) error {
	return uc.Repo.DeleteBusinessType(id)
}

func (uc *billingConfigUsecase) GetProductCategories() ([]domain.ProductCategory, error) {
	return uc.Repo.FindAllProductCategories(nil)
}
func (uc *billingConfigUsecase) GetProductCategoriesFiltered(filter map[string]interface{}) ([]domain.ProductCategory, error) {
	return uc.Repo.FindAllProductCategories(filter)
}
func (uc *billingConfigUsecase) CreateProductCategory(pc *domain.ProductCategory) error {
	return uc.Repo.CreateProductCategory(pc)
}
func (uc *billingConfigUsecase) UpdateProductCategory(pc *domain.ProductCategory) error {
	return uc.Repo.UpdateProductCategory(pc)
}
func (uc *billingConfigUsecase) DeleteProductCategory(id int64) error {
	return uc.Repo.DeleteProductCategory(id)
}

func (uc *billingConfigUsecase) GetBusinessScales() ([]domain.BusinessScale, error) {
	return uc.Repo.FindAllBusinessScales()
}
func (uc *billingConfigUsecase) CreateBusinessScale(bs *domain.BusinessScale) error {
	return uc.Repo.CreateBusinessScale(bs)
}
func (uc *billingConfigUsecase) UpdateBusinessScale(bs *domain.BusinessScale) error {
	return uc.Repo.UpdateBusinessScale(bs)
}
func (uc *billingConfigUsecase) DeleteBusinessScale(id int64) error {
	return uc.Repo.DeleteBusinessScale(id)
}

func (uc *billingConfigUsecase) GetBillingComponents() ([]domain.BillingComponent, error) {
	return uc.Repo.FindAllBillingComponents(nil)
}
func (uc *billingConfigUsecase) GetBillingComponentsFiltered(filter map[string]interface{}) ([]domain.BillingComponent, error) {
	return uc.Repo.FindAllBillingComponents(filter)
}
func (uc *billingConfigUsecase) CreateBillingComponent(bc *domain.BillingComponent) error {
	return uc.Repo.CreateBillingComponent(bc)
}
func (uc *billingConfigUsecase) UpdateBillingComponent(bc *domain.BillingComponent) error {
	return uc.Repo.UpdateBillingComponent(bc)
}
func (uc *billingConfigUsecase) DeleteBillingComponent(id int64) error {
	return uc.Repo.DeleteBillingComponent(id)
}

// SalesSchemePrice
func (uc *billingConfigUsecase) GetSalesSchemePrices(filter map[string]interface{}) ([]domain.SalesSchemePrice, error) {
	return uc.Repo.FindAllSalesSchemePrices(filter)
}
func (uc *billingConfigUsecase) CreateSalesSchemePrice(sp *domain.SalesSchemePrice) error {
	return uc.Repo.CreateSalesSchemePrice(sp)
}
func (uc *billingConfigUsecase) UpdateSalesSchemePrice(sp *domain.SalesSchemePrice) error {
	return uc.Repo.UpdateSalesSchemePrice(sp)
}
func (uc *billingConfigUsecase) DeleteSalesSchemePrice(id int64) error {
	return uc.Repo.DeleteSalesSchemePrice(id)
}

func (uc *billingConfigUsecase) SaveSubmissionCost(detail *domain.SubmissionCostDetail) error {
	if err := uc.Repo.SaveSubmissionCostDetail(detail); err != nil {
		return err
	}

	// Sync with Invoice if it exists (for REGULER service)
	invoice, err := uc.InvoiceRepo.FindBySubmissionID(detail.SubmissionID)
	if err == nil && invoice != nil {
		invoice.Amount = detail.TotalAmount
		invoice.PricingSource = "COST_DETAIL"
		return uc.InvoiceRepo.Update(invoice)
	}

	// If invoice doesn't exist, check if we should create one
	sub, err := uc.SubmissionRepo.FindByID(detail.SubmissionID)
	if err == nil && sub != nil && sub.ServiceType == "REGULER" {
		// Only create invoice if it's already in WAITING_PAYMENT or later (except DRAFT/REVISION)
		if sub.Status != domain.StatusDraft && sub.Status != domain.StatusRevision {
			return uc.InvoiceRepo.Create(&domain.Invoice{
				SubmissionID:  detail.SubmissionID,
				PayerID:       nil,
				ServiceType:   "REGULER",
				Amount:        detail.TotalAmount,
				Status:        domain.InvoiceStatusUnpaid,
				PricingSource: "COST_DETAIL",
				Notes:         "Full Payment Layanan Reguler (Sync from Calculator)",
			})
		}
	}

	return nil
}
func (uc *billingConfigUsecase) GetSubmissionCost(submissionID uuid.UUID) (*domain.SubmissionCostDetail, error) {
	return uc.Repo.GetSubmissionCostDetail(submissionID)
}

func (uc *billingConfigUsecase) GetCoordinatorRates() ([]domain.CoordinatorRate, error) {
	return uc.RateRepo.FindAll()
}

func (uc *billingConfigUsecase) SetCoordinatorRate(rate *domain.CoordinatorRate) error {
	return uc.RateRepo.Save(rate)
}
