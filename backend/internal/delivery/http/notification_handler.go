package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notifUC usecase.NotificationUsecase
}

func NewNotificationHandler(r *gin.Engine, uc usecase.NotificationUsecase) {
	handler := &NotificationHandler{notifUC: uc}

	g := r.Group("/notifications")
	g.Use(middleware.AuthMiddleware())
	{
		g.GET("", handler.GetMyNotifications)
		g.PUT("/:id/read", handler.MarkAsRead)
	}
}

func (h *NotificationHandler) GetMyNotifications(c *gin.Context) {
	userID := middleware.GetUserID(c)

	notifs, err := h.notifUC.GetUserNotifications(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, notifs)
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification id"})
		return
	}

	err = h.notifUC.MarkAsRead(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}
