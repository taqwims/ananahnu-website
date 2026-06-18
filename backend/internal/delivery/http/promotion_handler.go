package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PromotionHandler struct {
	promotionUC usecase.PromotionUsecase
}

func NewPromotionHandler(r *gin.Engine, uc usecase.PromotionUsecase) *PromotionHandler {
	handler := &PromotionHandler{promotionUC: uc}

	promotions := r.Group("/promotions")
	promotions.Use(middleware.AuthMiddleware())
	{
		// Endpoint baru: stats real untuk progress bar frontend
		promotions.GET("/eligibility", handler.GetEligibility)

		promotions.POST("/request", handler.SubmitRequest)
		promotions.GET("/my-requests", handler.GetMyRequests)
		promotions.GET("/", handler.GetAllRequests)

		// Admin only
		promotions.PUT("/:id/verify",
			middleware.RoleMiddleware("DIRECTOR", "ADMIN_PELATIHAN"),
			handler.VerifyRequest,
		)
		promotions.PUT("/:id/assess",
			middleware.RoleMiddleware("DIRECTOR", "ADMIN_PELATIHAN"),
			handler.CompleteAssessment,
		)
	}

	return handler
}

// GetEligibility mengembalikan stats real (team size, omset) untuk ditampilkan
// di progress bar KarirDashboard. Tidak membuat request apapun.
func (h *PromotionHandler) GetEligibility(c *gin.Context) {
	userID := middleware.GetUserID(c)

	stats, err := h.promotionUC.GetEligibilityStats(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// SubmitRequest menerima certificate_url (opsional, sudah diupload via /media/upload lebih dulu).
func (h *PromotionHandler) SubmitRequest(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var input struct {
		CertificateURL string `json:"certificate_url"`
	}
	// ShouldBindJSON tidak wajib berhasil — certificate_url opsional untuk HALAL_MANAGER
	c.ShouldBindJSON(&input)

	req, err := h.promotionUC.SubmitPromotionRequest(userID, input.CertificateURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *PromotionHandler) VerifyRequest(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.promotionUC.VerifyPromotionRequest(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated to IN_TRAINING"})
}

func (h *PromotionHandler) CompleteAssessment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Passed bool `json:"passed"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.promotionUC.CompletePromotionAssessment(id, req.Passed); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assessment completed"})
}

func (h *PromotionHandler) GetMyRequests(c *gin.Context) {
	userID := middleware.GetUserID(c)

	reqs, err := h.promotionUC.GetPromotionRequests(map[string]interface{}{"user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reqs)
}

func (h *PromotionHandler) GetAllRequests(c *gin.Context) {
	reqs, err := h.promotionUC.GetPromotionRequests(map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reqs)
}
