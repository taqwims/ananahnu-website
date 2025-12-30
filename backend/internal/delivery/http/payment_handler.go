package http

import (
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	paymentUC usecase.PaymentUsecase
}

func NewPaymentHandler(r *gin.Engine, uc usecase.PaymentUsecase) {
	handler := &PaymentHandler{paymentUC: uc}

	g := r.Group("/payments")
	{
		g.POST("/manual", handler.CreateManual)
		g.POST("/midtrans", handler.CreateMidtrans)
		g.POST("/midtrans/webhook", handler.MidtransWebhook)
	}
}

func (h *PaymentHandler) CreateManual(c *gin.Context) {
	var input struct {
		SubmissionID string  `json:"submission_id"`
		Amount       float64 `json:"amount"`
		ProofURL     string  `json:"proof_url"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subID, _ := uuid.Parse(input.SubmissionID)
	if err := h.paymentUC.CreateManualPayment(subID, input.Amount, input.ProofURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "payment submitted"})
}

func (h *PaymentHandler) CreateMidtrans(c *gin.Context) {
	var input struct {
		SubmissionID string  `json:"submission_id"`
		Amount       float64 `json:"amount"`
		Email        string  `json:"email"`
	}
	c.ShouldBindJSON(&input)
	subID, _ := uuid.Parse(input.SubmissionID)

	token, err := h.paymentUC.CreateMidtransPayment(subID, input.Amount, input.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"snap_token": token})
}

func (h *PaymentHandler) MidtransWebhook(c *gin.Context) {
	var notification struct {
		OrderID           string `json:"order_id"`
		TransactionStatus string `json:"transaction_status"`
	}
	c.ShouldBindJSON(&notification)

	h.paymentUC.HandleMidtransNotification(notification.OrderID, notification.TransactionStatus)
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}
