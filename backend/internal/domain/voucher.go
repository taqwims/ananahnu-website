package domain

import (
	"time"

	"github.com/google/uuid"
)

type DiscountType string

const (
	DiscountTypePercentage  DiscountType = "PERCENTAGE"
	DiscountTypeFixedAmount DiscountType = "FIXED_AMOUNT"
)

type VoucherScope string

const (
	VoucherScopeAll         VoucherScope = "ALL"
	VoucherScopeReguler     VoucherScope = "REGULER"
	VoucherScopeSelfDeclare VoucherScope = "SELF_DECLARE"
	VoucherScopeTraining    VoucherScope = "TRAINING"
	VoucherScopeTele        VoucherScope = "TELEMARKETING"
)

// Voucher represents promotional vouchers/coupons
type Voucher struct {
	ID            int64          `gorm:"primaryKey" json:"id"`
	Code          string         `gorm:"uniqueIndex;not null;size:64" json:"code"`
	Name          string         `gorm:"not null;size:255" json:"name"`
	Description   string         `gorm:"type:text" json:"description"`
	DiscountType  DiscountType   `gorm:"not null;default:'FIXED_AMOUNT'" json:"discount_type"` // PERCENTAGE or FIXED_AMOUNT
	DiscountValue float64        `gorm:"not null" json:"discount_value"`                      // 10 (%) or 50000 (IDR)
	MaxDiscount   float64        `gorm:"default:0" json:"max_discount"`                       // Maximum discount cap for percentage (0 = no cap)
	MinSpend      float64        `gorm:"default:0" json:"min_spend"`                          // Minimum invoice/transaction amount (0 = no minimum)
	UsageLimit    int            `gorm:"default:0" json:"usage_limit"`                        // 0 = unlimited
	UsagePerUser  int            `gorm:"default:1" json:"usage_per_user"`                     // Usage limit per user (0 = unlimited)
	UsedCount     int            `gorm:"default:0" json:"used_count"`                         // Number of times used
	TotalDiscount float64        `gorm:"default:0" json:"total_discount"`                     // Total discount given in IDR
	ValidFrom     time.Time      `gorm:"not null" json:"valid_from"`
	ValidUntil    time.Time      `gorm:"not null" json:"valid_until"`
	IsActive      bool           `gorm:"default:true" json:"is_active"`
	Scope         VoucherScope   `gorm:"default:'ALL'" json:"scope"`                          // ALL, REGULER, SELF_DECLARE, TRAINING, TELEMARKETING
	CreatedByID   *uuid.UUID     `gorm:"type:uuid;index" json:"created_by_id,omitempty"`
	CreatedBy     *User          `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	Usages        []VoucherUsage `gorm:"foreignKey:VoucherID" json:"usages,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

// VoucherUsage logs each voucher redemption (who used the voucher)
type VoucherUsage struct {
	ID             int64      `gorm:"primaryKey" json:"id"`
	VoucherID      int64      `gorm:"not null;index" json:"voucher_id"`
	Voucher        *Voucher   `gorm:"foreignKey:VoucherID" json:"voucher,omitempty"`
	VoucherCode    string     `gorm:"not null;index" json:"voucher_code"`
	UserID         *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	User           *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	UserName       string     `json:"user_name"`
	UserEmail      string     `json:"user_email"`
	UserPhone      string     `json:"user_phone"`
	SubmissionID   *uuid.UUID `gorm:"type:uuid;index" json:"submission_id,omitempty"`
	InvoiceID      *int64     `gorm:"index" json:"invoice_id,omitempty"`
	OriginalAmount float64    `gorm:"not null" json:"original_amount"`
	DiscountAmount float64    `gorm:"not null" json:"discount_amount"`
	FinalAmount    float64    `gorm:"not null" json:"final_amount"`
	ReferenceType  string     `gorm:"size:50" json:"reference_type"` // INVOICE, SUBMISSION, TRAINING, MANUAL
	ReferenceNo    string     `gorm:"size:100" json:"reference_no"`
	Status         string     `gorm:"default:'APPLIED'" json:"status"` // APPLIED, CANCELLED, REFUNDED
	UsedAt         time.Time  `json:"used_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// VoucherAnalyticsSummary holds aggregated metrics for KPI display
type VoucherAnalyticsSummary struct {
	TotalVouchers       int64   `json:"total_vouchers"`
	ActiveVouchers      int64   `json:"active_vouchers"`
	ExpiredVouchers     int64   `json:"expired_vouchers"`
	TotalClaims         int64   `json:"total_claims"`
	TotalDiscountAmount float64 `json:"total_discount_amount"`
	TotalGrossVolume    float64 `json:"total_gross_volume"`
	AvgDiscountPerClaim float64 `json:"avg_discount_per_claim"`
	TotalUniqueUsers    int64   `json:"total_unique_users"`
}

// VoucherDailyTrend tracks usage progression over time
type VoucherDailyTrend struct {
	Date          string  `json:"date"`
	ClaimCount    int64   `json:"claim_count"`
	TotalDiscount float64 `json:"total_discount"`
	TotalVolume   float64 `json:"total_volume"`
}

// TopVoucherStat holds individual voucher performance
type TopVoucherStat struct {
	VoucherID     int64   `json:"voucher_id"`
	Code          string  `json:"code"`
	Name          string  `json:"name"`
	DiscountType  string  `json:"discount_type"`
	DiscountValue float64 `json:"discount_value"`
	UsedCount     int64   `json:"used_count"`
	TotalDiscount float64 `json:"total_discount"`
}

// VoucherAnalyticsResponse encompasses full analytics data
type VoucherAnalyticsResponse struct {
	Summary        VoucherAnalyticsSummary `json:"summary"`
	DailyTrend     []VoucherDailyTrend     `json:"daily_trend"`
	TopVouchers    []TopVoucherStat        `json:"top_vouchers"`
	ScopeBreakdown map[string]int64        `json:"scope_breakdown"`
}

// VoucherGenerateRequest holds parameters for bulk code generation
type VoucherGenerateRequest struct {
	Prefix        string       `json:"prefix"`
	Suffix        string       `json:"suffix"`
	Length        int          `json:"length"` // Random characters length (e.g. 6)
	Count         int          `json:"count"`  // Number of vouchers to generate
	Name          string       `json:"name" binding:"required"`
	Description   string       `json:"description"`
	DiscountType  DiscountType `json:"discount_type" binding:"required"`
	DiscountValue float64      `json:"discount_value" binding:"required"`
	MaxDiscount   float64      `json:"max_discount"`
	MinSpend      float64      `json:"min_spend"`
	UsageLimit    int          `json:"usage_limit"`
	UsagePerUser  int          `json:"usage_per_user"`
	ValidFrom     string       `json:"valid_from" binding:"required"`
	ValidUntil    string       `json:"valid_until" binding:"required"`
	Scope         VoucherScope `json:"scope"`
}

// VoucherValidateRequest is used for checking voucher applicability
type VoucherValidateRequest struct {
	Code         string     `json:"code" binding:"required"`
	Amount       float64    `json:"amount" binding:"required"`
	UserID       *uuid.UUID `json:"user_id"`
	ServiceType  string     `json:"service_type"`
	SubmissionID *uuid.UUID `json:"submission_id"`
}

// VoucherValidateResponse returns the calculated discount
type VoucherValidateResponse struct {
	Valid          bool     `json:"valid"`
	Message        string   `json:"message"`
	Voucher        *Voucher `json:"voucher,omitempty"`
	DiscountAmount float64  `json:"discount_amount"`
	FinalAmount    float64  `json:"final_amount"`
}

// VoucherRepository interface
type VoucherRepository interface {
	Create(voucher *Voucher) error
	CreateBulk(vouchers []Voucher) error
	Update(voucher *Voucher) error
	Delete(id int64) error
	FindByID(id int64) (*Voucher, error)
	FindByCode(code string) (*Voucher, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]Voucher, int64, error)

	// Usages
	RecordUsage(usage *VoucherUsage) error
	FindUsages(filter map[string]interface{}, page, limit int) ([]VoucherUsage, int64, error)
	CountUserUsage(voucherID int64, userID uuid.UUID) (int64, error)

	// Analytics
	GetAnalyticsSummary() (VoucherAnalyticsSummary, error)
	GetDailyTrends(days int) ([]VoucherDailyTrend, error)
	GetTopVouchers(limit int) ([]TopVoucherStat, error)
	GetScopeBreakdown() (map[string]int64, error)
}
