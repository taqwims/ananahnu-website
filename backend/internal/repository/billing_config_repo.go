package repository

import (
	"fmt"

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
	query := r.db.Model(&domain.BillingComponent{}).Preload("FormFieldConfig")
	
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
	if val, ok := filter["data_source"]; ok && val != "" {
		query = query.Where("data_source = ? OR data_source = 'BOTH'", val)
	}
	if val, ok := filter["service_type"]; ok && val != "" {
		st := fmt.Sprintf("%v", val)
		if st == "REGULER" {
			query = query.Where("service_type = 'REGULER' OR service_type = 'BOTH' OR service_type = 'ALL' OR service_type = '' OR service_type IS NULL")
		} else {
			query = query.Where("service_type = ? OR service_type = 'BOTH' OR service_type = 'ALL'", st)
		}
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

// SubmissionCostDetail
func (r *billingConfigRepo) SaveSubmissionCostDetail(detail *domain.SubmissionCostDetail) error {
	// Use clause.OnConflict to update if exists
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "submission_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"product_category_id", "business_type_id", "business_scale_id",
			"province_id", "regency_id", "district_id",
			"product_count", "branch_count", "total_amount", "cost_breakdown_data",
			"payment_scheme", "dp_percentage", "updated_at",
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
