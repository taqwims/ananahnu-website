package http

import (
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	notifUC usecase.NotificationUsecase
}

func NewNotificationHandler(r *gin.Engine, uc usecase.NotificationUsecase) {
	handler := &NotificationHandler{notifUC: uc}

	g := r.Group("/notifications")
	// Middleware Auth required
	{
		g.GET("/", handler.GetMyNotifications)
	}
}

func (h *NotificationHandler) GetMyNotifications(c *gin.Context) {
	// Stub context ID
	userID := uuid.Nil 
	// userID := c.MustGet("userID").(uuid.UUID)

	notifs, err := h.notifUC.GetUserNotifications(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, notifs)
}
