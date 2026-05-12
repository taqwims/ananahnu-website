package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- FormConfigRepository ---

type formConfigRepository struct {
	db *gorm.DB
}

func NewFormConfigRepository(db *gorm.DB) domain.FormConfigRepository {
	return &formConfigRepository{db: db}
}

func (r *formConfigRepository) FindByFormType(formType string) ([]domain.FormFieldConfig, error) {
	var configs []domain.FormFieldConfig
	if err := r.db.Where("form_type = ?", formType).Order("sort_order ASC").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *formConfigRepository) FindByFormTypeAndBusinessType(formType string, businessTypeID *int64) ([]domain.FormFieldConfig, error) {
	var configs []domain.FormFieldConfig
	query := r.db.Where("form_type = ?", formType)
	if businessTypeID != nil {
		query = query.Where("business_type_id = ? OR business_type_id IS NULL", *businessTypeID)
	}
	if err := query.Order("sort_order ASC").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *formConfigRepository) FindByID(id int64) (*domain.FormFieldConfig, error) {
	var config domain.FormFieldConfig
	if err := r.db.First(&config, id).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *formConfigRepository) Create(config *domain.FormFieldConfig) error {
	return r.db.Create(config).Error
}

func (r *formConfigRepository) Update(config *domain.FormFieldConfig) error {
	return r.db.Save(config).Error
}

func (r *formConfigRepository) Delete(id int64) error {
	return r.db.Delete(&domain.FormFieldConfig{}, id).Error
}

// --- FormFieldValueRepository ---

type formFieldValueRepository struct {
	db *gorm.DB
}

func NewFormFieldValueRepository(db *gorm.DB) domain.FormFieldValueRepository {
	return &formFieldValueRepository{db: db}
}

func (r *formFieldValueRepository) FindBySubmissionID(submissionID uuid.UUID) ([]domain.FormFieldValue, error) {
	var values []domain.FormFieldValue
	if err := r.db.Preload("FormField").Where("submission_id = ?", submissionID).Find(&values).Error; err != nil {
		return nil, err
	}
	return values, nil
}

func (r *formFieldValueRepository) Create(value *domain.FormFieldValue) error {
	return r.db.Create(value).Error
}

func (r *formFieldValueRepository) CreateBulk(values []domain.FormFieldValue) error {
	if len(values) == 0 {
		return nil
	}
	return r.db.Create(&values).Error
}

func (r *formFieldValueRepository) DeleteBySubmissionID(submissionID uuid.UUID) error {
	return r.db.Where("submission_id = ?", submissionID).Delete(&domain.FormFieldValue{}).Error
}
