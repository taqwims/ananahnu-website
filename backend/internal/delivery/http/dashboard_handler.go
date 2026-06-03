package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DashboardHandler struct {
	dashboardUC usecase.DashboardUsecase
}

func NewDashboardHandler(r *gin.Engine, uc usecase.DashboardUsecase) {
	handler := &DashboardHandler{dashboardUC: uc}

	g := r.Group("/dashboard")
	g.Use(middleware.AuthMiddleware())
	{
		g.GET("/stats", handler.GetStats)
		g.GET("/activities", handler.GetActivities)
		g.GET("/draft-manager/analytics", middleware.RoleMiddleware("DRAFT_MANAGER", "DIRECTOR", "MANAGER"), handler.GetDraftManagerAnalytics)
	}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	role := c.MustGet("role").(string)

	stats, err := h.dashboardUC.GetStats(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) GetActivities(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	role := c.MustGet("role").(string)

	activities, err := h.dashboardUC.GetRecentActivities(userID, role, 15)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, activities)
}

func (h *DashboardHandler) GetDraftManagerAnalytics(c *gin.Context) {
	analytics, err := h.dashboardUC.GetDraftManagerAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}
