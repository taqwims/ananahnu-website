package http

import (
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
	// Middleware Auth should be here
	{
		g.POST("/draft", handler.CreateDraft)
		g.POST("/:id/submit", handler.Submit)
		g.POST("/:id/approve", handler.Approve)
		g.POST("/:id/reject", handler.Reject)
		g.GET("", handler.GetList)
		g.GET("/:id", handler.GetDetail)
	}
}

func (h *SubmissionHandler) CreateDraft(c *gin.Context) {
	var input struct {
		ClientID    string `json:"client_id" binding:"required"`
		ServiceType string `json:"service_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clientID, err := uuid.Parse(input.ClientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client id"})
		return
	}

	sub, err := h.workflowUC.CreateDraft(clientID, input.ServiceType)
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
	
	// Mock User ID/Role from Context (Middleware not yet fully wired)
	// userID := c.MustGet("userID").(uuid.UUID)
	// role := c.MustGet("role").(string)
	userID := uuid.Nil // Stub
	role := "MARKETING" // Stub

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

	userID := uuid.Nil // Stub
	role := "HALAL_KONSULTAN" // Stub - In real app, get from key

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
	
	var input struct{ Note string `json:"note"` }
	c.ShouldBindJSON(&input)

	userID := uuid.Nil
	role := "QC_OFFICER" // Stub

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

	submissions, err := h.workflowUC.GetSubmissions(filter)
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
