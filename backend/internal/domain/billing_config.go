package domain

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// SalesScheme represents "Skema Penjualan" (e.g., Direct Sale, Partnership)
type SalesScheme struct {
	ID              int64     `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"not null" json:"name"`
	Description     string    `json:"description"`
	DiscountPercent float64   `gorm:"default:0" json:"discount_percent"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
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
	Name            string    `gorm:"not null" json:"name"` // e.g., "Biaya Pendaftaran BPJPH", "Biaya Audit LPH"
	Category        string    `gorm:"not null;default:'PERSYARATAN_LAIN'" json:"category"` // LPH, PENDAMPINGAN, BPJPH, MUI, PERSYARATAN_LAIN
	Type            string    `gorm:"not null" json:"type"` // FIXED, PER_MANDAY, PER_CABANG, PER_PRODUK
	BaseAmount      float64   `gorm:"not null" json:"base_amount"`
	IsMandatory     bool      `gorm:"default:false" json:"is_mandatory"`
	DiscountPercent float64   `gorm:"default:0" json:"discount_percent"`
	ServiceType     string    `gorm:"not null;default:'REGULER'" json:"service_type"`
	
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
	
	FormFieldConfigID *int64            `json:"form_field_config_id,omitempty"`
	FormFieldConfig   *FormFieldConfig  `gorm:"foreignKey:FormFieldConfigID" json:"form_field_config,omitempty"`

	ProductTiers    string    `gorm:"type:jsonb" json:"product_tiers,omitempty"` // JSON array of ProductTier

	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// ProductTier defines tiered pricing ranges for components that charge per product range
type ProductTier struct {
	MinQty int     `json:"min_qty"`
	MaxQty int     `json:"max_qty"`
	Price  float64 `json:"price"`
}

// CalculateComponentPriceAndMultiplier calculates unit price, total multiplier, and descriptive label.
func CalculateComponentPriceAndMultiplier(compType string, baseAmount float64, productTiersJSON string, productCount, branchCount, customQty int) (float64, int, string) {
	if productCount < 1 {
		productCount = 1
	}
	if branchCount < 1 {
		branchCount = 1
	}
	if customQty < 1 {
		customQty = 1
	}

	unitPrice := baseAmount
	var labels []string
	multiplier := 1

	hasPerProduk := strings.Contains(compType, "PER_PRODUK")
	hasPerCabang := strings.Contains(compType, "PER_CABANG")
	hasPerManday := strings.Contains(compType, "PER_MANDAY")

	if hasPerProduk {
		var tiers []ProductTier
		if productTiersJSON != "" {
			_ = json.Unmarshal([]byte(productTiersJSON), &tiers)
		}
		if len(tiers) > 0 {
			matched := false
			for _, t := range tiers {
				if productCount >= t.MinQty && (t.MaxQty == 0 || productCount <= t.MaxQty) {
					unitPrice = t.Price
					if t.MaxQty > 0 {
						labels = append(labels, fmt.Sprintf("%d-%d Produk", t.MinQty, t.MaxQty))
					} else {
						labels = append(labels, fmt.Sprintf(">%d Produk", t.MinQty))
					}
					matched = true
					break
				}
			}
			if !matched {
				lastTier := tiers[len(tiers)-1]
				if productCount > lastTier.MaxQty && lastTier.MaxQty > 0 {
					unitPrice = lastTier.Price
					labels = append(labels, fmt.Sprintf("%d Produk (Tier Maks)", productCount))
				} else {
					labels = append(labels, fmt.Sprintf("%d Produk", productCount))
				}
			}
		} else {
			multiplier = multiplier * productCount
			labels = append(labels, fmt.Sprintf("%d Produk", productCount))
		}
	}

	if hasPerCabang {
		multiplier = multiplier * branchCount
		labels = append(labels, fmt.Sprintf("%d Cabang", branchCount))
	}

	if hasPerManday {
		multiplier = multiplier * customQty
		if customQty > 1 {
			labels = append(labels, fmt.Sprintf("%d Qty", customQty))
		}
	}

	var labelStr string
	if len(labels) > 0 {
		labelStr = " (" + strings.Join(labels, ", ") + ")"
	}

	return unitPrice, multiplier, labelStr
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
	TotalAmount       float64         `json:"total_amount"`
	
	// Storing a JSON blob of the detailed breakdown to freeze the cost calculation history
	CostBreakdownData string          `gorm:"type:jsonb" json:"cost_breakdown_data"` 
	
	PaymentScheme     string          `gorm:"default:'TERMIN'" json:"payment_scheme"` // "TERMIN" or "FULL"
	DPPercentage      float64         `gorm:"default:70" json:"dp_percentage"`
	
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

// RoleSchemeMapping maps a user role to a default sales scheme.
// When a user with a given role creates a submission, the system auto-assigns the mapped scheme.
type RoleSchemeMapping struct {
	ID            int64       `gorm:"primaryKey" json:"id"`
	RoleName      string      `gorm:"not null;uniqueIndex" json:"role_name"` // e.g. "HALAL_ADVISOR", "MARKETING"
	SalesSchemeID int64       `gorm:"not null" json:"sales_scheme_id"`
	SalesScheme   SalesScheme `gorm:"foreignKey:SalesSchemeID" json:"sales_scheme,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
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

	// RoleSchemeMapping CRUD
	FindAllRoleSchemeMappings() ([]RoleSchemeMapping, error)
	FindRoleSchemeMappingByRole(roleName string) (*RoleSchemeMapping, error)
	CreateRoleSchemeMapping(m *RoleSchemeMapping) error
	UpdateRoleSchemeMapping(m *RoleSchemeMapping) error
	DeleteRoleSchemeMapping(id int64) error

	// SubmissionCostDetail (For Drafter saving calculation)
	SaveSubmissionCostDetail(detail *SubmissionCostDetail) error
	GetSubmissionCostDetail(submissionID uuid.UUID) (*SubmissionCostDetail, error)
}
