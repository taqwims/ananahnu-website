package repository

import (
	"ananahnu/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type voucherRepo struct {
	db *gorm.DB
}

func NewVoucherRepository(db *gorm.DB) domain.VoucherRepository {
	return &voucherRepo{db: db}
}

func (r *voucherRepo) Create(voucher *domain.Voucher) error {
	return r.db.Create(voucher).Error
}

func (r *voucherRepo) CreateBulk(vouchers []domain.Voucher) error {
	if len(vouchers) == 0 {
		return nil
	}
	return r.db.Create(&vouchers).Error
}

func (r *voucherRepo) Update(voucher *domain.Voucher) error {
	return r.db.Save(voucher).Error
}

func (r *voucherRepo) Delete(id int64) error {
	// First delete associated usages or keep usages depending on business logic
	return r.db.Delete(&domain.Voucher{}, id).Error
}

func (r *voucherRepo) FindByID(id int64) (*domain.Voucher, error) {
	var voucher domain.Voucher
	err := r.db.Preload("CreatedBy").First(&voucher, id).Error
	if err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *voucherRepo) FindByCode(code string) (*domain.Voucher, error) {
	var voucher domain.Voucher
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	err := r.db.Where("UPPER(code) = ?", cleanCode).First(&voucher).Error
	if err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *voucherRepo) FindAll(filter map[string]interface{}, page, limit int) ([]domain.Voucher, int64, error) {
	var vouchers []domain.Voucher
	var total int64

	query := r.db.Model(&domain.Voucher{}).Preload("CreatedBy")

	if search, ok := filter["search"].(string); ok && strings.TrimSpace(search) != "" {
		s := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		query = query.Where("LOWER(code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(description) LIKE ?", s, s, s)
	}

	if status, ok := filter["status"].(string); ok && status != "" {
		now := time.Now()
		switch status {
		case "ACTIVE":
			query = query.Where("is_active = true AND valid_from <= ? AND valid_until >= ?", now, now)
		case "EXPIRED":
			query = query.Where("valid_until < ?", now)
		case "INACTIVE":
			query = query.Where("is_active = false")
		case "UPCOMING":
			query = query.Where("valid_from > ?", now)
		}
	}

	if scope, ok := filter["scope"].(string); ok && scope != "" && scope != "ALL" {
		query = query.Where("scope = ? OR scope = 'ALL'", scope)
	}

	if discountType, ok := filter["discount_type"].(string); ok && discountType != "" {
		query = query.Where("discount_type = ?", discountType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && limit > 0 {
		offset := (page - 1) * limit
		query = query.Offset(offset).Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&vouchers).Error
	return vouchers, total, err
}

func (r *voucherRepo) RecordUsage(usage *domain.VoucherUsage) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(usage).Error; err != nil {
			return err
		}

		// Increment voucher used count and total discount
		if err := tx.Model(&domain.Voucher{}).
			Where("id = ?", usage.VoucherID).
			Updates(map[string]interface{}{
				"used_count":     gorm.Expr("used_count + ?", 1),
				"total_discount": gorm.Expr("total_discount + ?", usage.DiscountAmount),
			}).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *voucherRepo) FindUsages(filter map[string]interface{}, page, limit int) ([]domain.VoucherUsage, int64, error) {
	var usages []domain.VoucherUsage
	var total int64

	query := r.db.Model(&domain.VoucherUsage{}).Preload("Voucher").Preload("User")

	if voucherID, ok := filter["voucher_id"].(int64); ok && voucherID > 0 {
		query = query.Where("voucher_id = ?", voucherID)
	}

	if voucherCode, ok := filter["voucher_code"].(string); ok && voucherCode != "" {
		query = query.Where("UPPER(voucher_code) = ?", strings.ToUpper(strings.TrimSpace(voucherCode)))
	}

	if userID, ok := filter["user_id"].(uuid.UUID); ok && userID != uuid.Nil {
		query = query.Where("user_id = ?", userID)
	}

	if search, ok := filter["search"].(string); ok && strings.TrimSpace(search) != "" {
		s := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		query = query.Where("LOWER(voucher_code) LIKE ? OR LOWER(user_name) LIKE ? OR LOWER(user_email) LIKE ? OR LOWER(user_phone) LIKE ? OR LOWER(reference_no) LIKE ?", s, s, s, s, s)
	}

	if startDate, ok := filter["start_date"].(string); ok && startDate != "" {
		query = query.Where("used_at >= ?", startDate+" 00:00:00")
	}

	if endDate, ok := filter["end_date"].(string); ok && endDate != "" {
		query = query.Where("used_at <= ?", endDate+" 23:59:59")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && limit > 0 {
		offset := (page - 1) * limit
		query = query.Offset(offset).Limit(limit)
	}

	err := query.Order("used_at DESC").Find(&usages).Error
	return usages, total, err
}

func (r *voucherRepo) CountUserUsage(voucherID int64, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.VoucherUsage{}).
		Where("voucher_id = ? AND user_id = ? AND status = 'APPLIED'", voucherID, userID).
		Count(&count).Error
	return count, err
}

func (r *voucherRepo) GetAnalyticsSummary() (domain.VoucherAnalyticsSummary, error) {
	var summary domain.VoucherAnalyticsSummary
	now := time.Now()

	// Total Vouchers
	r.db.Model(&domain.Voucher{}).Count(&summary.TotalVouchers)

	// Active Vouchers
	r.db.Model(&domain.Voucher{}).
		Where("is_active = true AND valid_from <= ? AND valid_until >= ?", now, now).
		Count(&summary.ActiveVouchers)

	// Expired Vouchers
	r.db.Model(&domain.Voucher{}).
		Where("valid_until < ?", now).
		Count(&summary.ExpiredVouchers)

	// Usages Stats
	type UsageAgg struct {
		TotalClaims     int64
		TotalDiscount   float64
		TotalGross      float64
		UniqueUsers     int64
	}
	var agg UsageAgg
	r.db.Model(&domain.VoucherUsage{}).
		Where("status = 'APPLIED'").
		Select("COUNT(id) as total_claims, COALESCE(SUM(discount_amount), 0) as total_discount, COALESCE(SUM(original_amount), 0) as total_gross, COUNT(DISTINCT user_id) as unique_users").
		Scan(&agg)

	summary.TotalClaims = agg.TotalClaims
	summary.TotalDiscountAmount = agg.TotalDiscount
	summary.TotalGrossVolume = agg.TotalGross
	summary.TotalUniqueUsers = agg.UniqueUsers

	if summary.TotalClaims > 0 {
		summary.AvgDiscountPerClaim = summary.TotalDiscountAmount / float64(summary.TotalClaims)
	}

	return summary, nil
}

func (r *voucherRepo) GetDailyTrends(days int) ([]domain.VoucherDailyTrend, error) {
	if days <= 0 {
		days = 14
	}

	since := time.Now().AddDate(0, 0, -days)
	
	type DailyRaw struct {
		Day           string
		ClaimCount    int64
		TotalDiscount float64
		TotalVolume   float64
	}
	var raw []DailyRaw

	// Format date by day
	err := r.db.Model(&domain.VoucherUsage{}).
		Where("used_at >= ? AND status = 'APPLIED'", since).
		Select("TO_CHAR(used_at, 'YYYY-MM-DD') as day, COUNT(id) as claim_count, COALESCE(SUM(discount_amount), 0) as total_discount, COALESCE(SUM(original_amount), 0) as total_volume").
		Group("TO_CHAR(used_at, 'YYYY-MM-DD')").
		Order("day ASC").
		Scan(&raw).Error

	if err != nil {
		return nil, err
	}

	// Map raw into trends
	dayMap := make(map[string]domain.VoucherDailyTrend)
	for _, item := range raw {
		dayMap[item.Day] = domain.VoucherDailyTrend{
			Date:          item.Day,
			ClaimCount:    item.ClaimCount,
			TotalDiscount: item.TotalDiscount,
			TotalVolume:   item.TotalVolume,
		}
	}

	// Ensure all days in range are populated
	var trends []domain.VoucherDailyTrend
	for i := days; i >= 0; i-- {
		d := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		if val, exists := dayMap[d]; exists {
			trends = append(trends, val)
		} else {
			trends = append(trends, domain.VoucherDailyTrend{
				Date:          d,
				ClaimCount:    0,
				TotalDiscount: 0,
				TotalVolume:   0,
			})
		}
	}

	return trends, nil
}

func (r *voucherRepo) GetTopVouchers(limit int) ([]domain.TopVoucherStat, error) {
	if limit <= 0 {
		limit = 5
	}

	var results []domain.TopVoucherStat
	err := r.db.Model(&domain.VoucherUsage{}).
		Joins("LEFT JOIN vouchers ON vouchers.id = voucher_usages.voucher_id").
		Where("voucher_usages.status = 'APPLIED'").
		Select("voucher_usages.voucher_id, voucher_usages.voucher_code as code, COALESCE(vouchers.name, voucher_usages.voucher_code) as name, COALESCE(vouchers.discount_type, 'FIXED_AMOUNT') as discount_type, COALESCE(vouchers.discount_value, 0) as discount_value, COUNT(voucher_usages.id) as used_count, COALESCE(SUM(voucher_usages.discount_amount), 0) as total_discount").
		Group("voucher_usages.voucher_id, voucher_usages.voucher_code, vouchers.name, vouchers.discount_type, vouchers.discount_value").
		Order("used_count DESC, total_discount DESC").
		Limit(limit).
		Scan(&results).Error

	return results, err
}

func (r *voucherRepo) GetScopeBreakdown() (map[string]int64, error) {
	type ScopeCount struct {
		Scope string
		Count int64
	}
	var list []ScopeCount

	err := r.db.Model(&domain.Voucher{}).
		Select("scope, count(id) as count").
		Group("scope").
		Scan(&list).Error

	res := make(map[string]int64)
	for _, item := range list {
		if item.Scope == "" {
			item.Scope = "ALL"
		}
		res[item.Scope] = item.Count
	}
	return res, err
}
