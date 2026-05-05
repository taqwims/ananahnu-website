package domain

import (
	"time"

	"github.com/google/uuid"
)

// ProductCategory represents "Jenis Produk"
type ProductCategory struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BusinessScale represents "Skala Usaha"
type BusinessScale struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"` // Mikro, Kecil, Menengah, Besar
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// HalalAgency represents "LPH" (Lembaga Pemeriksa Halal)
type HalalAgency struct {
	ID        int64     `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BillingComponent represents the dynamic cost items (e.g. Unit Cost, Transportasi, Akomodasi).
// Admin can configure base prices.
type BillingComponent struct {
	ID              int64     `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"not null" json:"name"` // e.g., "Operasional", "Tiket Pesawat", "Mandays Unit Cost"
	Type            string    `gorm:"not null" json:"type"` // FIXED, PER_MANDAY, PER_CABANG, PER_PRODUK
	BaseAmount      float64   `gorm:"not null" json:"base_amount"`
	
	// Optional relationships for overriding logic if needed
	BusinessScaleID *int64    `json:"business_scale_id,omitempty"`
	HalalAgencyID   *int64    `json:"halal_agency_id,omitempty"`
	ProvinceID      *int64    `json:"province_id,omitempty"`
	
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// SubmissionCostDetail saves the result of the Drafter's calculation for a Submission.
type SubmissionCostDetail struct {
	ID                int64           `gorm:"primaryKey" json:"id"`
	SubmissionID      uuid.UUID       `gorm:"type:uuid;uniqueIndex" json:"submission_id"`
	Submission        Submission      `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`
	
	ProductCategoryID *int64          `json:"product_category_id"`
	ProductCategory   ProductCategory `gorm:"foreignKey:ProductCategoryID" json:"product_category,omitempty"`
	
	BusinessScaleID   *int64          `json:"business_scale_id"`
	BusinessScale     BusinessScale   `gorm:"foreignKey:BusinessScaleID" json:"business_scale,omitempty"`
	
	HalalAgencyID     *int64          `json:"halal_agency_id"`
	HalalAgency       HalalAgency     `gorm:"foreignKey:HalalAgencyID" json:"halal_agency,omitempty"`
	
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
	// ProductCategory CRUD
	FindAllProductCategories() ([]ProductCategory, error)
	CreateProductCategory(pc *ProductCategory) error
	UpdateProductCategory(pc *ProductCategory) error
	DeleteProductCategory(id int64) error

	// BusinessScale CRUD
	FindAllBusinessScales() ([]BusinessScale, error)
	CreateBusinessScale(bs *BusinessScale) error
	UpdateBusinessScale(bs *BusinessScale) error
	DeleteBusinessScale(id int64) error

	// HalalAgency CRUD
	FindAllHalalAgencies() ([]HalalAgency, error)
	CreateHalalAgency(ha *HalalAgency) error
	UpdateHalalAgency(ha *HalalAgency) error
	DeleteHalalAgency(id int64) error

	// BillingComponent CRUD
	FindAllBillingComponents(filter map[string]interface{}) ([]BillingComponent, error)
	CreateBillingComponent(bc *BillingComponent) error
	UpdateBillingComponent(bc *BillingComponent) error
	DeleteBillingComponent(id int64) error

	// SubmissionCostDetail (For Drafter saving calculation)
	SaveSubmissionCostDetail(detail *SubmissionCostDetail) error
	GetSubmissionCostDetail(submissionID uuid.UUID) (*SubmissionCostDetail, error)
}
