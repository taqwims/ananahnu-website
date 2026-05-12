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

// SalesScheme
func (r *billingConfigRepo) FindAllSalesSchemes() ([]domain.SalesScheme, error) {
	var schemes []domain.SalesScheme
	err := r.db.Find(&schemes).Error
	return schemes, err
}

func (r *billingConfigRepo) CreateSalesScheme(ss *domain.SalesScheme) error {
	return r.db.Create(ss).Error
}

func (r *billingConfigRepo) UpdateSalesScheme(ss *domain.SalesScheme) error {
	return r.db.Save(ss).Error
}

func (r *billingConfigRepo) DeleteSalesScheme(id int64) error {
	return r.db.Delete(&domain.SalesScheme{}, id).Error
}

// BusinessType
func (r *billingConfigRepo) FindAllBusinessTypes() ([]domain.BusinessType, error) {
	var types []domain.BusinessType
	err := r.db.Find(&types).Error
	return types, err
}

func (r *billingConfigRepo) CreateBusinessType(bt *domain.BusinessType) error {
	return r.db.Create(bt).Error
}

func (r *billingConfigRepo) UpdateBusinessType(bt *domain.BusinessType) error {
	return r.db.Save(bt).Error
}

func (r *billingConfigRepo) DeleteBusinessType(id int64) error {
	return r.db.Delete(&domain.BusinessType{}, id).Error
}

// ProductCategory
func (r *billingConfigRepo) FindAllProductCategories(filter map[string]interface{}) ([]domain.ProductCategory, error) {
	var categories []domain.ProductCategory
	db := r.db.Preload("BusinessType")
	if v, ok := filter["business_type_id"]; ok && v != "" {
		db = db.Where("business_type_id = ?", v)
	}
	err := db.Find(&categories).Error
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


// BillingComponent
func (r *billingConfigRepo) FindAllBillingComponents(filter map[string]interface{}) ([]domain.BillingComponent, error) {
	var components []domain.BillingComponent
	query := r.db.Model(&domain.BillingComponent{})
	
	if val, ok := filter["type"]; ok && val != "" {
		query = query.Where("type = ?", val)
	}
	if val, ok := filter["category"]; ok && val != "" {
		query = query.Where("category = ?", val)
	}
	if val, ok := filter["business_type_id"]; ok && val != "" {
		query = query.Where("business_type_id = ? OR business_type_id IS NULL", val)
	}
	if val, ok := filter["product_category_id"]; ok && val != "" {
		query = query.Where("product_category_id = ? OR product_category_id IS NULL", val)
	}
	if val, ok := filter["is_mandatory"]; ok && val != "" {
		query = query.Where("is_mandatory = ?", val)
	}
	if val, ok := filter["business_scale_id"]; ok && val != "" {
		query = query.Where("business_scale_id = ? OR business_scale_id IS NULL", val)
	}
	resolveGeo, _ := filter["resolve_geography"].(bool)

	if val, ok := filter["province_id"]; ok && val != "" {
		if resolveGeo {
			query = query.Where("province_id = ? OR province_id IS NULL", val)
		} else {
			query = query.Where("province_id = ?", val)
		}
	} else if resolveGeo {
		query = query.Where("province_id IS NULL")
	}
	
	if val, ok := filter["regency_id"]; ok && val != "" {
		if resolveGeo {
			query = query.Where("regency_id = ? OR regency_id IS NULL", val)
		} else {
			query = query.Where("regency_id = ?", val)
		}
	} else if resolveGeo {
		query = query.Where("regency_id IS NULL")
	}
	
	if val, ok := filter["district_id"]; ok && val != "" {
		if resolveGeo {
			query = query.Where("district_id = ? OR district_id IS NULL", val)
		} else {
			query = query.Where("district_id = ?", val)
		}
	} else if resolveGeo {
		query = query.Where("district_id IS NULL")
	}
	
	err := query.Order("category, name").Find(&components).Error
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

// SalesSchemePrice
func (r *billingConfigRepo) FindAllSalesSchemePrices(filter map[string]interface{}) ([]domain.SalesSchemePrice, error) {
	var prices []domain.SalesSchemePrice
	query := r.db.Model(&domain.SalesSchemePrice{}).
		Preload("SalesScheme").
		Preload("ProductCategory").
		Preload("BusinessType").
		Preload("BusinessScale")
	
	if val, ok := filter["sales_scheme_id"]; ok && val != "" {
		query = query.Where("sales_scheme_id = ?", val)
	}
	if val, ok := filter["business_scale_id"]; ok && val != "" {
		query = query.Where("business_scale_id = ? OR business_scale_id IS NULL", val)
	}
	if val, ok := filter["data_source"]; ok && val != "" {
		query = query.Where("data_source = ?", val)
	}
	if val, ok := filter["product_category_id"]; ok && val != "" {
		query = query.Where("product_category_id = ? OR product_category_id IS NULL", val)
	}
	if val, ok := filter["business_type_id"]; ok && val != "" {
		query = query.Where("business_type_id = ? OR business_type_id IS NULL", val)
	}
	if val, ok := filter["is_active"]; ok {
		query = query.Where("is_active = ?", val)
	}
	
	err := query.Order("sales_scheme_id, data_source").Find(&prices).Error
	return prices, err
}

func (r *billingConfigRepo) CreateSalesSchemePrice(sp *domain.SalesSchemePrice) error {
	return r.db.Create(sp).Error
}

func (r *billingConfigRepo) UpdateSalesSchemePrice(sp *domain.SalesSchemePrice) error {
	return r.db.Save(sp).Error
}

func (r *billingConfigRepo) DeleteSalesSchemePrice(id int64) error {
	return r.db.Delete(&domain.SalesSchemePrice{}, id).Error
}

// SubmissionCostDetail
func (r *billingConfigRepo) SaveSubmissionCostDetail(detail *domain.SubmissionCostDetail) error {
	// Use clause.OnConflict to update if exists
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "submission_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"product_category_id", "business_type_id", "business_scale_id", "halal_agency_id", 
			"product_count", "branch_count", "mandays", "total_amount", "cost_breakdown_data", "updated_at",
		}),
	}).Create(detail).Error
}

func (r *billingConfigRepo) GetSubmissionCostDetail(submissionID uuid.UUID) (*domain.SubmissionCostDetail, error) {
	var detail domain.SubmissionCostDetail
	err := r.db.
		Preload("ProductCategory").
		Preload("BusinessType").
		Preload("BusinessScale").
		Where("submission_id = ?", submissionID).
		First(&detail).Error
	if err != nil {
		return nil, err
	}
	return &detail, nil
}
