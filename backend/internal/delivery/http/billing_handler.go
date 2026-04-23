package http

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BillingHandler struct {
	billingUC usecase.BillingUsecase
}

func NewBillingHandler(r *gin.Engine, uc usecase.BillingUsecase) {
	handler := &BillingHandler{billingUC: uc}

	// Invoices
	inv := r.Group("/invoices")
	{
		inv.GET("/", handler.GetInvoices)
		inv.GET("/submission/:submissionId", handler.GetInvoiceBySubmission)
		inv.PUT("/:id/mark-paid", handler.MarkInvoicePaid)
	}

	// Payment Config
	cfg := r.Group("/payment-config")
	{
		cfg.GET("/", handler.GetPaymentConfigs)
		cfg.POST("/", handler.CreatePaymentConfig)
		cfg.PUT("/:id", handler.UpdatePaymentConfig)
		cfg.DELETE("/:id", handler.DeletePaymentConfig)
	}
}

// --- Invoices ---

func (h *BillingHandler) GetInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if serviceType := c.Query("service_type"); serviceType != "" {
		filter["service_type"] = serviceType
	}

	invoices, total, err := h.billingUC.GetInvoices(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  invoices,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

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

func (h *BillingHandler) MarkInvoicePaid(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.billingUC.MarkInvoicePaid(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "invoice marked as paid"})
}

// --- Payment Config ---

func (h *BillingHandler) GetPaymentConfigs(c *gin.Context) {
	configs, err := h.billingUC.GetPaymentConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

func (h *BillingHandler) CreatePaymentConfig(c *gin.Context) {
	var input domain.PaymentConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.billingUC.CreatePaymentConfig(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingHandler) UpdatePaymentConfig(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input domain.PaymentConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.billingUC.UpdatePaymentConfig(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *BillingHandler) DeletePaymentConfig(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.billingUC.DeletePaymentConfig(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
