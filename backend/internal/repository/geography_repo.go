package repository

import (
	"ananahnu/internal/domain"

	"gorm.io/gorm"
)

// --- GeographyRepository ---

type geographyRepository struct {
	db *gorm.DB
}

func NewGeographyRepository(db *gorm.DB) domain.GeographyRepository {
	return &geographyRepository{db: db}
}

// Province
func (r *geographyRepository) FindAllProvinces() ([]domain.Province, error) {
	var provinces []domain.Province
	if err := r.db.Order("name ASC").Find(&provinces).Error; err != nil {
		return nil, err
	}
	return provinces, nil
}

func (r *geographyRepository) CreateProvince(p *domain.Province) error {
	return r.db.Create(p).Error
}

func (r *geographyRepository) UpdateProvince(p *domain.Province) error {
	return r.db.Save(p).Error
}

func (r *geographyRepository) DeleteProvince(id int64) error {
	return r.db.Delete(&domain.Province{}, id).Error
}

// Regency
func (r *geographyRepository) FindRegenciesByProvince(provinceID int64) ([]domain.Regency, error) {
	var regencies []domain.Regency
	if err := r.db.Where("province_id = ?", provinceID).Order("name ASC").Find(&regencies).Error; err != nil {
		return nil, err
	}
	return regencies, nil
}

func (r *geographyRepository) CreateRegency(reg *domain.Regency) error {
	return r.db.Create(reg).Error
}

func (r *geographyRepository) UpdateRegency(reg *domain.Regency) error {
	return r.db.Save(reg).Error
}

func (r *geographyRepository) DeleteRegency(id int64) error {
	return r.db.Delete(&domain.Regency{}, id).Error
}

// District
func (r *geographyRepository) FindDistrictsByRegency(regencyID int64) ([]domain.District, error) {
	var districts []domain.District
	if err := r.db.Where("regency_id = ?", regencyID).Order("name ASC").Find(&districts).Error; err != nil {
		return nil, err
	}
	return districts, nil
}

func (r *geographyRepository) CreateDistrict(d *domain.District) error {
	return r.db.Create(d).Error
}

func (r *geographyRepository) UpdateDistrict(d *domain.District) error {
	return r.db.Save(d).Error
}

func (r *geographyRepository) DeleteDistrict(id int64) error {
	return r.db.Delete(&domain.District{}, id).Error
}

// --- BillingRateRepository ---

type billingRateRepository struct {
	db *gorm.DB
}

func NewBillingRateRepository(db *gorm.DB) domain.BillingRateRepository {
	return &billingRateRepository{db: db}
}

func (r *billingRateRepository) FindByFilter(serviceType string, regencyID int64, districtID *int64) (*domain.BillingRate, error) {
	var rate domain.BillingRate
	query := r.db.Where("service_type = ? AND regency_id = ?", serviceType, regencyID)
	if districtID != nil {
		query = query.Where("district_id = ?", *districtID)
	} else {
		query = query.Where("district_id IS NULL")
	}
	if err := query.First(&rate).Error; err != nil {
		return nil, err
	}
	return &rate, nil
}

func (r *billingRateRepository) FindAll(serviceType string) ([]domain.BillingRate, error) {
	var rates []domain.BillingRate
	query := r.db.Preload("Regency")
	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}
	if err := query.Order("regency_id ASC").Find(&rates).Error; err != nil {
		return nil, err
	}
	return rates, nil
}

func (r *billingRateRepository) Create(rate *domain.BillingRate) error {
	return r.db.Create(rate).Error
}

func (r *billingRateRepository) Update(rate *domain.BillingRate) error {
	return r.db.Save(rate).Error
}

func (r *billingRateRepository) Delete(id int64) error {
	return r.db.Delete(&domain.BillingRate{}, id).Error
}
