package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BillingHandler struct {
	billingUC usecase.BillingUsecase
	paymentUC usecase.PaymentUsecase
	invoiceRepo domain.InvoiceRepository
}

func NewBillingHandler(r *gin.Engine, bUC usecase.BillingUsecase, pUC usecase.PaymentUsecase, invRepo domain.InvoiceRepository) {
	handler := &BillingHandler{
		billingUC: bUC,
		paymentUC: pUC,
		invoiceRepo: invRepo,
	}

	g := r.Group("/billing")
	g.Use(middleware.AuthMiddleware())
	{
		g.GET("/my-invoices", handler.GetMyInvoices)
		g.POST("/pay-bulk", handler.PayBulk)
		g.POST("/:id/remind", handler.Remind)
		
		// Admin/Finance access
		adminOnly := g.Group("")
		adminOnly.Use(middleware.RoleMiddleware("DIRECTOR", "FINANCE", "ADMIN_KEUANGAN"))
		{
			adminOnly.GET("/all-invoices", handler.GetAllInvoices)
			adminOnly.PUT("/:id/mark-paid", handler.MarkInvoicePaid)

			// Referral Commissions
			adminOnly.GET("/referral-commissions", handler.GetReferralCommissions)
			adminOnly.PUT("/referral-commissions/:id/pay", handler.PayReferralCommission)
		}

		
		// Admin/Finance only for configs
		adminGroup := g.Group("/configs")
		adminGroup.Use(middleware.RoleMiddleware("DIRECTOR", "FINANCE"))
		{
			adminGroup.GET("", handler.GetPaymentConfigs)
			adminGroup.POST("", handler.CreatePaymentConfig)
			adminGroup.PUT("/:id", handler.UpdatePaymentConfig)
			adminGroup.DELETE("/:id", handler.DeletePaymentConfig)
		}
	}

	// Fix: endpoint yang dipanggil frontend untuk invoice per submission
	invoices := r.Group("/invoices")
	invoices.Use(middleware.AuthMiddleware())
	{
		invoices.GET("/submission/:submissionId", handler.GetInvoiceBySubmission)
		// Ganti mode pembayaran: DP → Full Payment (sebelum pembayaran dilakukan)
		invoices.PUT("/:id/switch-full", handler.SwitchToFullPayment)
		// Ganti mode pembayaran: Full → DP (sebelum pembayaran dilakukan)
		invoices.PUT("/:id/switch-dp", handler.SwitchToDPPayment)
	}
}

func (h *BillingHandler) GetMyInvoices(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	roleName := c.MustGet("role").(string)
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	status := c.Query("status")

	invoices, total, err := h.billingUC.GetMyInvoices(userID, roleName, status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  invoices,
		"total": total,
	})
}

func (h *BillingHandler) PayBulk(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input struct {
		InvoiceIDs []int64 `json:"invoice_ids"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.InvoiceIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no invoices selected"})
		return
	}

	payment, err := h.paymentUC.InitiateBulkPayment(input.InvoiceIDs, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, payment)
}

func (h *BillingHandler) Remind(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	if err := h.billingUC.RemindPayment(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "reminder sent"})
}


func (h *BillingHandler) GetPaymentConfigs(c *gin.Context) {
	configs, err := h.billingUC.GetPaymentConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

func (h *BillingHandler) CreatePaymentConfig(c *gin.Context) {
	var config domain.PaymentConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.billingUC.CreatePaymentConfig(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, config)
}

func (h *BillingHandler) UpdatePaymentConfig(c *gin.Context) {
	var config domain.PaymentConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.billingUC.UpdatePaymentConfig(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, config)
}

func (h *BillingHandler) DeletePaymentConfig(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.billingUC.DeletePaymentConfig(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "config deleted"})
}

func (h *BillingHandler) GetAllInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	status := c.Query("status")
	payerID := c.Query("payer_id")

	filter := map[string]interface{}{}
	if status != "" {
		filter["status"] = status
	}
	if payerID != "" {
		filter["payer_id"] = payerID
	}

	invoices, total, err := h.invoiceRepo.FindAll(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  invoices,
		"total": total,
	})
}

func (h *BillingHandler) MarkInvoicePaid(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.billingUC.MarkInvoicePaid(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "invoice marked as paid"})
}

func (h *BillingHandler) GetReferralCommissions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	status := c.Query("status")

	commissions, total, err := h.billingUC.GetReferralCommissions(page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  commissions,
		"total": total,
	})
}

func (h *BillingHandler) PayReferralCommission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.billingUC.PayReferralCommission(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "commission marked as paid"})
}

// GetInvoiceBySubmission returns the invoice for a specific submission.
// Fix: endpoint ini dipanggil frontend di submissionService.getInvoice()
func (h *BillingHandler) GetInvoiceBySubmission(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	invoice, err := h.billingUC.GetInvoiceBySubmission(subID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invoice not found"})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// SwitchToFullPayment mengubah invoice DP menjadi Full Payment (100%) sebelum bayar.
// Dipanggil frontend ketika klien memilih opsi "Bayar Penuh" di halaman pembayaran.
func (h *BillingHandler) SwitchToFullPayment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}

	if err := h.billingUC.SwitchToFullPayment(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "invoice berhasil diubah ke Full Payment"})
}

// SwitchToDPPayment mengubah invoice Full menjadi DP (70%) sebelum bayar.
// Dipanggil frontend ketika klien memilih opsi "Down Payment" di halaman pembayaran.
func (h *BillingHandler) SwitchToDPPayment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}

	if err := h.billingUC.SwitchToDPPayment(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "invoice berhasil diubah ke Down Payment"})
}
