package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type billingConfigRepo struct {
	db *gorm.DB
}

func NewBillingConfigRepository(db *gorm.DB) domain.BillingConfigRepository {
	return &billingConfigRepo{db: db}
}

// ProductCategory
func (r *billingConfigRepo) FindAllProductCategories() ([]domain.ProductCategory, error) {
	var categories []domain.ProductCategory
	err := r.db.Find(&categories).Error
	return categories, err
}

func (r *billingConfigRepo) CreateProductCategory(pc *domain.ProductCategory) error {
	return r.db.Create(pc).Error
}

func (r *billingConfigRepo) UpdateProductCategory(pc *domain.ProductCategory) error {
	return r.db.Save(pc).Error
}

func (r *billingConfigRepo) DeleteProductCategory(id int64) error {
	return r.db.Delete(&domain.ProductCategory{}, id).Error
}

// BusinessScale
func (r *billingConfigRepo) FindAllBusinessScales() ([]domain.BusinessScale, error) {
	var scales []domain.BusinessScale
	err := r.db.Find(&scales).Error
	return scales, err
}

func (r *billingConfigRepo) CreateBusinessScale(bs *domain.BusinessScale) error {
	return r.db.Create(bs).Error
}

func (r *billingConfigRepo) UpdateBusinessScale(bs *domain.BusinessScale) error {
	return r.db.Save(bs).Error
}

func (r *billingConfigRepo) DeleteBusinessScale(id int64) error {
	return r.db.Delete(&domain.BusinessScale{}, id).Error
}

// HalalAgency
func (r *billingConfigRepo) FindAllHalalAgencies() ([]domain.HalalAgency, error) {
	var agencies []domain.HalalAgency
	err := r.db.Find(&agencies).Error
	return agencies, err
}

func (r *billingConfigRepo) CreateHalalAgency(ha *domain.HalalAgency) error {
	return r.db.Create(ha).Error
}

func (r *billingConfigRepo) UpdateHalalAgency(ha *domain.HalalAgency) error {
	return r.db.Save(ha).Error
}

func (r *billingConfigRepo) DeleteHalalAgency(id int64) error {
	return r.db.Delete(&domain.HalalAgency{}, id).Error
}

// BillingComponent
func (r *billingConfigRepo) FindAllBillingComponents(filter map[string]interface{}) ([]domain.BillingComponent, error) {
	var components []domain.BillingComponent
	query := r.db.Model(&domain.BillingComponent{})
	
	if val, ok := filter["type"]; ok && val != "" {
		query = query.Where("type = ?", val)
	}
	
	err := query.Find(&components).Error
	return components, err
}

func (r *billingConfigRepo) CreateBillingComponent(bc *domain.BillingComponent) error {
	return r.db.Create(bc).Error
}

func (r *billingConfigRepo) UpdateBillingComponent(bc *domain.BillingComponent) error {
	return r.db.Save(bc).Error
}

func (r *billingConfigRepo) DeleteBillingComponent(id int64) error {
	return r.db.Delete(&domain.BillingComponent{}, id).Error
}

// SubmissionCostDetail
func (r *billingConfigRepo) SaveSubmissionCostDetail(detail *domain.SubmissionCostDetail) error {
	// Use clause.OnConflict to update if exists
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "submission_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"product_category_id", "business_scale_id", "halal_agency_id", 
			"product_count", "branch_count", "mandays", "total_amount", "cost_breakdown_data", "updated_at",
		}),
	}).Create(detail).Error
}

func (r *billingConfigRepo) GetSubmissionCostDetail(submissionID uuid.UUID) (*domain.SubmissionCostDetail, error) {
	var detail domain.SubmissionCostDetail
	err := r.db.
		Preload("ProductCategory").
		Preload("BusinessScale").
		Preload("HalalAgency").
		Where("submission_id = ?", submissionID).
		First(&detail).Error
	if err != nil {
		return nil, err
	}
	return &detail, nil
}
