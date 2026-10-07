package usecase

import (
	"ananahnu/internal/domain"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
)

type VoucherUsecase interface {
	CreateVoucher(voucher *domain.Voucher, creatorID *uuid.UUID) (*domain.Voucher, error)
	GenerateVouchers(req domain.VoucherGenerateRequest, creatorID *uuid.UUID) ([]domain.Voucher, error)
	UpdateVoucher(id int64, req *domain.Voucher) (*domain.Voucher, error)
	ToggleVoucherStatus(id int64) (*domain.Voucher, error)
	DeleteVoucher(id int64) error
	GetVoucherByID(id int64) (*domain.Voucher, error)
	GetVoucherByCode(code string) (*domain.Voucher, error)
	ListVouchers(filter map[string]interface{}, page, limit int) ([]domain.Voucher, int64, error)
	
	ValidateVoucher(req domain.VoucherValidateRequest) (*domain.VoucherValidateResponse, error)
	ApplyVoucher(code string, amount float64, user *domain.User, refType string, refNo string, submissionID *uuid.UUID, invoiceID *int64) (*domain.VoucherUsage, error)
	
	ListUsages(filter map[string]interface{}, page, limit int) ([]domain.VoucherUsage, int64, error)
	GetAnalytics(days int) (*domain.VoucherAnalyticsResponse, error)
}

type voucherUsecase struct {
	repo     domain.VoucherRepository
	userRepo domain.UserRepository
}

func NewVoucherUsecase(repo domain.VoucherRepository, userRepo domain.UserRepository) VoucherUsecase {
	return &voucherUsecase{
		repo:     repo,
		userRepo: userRepo,
	}
}

func (u *voucherUsecase) CreateVoucher(voucher *domain.Voucher, creatorID *uuid.UUID) (*domain.Voucher, error) {
	voucher.Code = strings.ToUpper(strings.TrimSpace(voucher.Code))
	if voucher.Code == "" {
		return nil, errors.New("kode voucher tidak boleh kosong")
	}
	if voucher.Name == "" {
		return nil, errors.New("nama voucher tidak boleh kosong")
	}
	if voucher.DiscountValue <= 0 {
		return nil, errors.New("nilai diskon harus lebih besar dari 0")
	}
	if voucher.DiscountType == domain.DiscountTypePercentage && voucher.DiscountValue > 100 {
		return nil, errors.New("persentase diskon tidak boleh lebih dari 100%")
	}
	if voucher.ValidFrom.IsZero() {
		voucher.ValidFrom = time.Now()
	}
	if voucher.ValidUntil.IsZero() || voucher.ValidUntil.Before(voucher.ValidFrom) {
		return nil, errors.New("tanggal berakhir voucher harus setelah tanggal mulai")
	}

	// Check existing code
	existing, _ := u.repo.FindByCode(voucher.Code)
	if existing != nil {
		return nil, fmt.Errorf("kode voucher '%s' sudah digunakan", voucher.Code)
	}

	voucher.CreatedByID = creatorID
	voucher.CreatedAt = time.Now()
	voucher.UpdatedAt = time.Now()

	if err := u.repo.Create(voucher); err != nil {
		return nil, err
	}

	return u.repo.FindByID(voucher.ID)
}

const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Avoid confusing chars like 0/O, 1/I

func generateRandomString(n int) string {
	b := make([]byte, n)
	for i := range b {
		idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[idx.Int64()]
	}
	return string(b)
}

func (u *voucherUsecase) GenerateVouchers(req domain.VoucherGenerateRequest, creatorID *uuid.UUID) ([]domain.Voucher, error) {
	if req.Count <= 0 {
		req.Count = 1
	}
	if req.Count > 500 {
		return nil, errors.New("maksimal generate voucher dalam satu waktu adalah 500")
	}
	if req.Length <= 0 {
		req.Length = 6
	}

	validFrom, err := time.Parse("2006-01-02", req.ValidFrom)
	if err != nil {
		validFrom, err = time.Parse(time.RFC3339, req.ValidFrom)
		if err != nil {
			validFrom = time.Now()
		}
	}

	validUntil, err := time.Parse("2006-01-02", req.ValidUntil)
	if err != nil {
		validUntil, err = time.Parse(time.RFC3339, req.ValidUntil)
		if err != nil {
			validUntil = time.Now().AddDate(0, 1, 0)
		}
	}
	// End of the day for validUntil
	validUntil = time.Date(validUntil.Year(), validUntil.Month(), validUntil.Day(), 23, 59, 59, 0, validUntil.Location())

	if validUntil.Before(validFrom) {
		return nil, errors.New("tanggal berakhir voucher harus setelah tanggal mulai")
	}

	now := time.Now()
	var vouchers []domain.Voucher
	prefix := strings.ToUpper(strings.TrimSpace(req.Prefix))
	suffix := strings.ToUpper(strings.TrimSpace(req.Suffix))

	scope := req.Scope
	if scope == "" {
		scope = domain.VoucherScopeAll
	}

	for i := 0; i < req.Count; i++ {
		var uniqueCode string
		for attempts := 0; attempts < 10; attempts++ {
			randPart := generateRandomString(req.Length)
			code := prefix + randPart + suffix
			if existing, _ := u.repo.FindByCode(code); existing == nil {
				uniqueCode = code
				break
			}
		}

		if uniqueCode == "" {
			return nil, errors.New("gagal membuat kode unik, silakan coba lagi dengan prefix atau panjang karakter berbeda")
		}

		v := domain.Voucher{
			Code:          uniqueCode,
			Name:          req.Name,
			Description:   req.Description,
			DiscountType:  req.DiscountType,
			DiscountValue: req.DiscountValue,
			MaxDiscount:   req.MaxDiscount,
			MinSpend:      req.MinSpend,
			UsageLimit:    req.UsageLimit,
			UsagePerUser:  req.UsagePerUser,
			ValidFrom:     validFrom,
			ValidUntil:    validUntil,
			IsActive:      true,
			Scope:         scope,
			CreatedByID:   creatorID,
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		vouchers = append(vouchers, v)
	}

	if err := u.repo.CreateBulk(vouchers); err != nil {
		return nil, err
	}

	return vouchers, nil
}

func (u *voucherUsecase) UpdateVoucher(id int64, req *domain.Voucher) (*domain.Voucher, error) {
	existing, err := u.repo.FindByID(id)
	if err != nil || existing == nil {
		return nil, errors.New("voucher tidak ditemukan")
	}

	if req.Code != "" {
		newCode := strings.ToUpper(strings.TrimSpace(req.Code))
		if newCode != existing.Code {
			check, _ := u.repo.FindByCode(newCode)
			if check != nil && check.ID != existing.ID {
				return nil, fmt.Errorf("kode voucher '%s' sudah digunakan", newCode)
			}
			existing.Code = newCode
		}
	}

	if req.Name != "" {
		existing.Name = req.Name
	}
	existing.Description = req.Description
	if req.DiscountType != "" {
		existing.DiscountType = req.DiscountType
	}
	if req.DiscountValue > 0 {
		existing.DiscountValue = req.DiscountValue
	}
	existing.MaxDiscount = req.MaxDiscount
	existing.MinSpend = req.MinSpend
	existing.UsageLimit = req.UsageLimit
	existing.UsagePerUser = req.UsagePerUser
	if !req.ValidFrom.IsZero() {
		existing.ValidFrom = req.ValidFrom
	}
	if !req.ValidUntil.IsZero() {
		existing.ValidUntil = req.ValidUntil
	}
	if req.Scope != "" {
		existing.Scope = req.Scope
	}
	existing.IsActive = req.IsActive
	existing.UpdatedAt = time.Now()

	if err := u.repo.Update(existing); err != nil {
		return nil, err
	}

	return u.repo.FindByID(id)
}

func (u *voucherUsecase) ToggleVoucherStatus(id int64) (*domain.Voucher, error) {
	existing, err := u.repo.FindByID(id)
	if err != nil || existing == nil {
		return nil, errors.New("voucher tidak ditemukan")
	}

	existing.IsActive = !existing.IsActive
	existing.UpdatedAt = time.Now()

	if err := u.repo.Update(existing); err != nil {
		return nil, err
	}

	return existing, nil
}

func (u *voucherUsecase) DeleteVoucher(id int64) error {
	existing, err := u.repo.FindByID(id)
	if err != nil || existing == nil {
		return errors.New("voucher tidak ditemukan")
	}
	return u.repo.Delete(id)
}

func (u *voucherUsecase) GetVoucherByID(id int64) (*domain.Voucher, error) {
	return u.repo.FindByID(id)
}

func (u *voucherUsecase) GetVoucherByCode(code string) (*domain.Voucher, error) {
	return u.repo.FindByCode(code)
}

func (u *voucherUsecase) ListVouchers(filter map[string]interface{}, page, limit int) ([]domain.Voucher, int64, error) {
	return u.repo.FindAll(filter, page, limit)
}

func (u *voucherUsecase) ValidateVoucher(req domain.VoucherValidateRequest) (*domain.VoucherValidateResponse, error) {
	code := strings.ToUpper(strings.TrimSpace(req.Code))
	if code == "" {
		return &domain.VoucherValidateResponse{Valid: false, Message: "Kode voucher tidak boleh kosong"}, nil
	}

	voucher, err := u.repo.FindByCode(code)
	if err != nil || voucher == nil {
		return &domain.VoucherValidateResponse{Valid: false, Message: "Kode voucher tidak valid atau tidak ditemukan"}, nil
	}

	// 1. Is active?
	if !voucher.IsActive {
		return &domain.VoucherValidateResponse{Valid: false, Message: "Voucher ini sedang tidak aktif"}, nil
	}

	now := time.Now()
	// 2. Validity date
	if now.Before(voucher.ValidFrom) {
		return &domain.VoucherValidateResponse{Valid: false, Message: fmt.Sprintf("Voucher baru dapat digunakan mulai %s", voucher.ValidFrom.Format("02 Jan 2006"))}, nil
	}
	if now.After(voucher.ValidUntil) {
		return &domain.VoucherValidateResponse{Valid: false, Message: "Masa berlaku voucher telah berakhir (kedaluwarsa)"}, nil
	}

	// 3. Overall usage limit
	if voucher.UsageLimit > 0 && voucher.UsedCount >= voucher.UsageLimit {
		return &domain.VoucherValidateResponse{Valid: false, Message: "Kuota penggunaan voucher telah habis"}, nil
	}

	// 4. Per-user usage limit
	if req.UserID != nil && *req.UserID != uuid.Nil && voucher.UsagePerUser > 0 {
		userCount, err := u.repo.CountUserUsage(voucher.ID, *req.UserID)
		if err == nil && int(userCount) >= voucher.UsagePerUser {
			return &domain.VoucherValidateResponse{Valid: false, Message: fmt.Sprintf("Anda telah mencapai batas maksimal (%d kali) penggunaan voucher ini", voucher.UsagePerUser)}, nil
		}
	}

	// 5. Minimum spend
	if voucher.MinSpend > 0 && req.Amount < voucher.MinSpend {
		return &domain.VoucherValidateResponse{Valid: false, Message: fmt.Sprintf("Minimal transaksi untuk menggunakan voucher ini adalah Rp %s", formatRupiah(voucher.MinSpend))}, nil
	}

	// 6. Scope check
	if voucher.Scope != "" && voucher.Scope != domain.VoucherScopeAll && req.ServiceType != "" {
		if string(voucher.Scope) != req.ServiceType {
			return &domain.VoucherValidateResponse{Valid: false, Message: fmt.Sprintf("Voucher hanya berlaku untuk layanan %s", voucher.Scope)}, nil
		}
	}

	// Calculate discount
	var discount float64
	if voucher.DiscountType == domain.DiscountTypePercentage {
		discount = (voucher.DiscountValue / 100.0) * req.Amount
		if voucher.MaxDiscount > 0 && discount > voucher.MaxDiscount {
			discount = voucher.MaxDiscount
		}
	} else {
		discount = voucher.DiscountValue
	}

	if discount > req.Amount {
		discount = req.Amount
	}

	finalAmount := req.Amount - discount

	return &domain.VoucherValidateResponse{
		Valid:          true,
		Message:        "Voucher berhasil diterapkan!",
		Voucher:        voucher,
		DiscountAmount: discount,
		FinalAmount:    finalAmount,
	}, nil
}

func (u *voucherUsecase) ApplyVoucher(code string, amount float64, user *domain.User, refType string, refNo string, submissionID *uuid.UUID, invoiceID *int64) (*domain.VoucherUsage, error) {
	var uid *uuid.UUID
	if user != nil && user.ID != uuid.Nil {
		uid = &user.ID
	}

	valRes, err := u.ValidateVoucher(domain.VoucherValidateRequest{
		Code:         code,
		Amount:       amount,
		UserID:       uid,
		SubmissionID: submissionID,
	})

	if err != nil {
		return nil, err
	}
	if !valRes.Valid {
		return nil, errors.New(valRes.Message)
	}

	now := time.Now()
	usage := domain.VoucherUsage{
		VoucherID:      valRes.Voucher.ID,
		VoucherCode:    valRes.Voucher.Code,
		UserID:         uid,
		OriginalAmount: amount,
		DiscountAmount: valRes.DiscountAmount,
		FinalAmount:    valRes.FinalAmount,
		ReferenceType:  refType,
		ReferenceNo:    refNo,
		SubmissionID:   submissionID,
		InvoiceID:      invoiceID,
		Status:         "APPLIED",
		UsedAt:         now,
		CreatedAt:      now,
	}

	if user != nil {
		usage.UserName = user.FullName
		usage.UserEmail = user.Email
		usage.UserPhone = user.Phone
	}

	if err := u.repo.RecordUsage(&usage); err != nil {
		return nil, err
	}

	return &usage, nil
}

func (u *voucherUsecase) ListUsages(filter map[string]interface{}, page, limit int) ([]domain.VoucherUsage, int64, error) {
	return u.repo.FindUsages(filter, page, limit)
}

func (u *voucherUsecase) GetAnalytics(days int) (*domain.VoucherAnalyticsResponse, error) {
	summary, err := u.repo.GetAnalyticsSummary()
	if err != nil {
		return nil, err
	}

	trends, err := u.repo.GetDailyTrends(days)
	if err != nil {
		return nil, err
	}

	topVouchers, err := u.repo.GetTopVouchers(10)
	if err != nil {
		return nil, err
	}

	scopes, err := u.repo.GetScopeBreakdown()
	if err != nil {
		return nil, err
	}

	return &domain.VoucherAnalyticsResponse{
		Summary:        summary,
		DailyTrend:     trends,
		TopVouchers:    topVouchers,
		ScopeBreakdown: scopes,
	}, nil
}

func formatRupiah(amount float64) string {
	intPart := int64(amount)
	str := fmt.Sprintf("%d", intPart)
	n := len(str)
	if n <= 3 {
		return str
	}
	var res strings.Builder
	rem := n % 3
	if rem > 0 {
		res.WriteString(str[:rem])
		if n > rem {
			res.WriteString(".")
		}
	}
	for i := rem; i < n; i += 3 {
		res.WriteString(str[i : i+3])
		if i+3 < n {
			res.WriteString(".")
		}
	}
	return res.String()
}
