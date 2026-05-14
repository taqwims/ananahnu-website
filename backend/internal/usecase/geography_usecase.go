package usecase

import (
	"ananahnu/internal/domain"
)

type GeographyUsecase interface {
	// Province
	GetProvinces() ([]domain.Province, error)
	CreateProvince(name string) (*domain.Province, error)
	UpdateProvince(id int64, name string) error
	DeleteProvince(id int64) error

	// Regency
	GetRegencies(provinceID int64) ([]domain.Regency, error)
	CreateRegency(provinceID int64, name string) (*domain.Regency, error)
	UpdateRegency(id int64, name string) error
	DeleteRegency(id int64) error

	// District
	GetDistricts(regencyID int64) ([]domain.District, error)
	CreateDistrict(regencyID int64, name string) (*domain.District, error)
	UpdateDistrict(id int64, name string) error
	DeleteDistrict(id int64) error

	// Billing Rates
	GetBillingRates(serviceType string) ([]domain.BillingRate, error)
	GetBillingRate(serviceType string, regencyID int64, districtID *int64) (*domain.BillingRate, error)
	CreateBillingRate(rate *domain.BillingRate) error
	UpdateBillingRate(rate *domain.BillingRate) error
	DeleteBillingRate(id int64) error
}

type GeographyUsecaseDeps struct {
	GeoRepo  domain.GeographyRepository
	RateRepo domain.BillingRateRepository
}

type geographyUsecase struct {
	GeographyUsecaseDeps
}

func NewGeographyUsecase(deps GeographyUsecaseDeps) GeographyUsecase {
	return &geographyUsecase{
		GeographyUsecaseDeps: deps,
	}
}

// Province
func (uc *geographyUsecase) GetProvinces() ([]domain.Province, error) {
	return uc.GeoRepo.FindAllProvinces()
}

func (uc *geographyUsecase) CreateProvince(name string) (*domain.Province, error) {
	p := &domain.Province{Name: name}
	if err := uc.GeoRepo.CreateProvince(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (uc *geographyUsecase) UpdateProvince(id int64, name string) error {
	return uc.GeoRepo.UpdateProvince(&domain.Province{ID: id, Name: name})
}

func (uc *geographyUsecase) DeleteProvince(id int64) error {
	return uc.GeoRepo.DeleteProvince(id)
}

// Regency
func (uc *geographyUsecase) GetRegencies(provinceID int64) ([]domain.Regency, error) {
	return uc.GeoRepo.FindRegenciesByProvince(provinceID)
}

func (uc *geographyUsecase) CreateRegency(provinceID int64, name string) (*domain.Regency, error) {
	r := &domain.Regency{ProvinceID: provinceID, Name: name}
	if err := uc.GeoRepo.CreateRegency(r); err != nil {
		return nil, err
	}
	return r, nil
}

func (uc *geographyUsecase) UpdateRegency(id int64, name string) error {
	return uc.GeoRepo.UpdateRegency(&domain.Regency{ID: id, Name: name})
}

func (uc *geographyUsecase) DeleteRegency(id int64) error {
	return uc.GeoRepo.DeleteRegency(id)
}

// District
func (uc *geographyUsecase) GetDistricts(regencyID int64) ([]domain.District, error) {
	return uc.GeoRepo.FindDistrictsByRegency(regencyID)
}

func (uc *geographyUsecase) CreateDistrict(regencyID int64, name string) (*domain.District, error) {
	d := &domain.District{RegencyID: regencyID, Name: name}
	if err := uc.GeoRepo.CreateDistrict(d); err != nil {
		return nil, err
	}
	return d, nil
}

func (uc *geographyUsecase) UpdateDistrict(id int64, name string) error {
	return uc.GeoRepo.UpdateDistrict(&domain.District{ID: id, Name: name})
}

func (uc *geographyUsecase) DeleteDistrict(id int64) error {
	return uc.GeoRepo.DeleteDistrict(id)
}

// Billing Rates
func (uc *geographyUsecase) GetBillingRates(serviceType string) ([]domain.BillingRate, error) {
	return uc.RateRepo.FindAll(serviceType)
}

func (uc *geographyUsecase) GetBillingRate(serviceType string, regencyID int64, districtID *int64) (*domain.BillingRate, error) {
	return uc.RateRepo.FindByFilter(serviceType, regencyID, districtID)
}

func (uc *geographyUsecase) CreateBillingRate(rate *domain.BillingRate) error {
	return uc.RateRepo.Create(rate)
}

func (uc *geographyUsecase) UpdateBillingRate(rate *domain.BillingRate) error {
	return uc.RateRepo.Update(rate)
}

func (uc *geographyUsecase) DeleteBillingRate(id int64) error {
	return uc.RateRepo.Delete(id)
}
