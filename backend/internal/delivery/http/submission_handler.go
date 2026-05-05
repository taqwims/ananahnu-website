package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubmissionHandler struct {
	workflowUC usecase.SubmissionWorkflowUsecase
}

func NewSubmissionHandler(r *gin.Engine, uc usecase.SubmissionWorkflowUsecase) {
	handler := &SubmissionHandler{workflowUC: uc}

	g := r.Group("/submissions")
	g.Use(middleware.AuthMiddleware())
	{
		g.POST("/draft", handler.CreateDraft)
		g.POST("/create-full", handler.CreateFull)
		g.POST("/:id/submit", handler.Submit)
		g.POST("/:id/approve", handler.Approve)
		g.POST("/:id/reject", handler.Reject)
		g.GET("", handler.GetList)
		g.GET("/:id", handler.GetDetail)
		g.GET("/:id/history", handler.GetHistory)
	}
}

func (h *SubmissionHandler) CreateDraft(c *gin.Context) {
	var input struct {
		ClientID     string `json:"client_id"`
		BusinessName string `json:"business_name"`
		ServiceType  string `json:"service_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var clientIDPtr *uuid.UUID
	if input.ClientID != "" {
		id, err := uuid.Parse(input.ClientID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client id"})
			return
		}
		clientIDPtr = &id
	}

	facilitatorID := middleware.GetUserID(c)

	sub, err := h.workflowUC.CreateDraft(clientIDPtr, input.BusinessName, input.ServiceType, facilitatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sub)
}

func (h *SubmissionHandler) CreateFull(c *gin.Context) {
	var input usecase.CreateFullInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	sub, err := h.workflowUC.CreateFull(input, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sub)
}

func (h *SubmissionHandler) Submit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.Submit(id, userID, role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "submitted"})
}

func (h *SubmissionHandler) Approve(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.Approve(id, userID, role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

func (h *SubmissionHandler) Reject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&input)

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.Reject(id, userID, role, input.Note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "rejected"})
}

func (h *SubmissionHandler) GetList(c *gin.Context) {
	filter := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	submissions, err := h.workflowUC.GetSubmissions(userID, role, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, submissions)
}

func (h *SubmissionHandler) GetDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	sub, err := h.workflowUC.GetSubmission(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}
	c.JSON(http.StatusOK, sub)
}

func (h *SubmissionHandler) GetHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	history, err := h.workflowUC.GetHistory(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}
