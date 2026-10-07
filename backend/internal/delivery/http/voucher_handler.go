package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VoucherHandler struct {
	uc usecase.VoucherUsecase
}

func NewVoucherHandler(r *gin.Engine, uc usecase.VoucherUsecase) {
	handler := &VoucherHandler{uc: uc}

	// Public / Client validation endpoint
	public := r.Group("/public/vouchers")
	{
		public.POST("/validate", handler.ValidateVoucher)
	}

	// Protected routes
	api := r.Group("/api/vouchers")
	api.Use(middleware.AuthMiddleware())
	{
		// Validate & Apply
		api.POST("/validate", handler.ValidateVoucher)
		api.POST("/apply", handler.ApplyVoucher)

		// Analytics & Usages (Management)
		api.GET("/analytics", handler.GetAnalytics)
		api.GET("/usages", handler.ListUsages)

		// CRUD & Generation
		api.GET("", handler.ListVouchers)
		api.POST("", handler.CreateVoucher)
		api.POST("/generate", handler.GenerateVouchers)
		api.GET("/:id", handler.GetVoucherByID)
		api.PUT("/:id", handler.UpdateVoucher)
		api.PATCH("/:id/toggle", handler.ToggleVoucherStatus)
		api.DELETE("/:id", handler.DeleteVoucher)
	}
}

func (h *VoucherHandler) ListVouchers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	status := c.Query("status")
	scope := c.Query("scope")
	discountType := c.Query("discount_type")

	filter := map[string]interface{}{
		"search":        search,
		"status":        status,
		"scope":         scope,
		"discount_type": discountType,
	}

	vouchers, total, err := h.uc.ListVouchers(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  vouchers,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *VoucherHandler) CreateVoucher(c *gin.Context) {
	var req struct {
		Code          string              `json:"code" binding:"required"`
		Name          string              `json:"name" binding:"required"`
		Description   string              `json:"description"`
		DiscountType  domain.DiscountType `json:"discount_type" binding:"required"`
		DiscountValue float64             `json:"discount_value" binding:"required"`
		MaxDiscount   float64             `json:"max_discount"`
		MinSpend      float64             `json:"min_spend"`
		UsageLimit    int                 `json:"usage_limit"`
		UsagePerUser  int                 `json:"usage_per_user"`
		ValidFrom     string              `json:"valid_from" binding:"required"`
		ValidUntil    string              `json:"valid_until" binding:"required"`
		Scope         domain.VoucherScope `json:"scope"`
		IsActive      *bool               `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
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
	validUntil = time.Date(validUntil.Year(), validUntil.Month(), validUntil.Day(), 23, 59, 59, 0, validUntil.Location())

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	scope := req.Scope
	if scope == "" {
		scope = domain.VoucherScopeAll
	}

	uid := middleware.GetUserID(c)
	var creatorID *uuid.UUID
	if uid != uuid.Nil {
		creatorID = &uid
	}

	v := domain.Voucher{
		Code:          req.Code,
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
		Scope:         scope,
		IsActive:      isActive,
	}

	result, err := h.uc.CreateVoucher(&v, creatorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Voucher berhasil dibuat",
		"data":    result,
	})
}

func (h *VoucherHandler) GenerateVouchers(c *gin.Context) {
	var req domain.VoucherGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data generate tidak valid: " + err.Error()})
		return
	}

	uid := middleware.GetUserID(c)
	var creatorID *uuid.UUID
	if uid != uuid.Nil {
		creatorID = &uid
	}

	results, err := h.uc.GenerateVouchers(req, creatorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Berhasil men-generate %d kode voucher", len(results)),
		"data":    results,
		"count":   len(results),
	})
}

func (h *VoucherHandler) GetVoucherByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	v, err := h.uc.GetVoucherByID(id)
	if err != nil || v == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voucher tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": v})
}

func (h *VoucherHandler) UpdateVoucher(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	var req struct {
		Code          string              `json:"code"`
		Name          string              `json:"name"`
		Description   string              `json:"description"`
		DiscountType  domain.DiscountType `json:"discount_type"`
		DiscountValue float64             `json:"discount_value"`
		MaxDiscount   float64             `json:"max_discount"`
		MinSpend      float64             `json:"min_spend"`
		UsageLimit    int                 `json:"usage_limit"`
		UsagePerUser  int                 `json:"usage_per_user"`
		ValidFrom     string              `json:"valid_from"`
		ValidUntil    string              `json:"valid_until"`
		Scope         domain.VoucherScope `json:"scope"`
		IsActive      bool                `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var validFrom, validUntil time.Time
	if req.ValidFrom != "" {
		validFrom, _ = time.Parse("2006-01-02", req.ValidFrom)
		if validFrom.IsZero() {
			validFrom, _ = time.Parse(time.RFC3339, req.ValidFrom)
		}
	}
	if req.ValidUntil != "" {
		validUntil, _ = time.Parse("2006-01-02", req.ValidUntil)
		if validUntil.IsZero() {
			validUntil, _ = time.Parse(time.RFC3339, req.ValidUntil)
		}
		if !validUntil.IsZero() {
			validUntil = time.Date(validUntil.Year(), validUntil.Month(), validUntil.Day(), 23, 59, 59, 0, validUntil.Location())
		}
	}

	v := domain.Voucher{
		Code:          req.Code,
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
		Scope:         req.Scope,
		IsActive:      req.IsActive,
	}

	result, err := h.uc.UpdateVoucher(id, &v)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Voucher berhasil diperbarui",
		"data":    result,
	})
}

func (h *VoucherHandler) ToggleVoucherStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	result, err := h.uc.ToggleVoucherStatus(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	statusMsg := "diaktifkan"
	if !result.IsActive {
		statusMsg = "dinonaktifkan"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Status voucher berhasil %s", statusMsg),
		"data":    result,
	})
}

func (h *VoucherHandler) DeleteVoucher(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	if err := h.uc.DeleteVoucher(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Voucher berhasil dihapus"})
}

func (h *VoucherHandler) ValidateVoucher(c *gin.Context) {
	var req domain.VoucherValidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid: " + err.Error()})
		return
	}

	// If user is authenticated, attach user ID
	uid := middleware.GetUserID(c)
	if uid != uuid.Nil && req.UserID == nil {
		req.UserID = &uid
	}

	resp, err := h.uc.ValidateVoucher(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !resp.Valid {
		c.JSON(http.StatusOK, gin.H{
			"valid":   false,
			"message": resp.Message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":           true,
		"message":         resp.Message,
		"voucher":         resp.Voucher,
		"discount_amount": resp.DiscountAmount,
		"final_amount":    resp.FinalAmount,
	})
}

func (h *VoucherHandler) ApplyVoucher(c *gin.Context) {
	var req struct {
		Code         string     `json:"code" binding:"required"`
		Amount       float64    `json:"amount" binding:"required"`
		ReferenceType string    `json:"reference_type"`
		ReferenceNo  string     `json:"reference_no"`
		SubmissionID *uuid.UUID `json:"submission_id"`
		InvoiceID    *int64     `json:"invoice_id"`
		UserName     string     `json:"user_name"`
		UserEmail    string     `json:"user_email"`
		UserPhone    string     `json:"user_phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid := middleware.GetUserID(c)
	user := &domain.User{}
	if uid != uuid.Nil {
		user.ID = uid
	}
	user.FullName = req.UserName
	user.Email = req.UserEmail
	user.Phone = req.UserPhone

	usage, err := h.uc.ApplyVoucher(req.Code, req.Amount, user, req.ReferenceType, req.ReferenceNo, req.SubmissionID, req.InvoiceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Voucher berhasil digunakan",
		"data":    usage,
	})
}

func (h *VoucherHandler) ListUsages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	voucherCode := c.Query("voucher_code")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var voucherID int64
	if vIDStr := c.Query("voucher_id"); vIDStr != "" {
		voucherID, _ = strconv.ParseInt(vIDStr, 10, 64)
	}

	filter := map[string]interface{}{
		"search":       search,
		"voucher_code": voucherCode,
		"voucher_id":   voucherID,
		"start_date":   startDate,
		"end_date":     endDate,
	}

	usages, total, err := h.uc.ListUsages(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  usages,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *VoucherHandler) GetAnalytics(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "14"))
	analytics, err := h.uc.GetAnalytics(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": analytics})
}
