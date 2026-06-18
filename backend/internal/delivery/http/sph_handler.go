package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type sphHandler struct {
	uc usecase.SPHUsecase
}

func NewSPHHandler(r *gin.Engine, uc usecase.SPHUsecase) {
	h := &sphHandler{uc: uc}

	g := r.Group("/sph", middleware.AuthMiddleware())
	{
		g.POST("/generate/:submission_id",
			middleware.RoleMiddleware("DIRECTOR", "MANAGER", "HALAL_ADVISOR", "HALAL_MANAGER", "ADMIN_KEUANGAN"),
			h.GenerateSPH,
		)
		g.GET("/:id", h.GetSPH)
		g.GET("/submission/:submission_id", h.GetSPHBySubmission)
		g.GET("", h.ListSPH)
		g.PUT("/:id/approve",
			middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_KEUANGAN"),
			h.ApproveSPH,
		)
	}
}

func (h *sphHandler) GenerateSPH(c *gin.Context) {
	submissionID, err := uuid.Parse(c.Param("submission_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	sph, err := h.uc.GenerateSPH(submissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sph)
}

func (h *sphHandler) GetSPH(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	sph, err := h.uc.GetSPH(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SPH not found"})
		return
	}

	c.JSON(http.StatusOK, sph)
}

func (h *sphHandler) GetSPHBySubmission(c *gin.Context) {
	submissionID, err := uuid.Parse(c.Param("submission_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	sph, err := h.uc.GetSPHBySubmission(submissionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SPH not found"})
		return
	}

	c.JSON(http.StatusOK, sph)
}

func (h *sphHandler) ListSPH(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := map[string]interface{}{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if month := c.Query("month"); month != "" {
		if m, err := strconv.Atoi(month); err == nil {
			filter["month"] = m
		}
	}
	if year := c.Query("year"); year != "" {
		if y, err := strconv.Atoi(year); err == nil {
			filter["year"] = y
		}
	}

	sphs, total, err := h.uc.ListSPH(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  sphs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *sphHandler) ApproveSPH(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.uc.ApproveSPH(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "SPH approved"})
}
