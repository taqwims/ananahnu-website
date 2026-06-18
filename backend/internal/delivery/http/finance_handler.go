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

type financeHandler struct {
	uc usecase.FinanceUsecase
}

func NewFinanceHandler(r *gin.Engine, uc usecase.FinanceUsecase) {
	h := &financeHandler{uc: uc}

	g := r.Group("/finance", middleware.AuthMiddleware(),
		middleware.RoleMiddleware("DIRECTOR", "ADMIN_KEUANGAN", "FINANCE"),
	)
	{
		g.GET("/dashboard", h.GetDashboard)
		g.GET("/fee-config", h.GetFeeConfig)
		g.PUT("/fee-config", h.UpdateFeeConfig)
		g.GET("/commissions", h.GetCommissions)
		g.POST("/commissions/:id/pay", h.PayCommission)
		g.GET("/commissions/:id/slip", h.DownloadSlip)
		g.POST("/commissions/:id/send-wa", h.SendSlipWA)
		g.GET("/agents", h.GetAgents)
		g.GET("/clients", h.GetClients)
		g.GET("/submissions", h.GetSubmissions)
		g.GET("/managers", h.GetManagers)

		// Expenses
		g.POST("/expenses", h.CreateExpense)
		g.GET("/expenses", h.GetExpenses)
		g.DELETE("/expenses/:id", h.DeleteExpense)

		// BPJPH Payment
		g.POST("/submissions/bpjph-payment/bulk", h.UpdateBPJPHPaymentBulk)
		g.POST("/submissions/:id/bpjph-payment", h.UpdateBPJPHPayment)
	}
}

func (h *financeHandler) GetDashboard(c *gin.Context) {
	month, _ := strconv.Atoi(c.DefaultQuery("month", "0"))
	year, _ := strconv.Atoi(c.DefaultQuery("year", "0"))

	data, err := h.uc.GetDashboard(month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

func (h *financeHandler) GetFeeConfig(c *gin.Context) {
	items, err := h.uc.GetFeeConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *financeHandler) UpdateFeeConfig(c *gin.Context) {
	var req struct {
		Key   string  `json:"key" binding:"required"`
		Value float64 `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.UpdateFeeConfig(req.Key, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Fee config updated"})
}

func (h *financeHandler) GetCommissions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	commType := c.Query("type")

	data, total, err := h.uc.GetCommissions(page, limit, status, commType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  data,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *financeHandler) PayCommission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.uc.PayCommission(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Commission paid"})
}

func (h *financeHandler) DownloadSlip(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	buf, filename, err := h.uc.GenerateCommissionSlip(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "application/pdf", buf)
}

func (h *financeHandler) SendSlipWA(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.uc.SendCommissionSlipWA(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Slip sent via WhatsApp"})
}

func (h *financeHandler) GetAgents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	data, total, err := h.uc.GetAgentList(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data, "total": total})
}

func (h *financeHandler) GetClients(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	data, total, err := h.uc.GetClientList(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data, "total": total})
}

func (h *financeHandler) GetSubmissions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	serviceType := c.Query("service_type")

	data, total, err := h.uc.GetSubmissionList(page, limit, serviceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data, "total": total})
}

func (h *financeHandler) GetManagers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	data, total, err := h.uc.GetManagerList(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data, "total": total})
}

func (h *financeHandler) CreateExpense(c *gin.Context) {
	var req domain.Expense
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.CreateExpense(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *financeHandler) GetExpenses(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	filter := map[string]interface{}{}
	if cat := c.Query("category"); cat != "" {
		filter["category"] = cat
	}
	if isSub := c.Query("is_submission_linked"); isSub != "" {
		filter["is_submission_linked"] = isSub == "true"
	}
	if month, _ := strconv.Atoi(c.Query("month")); month > 0 {
		filter["month"] = month
	}
	if year, _ := strconv.Atoi(c.Query("year")); year > 0 {
		filter["year"] = year
	}

	data, total, err := h.uc.GetExpenses(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  data,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *financeHandler) DeleteExpense(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.uc.DeleteExpense(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Expense deleted"})
}

func (h *financeHandler) UpdateBPJPHPayment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Status string  `json:"status" binding:"required,oneof=UNPAID PAID"`
		Amount float64 `json:"amount" binding:"min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.UpdateBPJPHPayment(id, req.Status, req.Amount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "BPJPH payment status updated successfully"})
}

func (h *financeHandler) UpdateBPJPHPaymentBulk(c *gin.Context) {
	var req struct {
		IDs    []string `json:"ids" binding:"required,gt=0"`
		Status string   `json:"status" binding:"required,oneof=UNPAID PAID"`
		Amount float64  `json:"amount" binding:"min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uuids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid: " + idStr})
			return
		}
		uuids[i] = id
	}

	if err := h.uc.UpdateBPJPHPaymentBulk(uuids, req.Status, req.Amount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "BPJPH payment status updated in bulk successfully"})
}

