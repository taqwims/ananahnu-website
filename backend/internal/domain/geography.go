package domain

// Province represents a province in Indonesia.
type Province struct {
	ID   int64  `gorm:"primaryKey" json:"id"`
	Name string `gorm:"unique;not null" json:"name"`
}

// Regency represents a kabupaten/kota within a province.
type Regency struct {
	ID         int64    `gorm:"primaryKey" json:"id"`
	ProvinceID int64    `gorm:"index" json:"province_id"`
	Province   Province `gorm:"foreignKey:ProvinceID" json:"province,omitempty"`
	Name       string   `gorm:"not null" json:"name"`
}

// District represents a kecamatan within a regency.
type District struct {
	ID        int64   `gorm:"primaryKey" json:"id"`
	RegencyID int64   `gorm:"index" json:"regency_id"`
	Regency   Regency `gorm:"foreignKey:RegencyID" json:"regency,omitempty"`
	Name      string  `gorm:"not null" json:"name"`
}

// BillingRate defines the billing amount per geography and service type.
type BillingRate struct {
	ID          int64   `gorm:"primaryKey" json:"id"`
	ServiceType string  `gorm:"not null;index" json:"service_type"` // REGULER, SELF_DECLARE
	RegencyID   int64   `gorm:"index" json:"regency_id"`
	Regency     Regency `gorm:"foreignKey:RegencyID" json:"regency,omitempty"`
	DistrictID  *int64  `json:"district_id,omitempty"` // Optional for more specific rate
	Amount      float64 `gorm:"not null" json:"amount"`
	Description string  `json:"description"`
}

type GeographyRepository interface {
	// Province
	FindAllProvinces() ([]Province, error)
	CreateProvince(p *Province) error
	UpdateProvince(p *Province) error
	DeleteProvince(id int64) error

	// Regency
	FindRegenciesByProvince(provinceID int64) ([]Regency, error)
	CreateRegency(r *Regency) error
	UpdateRegency(r *Regency) error
	DeleteRegency(id int64) error

	// District
	FindDistrictsByRegency(regencyID int64) ([]District, error)
	CreateDistrict(d *District) error
	UpdateDistrict(d *District) error
	DeleteDistrict(id int64) error
}

type BillingRateRepository interface {
	FindByFilter(serviceType string, regencyID int64, districtID *int64) (*BillingRate, error)
	FindAll(serviceType string) ([]BillingRate, error)
	Create(rate *BillingRate) error
	Update(rate *BillingRate) error
	Delete(id int64) error
}
