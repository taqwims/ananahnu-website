package domain

import (
	"time"

	"github.com/google/uuid"
)

// SalesScheme represents "Skema Penjualan" (e.g., Direct Sale, Partnership)
type SalesScheme struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BusinessType represents "Jenis Bidang"
type BusinessType struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ProductCategory represents "Jenis Produk"
type ProductCategory struct {
	ID             int64        `gorm:"primaryKey" json:"id"`
	BusinessTypeID *int64        `json:"business_type_id"`
	BusinessType   BusinessType `gorm:"foreignKey:BusinessTypeID" json:"business_type,omitempty"`
	Name           string       `gorm:"not null" json:"name"`
	Description    string       `json:"description"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

// BusinessScale represents "Skala Usaha"
type BusinessScale struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"` // Mikro, Kecil, Menengah, Besar
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}


// BillingComponent represents the dynamic cost items (e.g. Pendaftaran, Penetapan, Pendampingan).
// Admin can configure base prices per business type and product category.
type BillingComponent struct {
	ID              int64     `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"not null" json:"name"` // e.g., "Biaya Pendaftaran", "Biaya Penetapan"
	Category        string    `gorm:"not null;default:'OPSIONAL'" json:"category"` // REGISTRASI, PENETAPAN, PENDAMPINGAN, BPJPH, MUI, OPSIONAL
	Type            string    `gorm:"not null" json:"type"` // FIXED, PER_MANDAY, PER_CABANG, PER_PRODUK
	BaseAmount      float64   `gorm:"not null" json:"base_amount"`
	IsMandatory     bool      `gorm:"default:false" json:"is_mandatory"`
	
	// Scoping: which business type + product category this component applies to
	BusinessScaleID   *int64    `json:"business_scale_id,omitempty"`
	ProvinceID        *int64    `json:"province_id,omitempty"`
	RegencyID         *int64    `json:"regency_id,omitempty"`
	DistrictID        *int64    `json:"district_id,omitempty"`
	BusinessTypeID    *int64    `json:"business_type_id,omitempty"`
	ProductCategoryID *int64    `json:"product_category_id,omitempty"`
	
	SalesSchemeID     *int64       `json:"sales_scheme_id,omitempty"`
	SalesScheme       *SalesScheme `gorm:"foreignKey:SalesSchemeID" json:"sales_scheme,omitempty"`
	DataSource        string       `gorm:"default:'ORGANIK'" json:"data_source"` // ORGANIK, MARKETING, BOTH
	
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// SalesSchemePrice stores configured prices per sales scheme, product, business type, and data source.
// This enables differential pricing: Direct Sale vs Partnership, Marketing vs Organic.
type SalesSchemePrice struct {
	ID                int64        `gorm:"primaryKey" json:"id"`
	SalesSchemeID     int64        `gorm:"not null;index" json:"sales_scheme_id"`
	SalesScheme       SalesScheme  `gorm:"foreignKey:SalesSchemeID" json:"sales_scheme,omitempty"`
	ProductCategoryID *int64       `json:"product_category_id,omitempty"`
	ProductCategory   *ProductCategory `gorm:"foreignKey:ProductCategoryID" json:"product_category,omitempty"`
	BusinessTypeID    *int64       `json:"business_type_id,omitempty"`
	BusinessType      *BusinessType `gorm:"foreignKey:BusinessTypeID" json:"business_type,omitempty"`
	BusinessScaleID   *int64       `json:"business_scale_id,omitempty"`
	BusinessScale     *BusinessScale `gorm:"foreignKey:BusinessScaleID" json:"business_scale,omitempty"`
	DataSource        string       `gorm:"not null;default:'ORGANIK'" json:"data_source"` // ORGANIK, MARKETING, BOTH
	BasePrice         float64      `gorm:"not null" json:"base_price"`
	DiscountPercent   float64      `gorm:"default:0" json:"discount_percent"` // e.g. 10% for Partnership pendampingan
	Description       string       `json:"description"`
	IsActive          bool         `gorm:"default:true" json:"is_active"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

// SubmissionCostDetail saves the result of the Drafter's calculation for a Submission.
type SubmissionCostDetail struct {
	ID                int64           `gorm:"primaryKey" json:"id"`
	SubmissionID      uuid.UUID       `gorm:"type:uuid;uniqueIndex" json:"submission_id"`
	Submission        Submission      `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`
	
	ProductCategoryID *int64          `json:"product_category_id"`
	ProductCategory   ProductCategory `gorm:"foreignKey:ProductCategoryID" json:"product_category,omitempty"`
	
	BusinessTypeID    *int64          `json:"business_type_id"`
	BusinessType      BusinessType    `gorm:"foreignKey:BusinessTypeID" json:"business_type,omitempty"`
	
	BusinessScaleID   *int64          `json:"business_scale_id"`
	BusinessScale     BusinessScale   `gorm:"foreignKey:BusinessScaleID" json:"business_scale,omitempty"`
	
	ProvinceID        *int64          `json:"province_id"`
	Province          Province        `gorm:"foreignKey:ProvinceID" json:"province,omitempty"`
	RegencyID         *int64          `json:"regency_id"`
	Regency           Regency         `gorm:"foreignKey:RegencyID" json:"regency,omitempty"`
	DistrictID        *int64          `json:"district_id"`
	District          District        `gorm:"foreignKey:DistrictID" json:"district,omitempty"`
	
	ProductCount      int             `json:"product_count"`
	BranchCount       int             `json:"branch_count"`
	Mandays           int             `json:"mandays"`
	TotalAmount       float64         `json:"total_amount"`
	
	// Storing a JSON blob of the detailed breakdown to freeze the cost calculation history
	CostBreakdownData string          `gorm:"type:jsonb" json:"cost_breakdown_data"` 
	
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

// BillingConfigRepository Interface
type BillingConfigRepository interface {
	// SalesScheme CRUD
	FindAllSalesSchemes() ([]SalesScheme, error)
	CreateSalesScheme(ss *SalesScheme) error
	UpdateSalesScheme(ss *SalesScheme) error
	DeleteSalesScheme(id int64) error

	// BusinessType CRUD
	FindAllBusinessTypes() ([]BusinessType, error)
	CreateBusinessType(bt *BusinessType) error
	UpdateBusinessType(bt *BusinessType) error
	DeleteBusinessType(id int64) error

	// ProductCategory CRUD
	FindAllProductCategories(filter map[string]interface{}) ([]ProductCategory, error)
	CreateProductCategory(pc *ProductCategory) error
	UpdateProductCategory(pc *ProductCategory) error
	DeleteProductCategory(id int64) error

	// BusinessScale CRUD
	FindAllBusinessScales() ([]BusinessScale, error)
	CreateBusinessScale(bs *BusinessScale) error
	UpdateBusinessScale(bs *BusinessScale) error
	DeleteBusinessScale(id int64) error


	// BillingComponent CRUD (filter supports: type, category, business_type_id, product_category_id)
	FindAllBillingComponents(filter map[string]interface{}) ([]BillingComponent, error)
	CreateBillingComponent(bc *BillingComponent) error
	UpdateBillingComponent(bc *BillingComponent) error
	DeleteBillingComponent(id int64) error

	// SalesSchemePrice CRUD
	FindAllSalesSchemePrices(filter map[string]interface{}) ([]SalesSchemePrice, error)
	CreateSalesSchemePrice(sp *SalesSchemePrice) error
	UpdateSalesSchemePrice(sp *SalesSchemePrice) error
	DeleteSalesSchemePrice(id int64) error

	// SubmissionCostDetail (For Drafter saving calculation)
	SaveSubmissionCostDetail(detail *SubmissionCostDetail) error
	GetSubmissionCostDetail(submissionID uuid.UUID) (*SubmissionCostDetail, error)
}
