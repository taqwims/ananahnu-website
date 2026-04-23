package http

import (
	"ananahnu/internal/usecase"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	paymentUC usecase.PaymentUsecase
}

func NewPaymentHandler(r *gin.Engine, uc usecase.PaymentUsecase) {
	handler := &PaymentHandler{paymentUC: uc}

	// Authenticated routes (add auth middleware here when available)
	g := r.Group("/payments")
	{
		g.POST("/manual", handler.CreateManual)
		g.POST("/midtrans", handler.CreateMidtrans)
		g.GET("/submission/:submissionId", handler.GetBySubmission)
		g.GET("/", handler.ListAll)
		g.PUT("/:id/verify", handler.VerifyManual)
	}

	// Public webhook endpoint — Midtrans calls this, no auth required
	r.POST("/payments/midtrans/webhook", handler.MidtransWebhook)
}

// CreateManual handles manual payment creation with proof upload.
func (h *PaymentHandler) CreateManual(c *gin.Context) {
	var input struct {
		SubmissionID string  `json:"submission_id" binding:"required"`
		Amount       float64 `json:"amount" binding:"required,gt=0"`
		ProofURL     string  `json:"proof_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subID, err := uuid.Parse(input.SubmissionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	if err := h.paymentUC.CreateManualPayment(subID, input.Amount, input.ProofURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "payment proof submitted, waiting for verification"})
}

// CreateMidtrans initiates a Midtrans Snap payment and returns the token + redirect URL.
func (h *PaymentHandler) CreateMidtrans(c *gin.Context) {
	var input struct {
		SubmissionID string  `json:"submission_id" binding:"required"`
		Amount       float64 `json:"amount" binding:"required,gt=0"`
		Email        string  `json:"email" binding:"required,email"`
		CustomerName string  `json:"customer_name"`
		Phone        string  `json:"phone"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subID, err := uuid.Parse(input.SubmissionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	result, err := h.paymentUC.CreateMidtransPayment(subID, input.Amount, input.Email, input.CustomerName, input.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"snap_token": result.SnapToken,
		"snap_url":   result.SnapURL,
		"order_id":   result.OrderID,
	})
}

// MidtransWebhook handles incoming Midtrans notification callbacks.
// This endpoint is PUBLIC — Midtrans calls it directly.
// Security is handled via SHA512 signature verification inside the usecase.
func (h *PaymentHandler) MidtransWebhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := json.NewDecoder(c.Request.Body).Decode(&payload); err != nil {
		log.Printf("[WEBHOOK] Failed to decode payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if err := h.paymentUC.HandleMidtransNotification(payload); err != nil {
		log.Printf("[WEBHOOK] Error processing notification: %v", err)
		// Still return 200 for signature errors to avoid Midtrans retries on fraud attempts
		// Only return 500 for actual internal errors
		if err.Error() == "invalid notification signature" {
			c.JSON(http.StatusOK, gin.H{"status": "signature_invalid"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetBySubmission returns all payments for a specific submission.
func (h *PaymentHandler) GetBySubmission(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	payments, err := h.paymentUC.GetPaymentsBySubmission(subID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, payments)
}

// ListAll returns a paginated list of all payments (admin/finance view).
func (h *PaymentHandler) ListAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if method := c.Query("method"); method != "" {
		filter["method"] = method
	}

	payments, total, err := h.paymentUC.GetAllPayments(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  payments,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// VerifyManual allows admin/finance to approve or reject a manual payment.
func (h *PaymentHandler) VerifyManual(c *gin.Context) {
	paymentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment id"})
		return
	}

	var input struct {
		Approved bool `json:"approved"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Extract verifierID from JWT auth context when middleware is implemented
	verifierID := uuid.Nil

	if err := h.paymentUC.VerifyManualPayment(paymentID, input.Approved, verifierID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	status := "rejected"
	if input.Approved {
		status = "approved"
	}

	c.JSON(http.StatusOK, gin.H{"message": "payment " + status})
}
