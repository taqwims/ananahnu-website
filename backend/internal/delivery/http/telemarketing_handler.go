package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TelemarketingHandler struct {
	uc usecase.TelemarketingUsecase
}

func NewTelemarketingHandler(r *gin.Engine, uc usecase.TelemarketingUsecase) {
	handler := &TelemarketingHandler{uc: uc}

	// Public endpoints (no auth)
	pub := r.Group("/tele")
	{
		pub.POST("/form", handler.SubmitPublicForm)
		pub.GET("/form/:id", handler.GetFormByID)
		pub.GET("/pricing", handler.GetPendampinganPricing)
	}

	// Protected endpoints (auth required)
	tele := r.Group("/tele")
	tele.Use(middleware.AuthMiddleware())
	{
		// Forms management
		tele.GET("/forms", handler.GetAllForms)
		tele.GET("/forms/my", handler.GetMyForms)
		tele.PUT("/forms/:id/status", handler.UpdateFormStatus)
		tele.PUT("/forms/:id/self-declare-type", handler.SetSelfDeclareType)

		// Meeting management
		tele.POST("/meetings", handler.ScheduleMeeting)
		tele.GET("/meetings", handler.GetAllMeetings)
		tele.GET("/meetings/my", handler.GetMyMeetings)
		tele.PUT("/meetings/:id", handler.UpdateMeeting)
		tele.DELETE("/meetings/:id", handler.DeleteMeeting)

		// Account generation
		tele.POST("/generate-account/:formId", handler.GenerateClientAccount)

		// Agreement
		tele.POST("/agreement", handler.CreateAgreement)
		tele.GET("/agreement/:formId", handler.GetAgreementByFormID)

		// Analytics & Dashboard
		tele.GET("/analytics", handler.GetAnalytics)
		tele.GET("/dashboard", handler.GetDashboard)
	}
}

// ── Public Form ────────────────────────────────────────────────────────

func (h *TelemarketingHandler) SubmitPublicForm(c *gin.Context) {
	var input usecase.TeleFormInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.IPAddress = c.ClientIP()

	form, err := h.uc.SubmitPublicForm(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "form submitted",
		"form_id":    form.ID,
		"route_type": form.RouteType,
		"status":     form.Status,
	})
}

func (h *TelemarketingHandler) GetFormByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form id"})
		return
	}

	form, err := h.uc.GetFormByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
		return
	}

	c.JSON(http.StatusOK, form)
}

// ── Forms Management ───────────────────────────────────────────────────

func (h *TelemarketingHandler) GetAllForms(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := map[string]interface{}{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if routeType := c.Query("route_type"); routeType != "" {
		filter["route_type"] = routeType
	}
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}

	forms, total, err := h.uc.GetAllForms(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  forms,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *TelemarketingHandler) GetMyForms(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role := middleware.GetUserRole(c)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := map[string]interface{}{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if routeType := c.Query("route_type"); routeType != "" {
		filter["route_type"] = routeType
	}
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}

	forms, total, err := h.uc.GetMyForms(userID, role, filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  forms,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *TelemarketingHandler) UpdateFormStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form id"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.UpdateFormStatus(id, domain.TeleFormStatus(input.Status)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

func (h *TelemarketingHandler) SetSelfDeclareType(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form id"})
		return
	}

	var input struct {
		SelfDeclareType string `json:"self_declare_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.SetSelfDeclareType(id, input.SelfDeclareType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "self declare type updated"})
}

// ── Meetings ───────────────────────────────────────────────────────────

func (h *TelemarketingHandler) ScheduleMeeting(c *gin.Context) {
	var input usecase.TeleMeetingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	input.TelemarketerID = userID.String()

	meeting, err := h.uc.ScheduleMeeting(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, meeting)
}

func (h *TelemarketingHandler) GetAllMeetings(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := map[string]interface{}{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}

	meetings, total, err := h.uc.GetAllMeetings(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  meetings,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *TelemarketingHandler) GetMyMeetings(c *gin.Context) {
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	meetings, total, err := h.uc.GetMyMeetings(userID, role, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  meetings,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *TelemarketingHandler) UpdateMeeting(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid meeting id"})
		return
	}

	var input usecase.TeleMeetingUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.uc.UpdateMeeting(id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "meeting updated"})
}

func (h *TelemarketingHandler) DeleteMeeting(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid meeting id"})
		return
	}

	if err := h.uc.DeleteMeeting(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "meeting deleted"})
}

// ── Account Generation ─────────────────────────────────────────────────

func (h *TelemarketingHandler) GenerateClientAccount(c *gin.Context) {
	formID, err := uuid.Parse(c.Param("formId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form id"})
		return
	}

	telemarketerID := middleware.GetUserID(c)

	result, err := h.uc.GenerateClientAccount(formID, telemarketerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// ── Agreement ──────────────────────────────────────────────────────────

func (h *TelemarketingHandler) CreateAgreement(c *gin.Context) {
	var input usecase.TeleAgreementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.IPAddress = c.ClientIP()

	agreement, err := h.uc.CreateAgreement(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, agreement)
}

func (h *TelemarketingHandler) GetAgreementByFormID(c *gin.Context) {
	formID, err := uuid.Parse(c.Param("formId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form id"})
		return
	}

	agreement, err := h.uc.GetAgreementByFormID(formID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "agreement not found"})
		return
	}

	c.JSON(http.StatusOK, agreement)
}

// ── Analytics & Dashboard ──────────────────────────────────────────────

func (h *TelemarketingHandler) GetAnalytics(c *gin.Context) {
	filter := map[string]interface{}{}

	// Optional: filter by telemarketer
	if telemarketerID := c.Query("telemarketer_id"); telemarketerID != "" {
		filter["telemarketer_id"] = telemarketerID
	}

	analytics, err := h.uc.GetAnalytics(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

func (h *TelemarketingHandler) GetDashboard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role := middleware.GetUserRole(c)

	dashboard, err := h.uc.GetDashboard(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dashboard)
}

// ── Public Pricing ─────────────────────────────────────────────────────

func (h *TelemarketingHandler) GetPendampinganPricing(c *gin.Context) {
	pricing, err := h.uc.GetPendampinganPricing()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pricing)
}
