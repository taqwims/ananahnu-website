package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"
	"time"

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
		g.POST("/:id/issue-sh", handler.IssueSH)
		g.POST("/:id/assign-drafter", handler.AssignDrafter)
		g.POST("/:id/reject", handler.Reject)
		g.POST("/:id/audit-info", handler.UpdateAuditInfo)
		g.POST("/:id/audit-result", handler.UploadAuditResult)
		g.POST("/:id/assign-consultant", handler.AssignConsultant)
		g.POST("/bulk-assign-drafter", handler.BulkAssignDrafter)
		g.GET("", handler.GetList)
		g.GET("/:id", handler.GetDetail)
		g.GET("/:id/history", handler.GetHistory)
		g.DELETE("/:id", handler.Delete)
	}

	r.GET("/public/track/:tracking_number", handler.TrackSubmission)
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
	role := middleware.GetUserRole(c)
	sub, err := h.workflowUC.CreateFull(input, userID, role)
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

	// Check if drafter_id is provided (for QC_OFFICER -> DRAFTER assignment)
	var input struct {
		DrafterID string `json:"drafter_id"`
	}
	c.ShouldBindJSON(&input)

	if input.DrafterID != "" {
		drafterUUID, err := uuid.Parse(input.DrafterID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid drafter_id"})
			return
		}
		if err := h.workflowUC.ApproveWithDrafter(id, userID, role, drafterUUID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	} else {
		if err := h.workflowUC.Approve(id, userID, role); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

func (h *SubmissionHandler) AssignDrafter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input struct {
		DrafterID string `json:"drafter_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "drafter_id is required"})
		return
	}

	drafterUUID, err := uuid.Parse(input.DrafterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid drafter_id"})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.ApproveWithDrafter(id, userID, role, drafterUUID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "assigned to drafter"})
}

func (h *SubmissionHandler) AssignConsultant(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input struct {
		ConsultantID string `json:"consultant_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "consultant_id is required"})
		return
	}

	consultantUUID, err := uuid.Parse(input.ConsultantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consultant_id"})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.AssignConsultant(id, userID, role, consultantUUID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "assigned to consultant"})
}

func (h *SubmissionHandler) BulkAssignDrafter(c *gin.Context) {
	var input struct {
		IDs       []string `json:"ids" binding:"required"`
		DrafterID string   `json:"drafter_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	drafterUUID, err := uuid.Parse(input.DrafterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid drafter_id"})
		return
	}

	var uuids []uuid.UUID
	for _, idStr := range input.IDs {
		id, err := uuid.Parse(idStr)
		if err == nil {
			uuids = append(uuids, id)
		}
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.BulkApproveWithDrafter(uuids, userID, role, drafterUUID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "bulk assignment successful"})
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
func (h *SubmissionHandler) IssueSH(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input struct {
		SHURL string `json:"sh_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sh_url is required"})
		return
	}

	userID := middleware.GetUserID(c)
	if err := h.workflowUC.IssueSH(id, userID, input.SHURL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "SH issued successfully"})
}

func (h *SubmissionHandler) TrackSubmission(c *gin.Context) {
	trackingNo := c.Param("tracking_number")
	if trackingNo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tracking number is required"})
		return
	}

	sub, err := h.workflowUC.TrackByNumber(trackingNo)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found with that tracking number"})
		return
	}

	// We only return safe info for public tracking
	c.JSON(http.StatusOK, gin.H{
		"id":            sub.ID,
		"business_name": sub.Client.BusinessName,
		"client_name":   sub.Client.ClientName,
		"status":        sub.Status,
		"service_type":  sub.ServiceType,
		"sh_url":        sub.SHURL,
		"updated_at":    sub.UpdatedAt,
		"tracking_no":   sub.TrackingNumber,
	})
}

func (h *SubmissionHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.Delete(id, userID, role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "submission deleted successfully"})
}

func (h *SubmissionHandler) UpdateAuditInfo(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)

	var input struct {
		AuditDate string `json:"audit_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Try multiple formats
	var parsedDate time.Time
	var errParse error
	formats := []string{time.RFC3339, "2006-01-02", "2006-01-02 15:04:05"}
	for _, f := range formats {
		parsedDate, errParse = time.Parse(f, input.AuditDate)
		if errParse == nil {
			break
		}
	}

	if errParse != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.UpdateAuditInfo(id, userID, role, &parsedDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "audit info updated"})
}

func (h *SubmissionHandler) UploadAuditResult(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)

	var input struct {
		URL1 string `json:"url1"`
		URL2 string `json:"url2"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if err := h.workflowUC.UpdateAuditResult(id, userID, role, input.URL1, input.URL2); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "audit results uploaded"})
}
