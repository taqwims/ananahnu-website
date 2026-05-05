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
		adminOnly.Use(middleware.RoleMiddleware("ADMIN", "FINANCE", "ADMIN_KEUANGAN", "DIRECTOR"))
		{
			adminOnly.GET("/all-invoices", handler.GetAllInvoices)
			adminOnly.PUT("/:id/mark-paid", handler.MarkInvoicePaid)
		}
		
		// Admin/Finance only for configs
		adminGroup := g.Group("/configs")
		adminGroup.Use(middleware.RoleMiddleware("ADMIN", "FINANCE"))
		{
			adminGroup.GET("", handler.GetPaymentConfigs)
			adminGroup.POST("", handler.CreatePaymentConfig)
			adminGroup.PUT("/:id", handler.UpdatePaymentConfig)
			adminGroup.DELETE("/:id", handler.DeletePaymentConfig)
		}
	}
}

func (h *BillingHandler) GetMyInvoices(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	roleName := c.MustGet("userRole").(string)
	
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
