package http

import (
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

	r.GET("/dashboard/stats", handler.GetStats)
	r.GET("/dashboard/activities", handler.GetActivities)
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	// Stub ID/Role
	userID := uuid.Nil
	role := "ADMIN"

	stats, err := h.dashboardUC.GetStats(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) GetActivities(c *gin.Context) {
	activities, err := h.dashboardUC.GetRecentActivities(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, activities)
}
