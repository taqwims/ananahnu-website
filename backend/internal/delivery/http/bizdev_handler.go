package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type bizDevHandler struct {
	uc usecase.BizDevUsecase
}

func NewBizDevHandler(r *gin.Engine, uc usecase.BizDevUsecase) {
	h := &bizDevHandler{uc: uc}

	g := r.Group("/bizdev", middleware.AuthMiddleware(),
		middleware.RoleMiddleware("DIRECTOR", "BUSINESS_DEVELOPMENT"),
	)
	{
		g.GET("/dashboard", h.GetDashboard)
		g.GET("/monthly-progress", h.GetMonthlyProgress)
		g.GET("/submissions", h.GetSubmissions)
		g.GET("/targets", h.GetAllTargets)
		g.GET("/targets/:period", h.GetTarget)
		// Target management — only DIRECTOR can set targets
		g.POST("/targets", middleware.RoleMiddleware("DIRECTOR"), h.SetTarget)
		g.DELETE("/targets/:id", middleware.RoleMiddleware("DIRECTOR"), h.DeleteTarget)
	}
}

func (h *bizDevHandler) GetDashboard(c *gin.Context) {
	month, _ := strconv.Atoi(c.DefaultQuery("month", "0"))
	year, _ := strconv.Atoi(c.DefaultQuery("year", "0"))

	data, err := h.uc.GetDashboard(month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

func (h *bizDevHandler) GetMonthlyProgress(c *gin.Context) {
	year, _ := strconv.Atoi(c.DefaultQuery("year", "2026"))

	data, err := h.uc.GetMonthlyProgress(year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

func (h *bizDevHandler) GetSubmissions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := map[string]interface{}{}
	if st := c.Query("service_type"); st != "" {
		filter["service_type"] = st
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}

	data, total, err := h.uc.GetAllSubmissions(filter, page, limit)
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

func (h *bizDevHandler) GetTarget(c *gin.Context) {
	period := c.Param("period")
	target, err := h.uc.GetTarget(period)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "target not found"})
		return
	}
	c.JSON(http.StatusOK, target)
}

func (h *bizDevHandler) GetAllTargets(c *gin.Context) {
	targets, err := h.uc.GetAllTargets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, targets)
}

func (h *bizDevHandler) SetTarget(c *gin.Context) {
	var target domain.CompanyTarget
	if err := c.ShouldBindJSON(&target); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.SetTarget(&target); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Target saved", "data": target})
}

func (h *bizDevHandler) DeleteTarget(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.uc.DeleteTarget(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Target deleted"})
}
