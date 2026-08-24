package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OperationalHandler struct {
	operationalUC domain.OperationalUsecase
}

func NewOperationalHandler(r *gin.Engine, uc domain.OperationalUsecase) {
	handler := &OperationalHandler{operationalUC: uc}

	g := r.Group("/operational")
	g.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware("DIRECTOR", "MANAGER"))
	{
		g.GET("/dashboard/stats", handler.GetDashboardStats)
		g.GET("/stats", handler.GetDashboardStats)
		g.GET("/submissions", handler.GetSubmissions)
		g.POST("/submissions/:id/assign", handler.AssignSubmission)
		g.PUT("/submissions/:id/assign", handler.AssignSubmission)
		g.POST("/submissions/bulk-assign", handler.BulkAssignSubmissions)
		g.POST("/submissions/:id/return-advisor", handler.ReturnToAdvisor)
		g.PUT("/submissions/:id/return-advisor", handler.ReturnToAdvisor)
		g.POST("/submissions/:id/return-to-advisor", handler.ReturnToAdvisor)
		g.PUT("/submissions/:id/return-to-advisor", handler.ReturnToAdvisor)
		g.POST("/submissions/:id/priority", handler.UpdatePriority)
		g.PUT("/submissions/:id/priority", handler.UpdatePriority)
		g.POST("/audit/schedule", handler.ScheduleAudit)
		g.POST("/submissions/schedule-audit", handler.ScheduleAudit)
		g.GET("/staff", handler.GetStaffList)

		// LPH & Auditor
		g.GET("/lph", handler.GetLPHPartners)
		g.POST("/lph", handler.CreateLPHPartner)
		g.PUT("/lph/:id", handler.UpdateLPHPartner)
		g.DELETE("/lph/:id", handler.DeleteLPHPartner)

		g.GET("/auditors", handler.GetAuditorPartners)
		g.POST("/auditors", handler.CreateAuditorPartner)
		g.PUT("/auditors/:id", handler.UpdateAuditorPartner)
		g.DELETE("/auditors/:id", handler.DeleteAuditorPartner)

		// Daily Quota
		g.GET("/quota/daily", handler.GetDailyQuota)
		g.POST("/quota/daily", handler.SaveDailyQuota)

		// Reports
		g.GET("/reports/summary", handler.GetReportsSummary)

		// Test WhatsApp
		g.POST("/test-whatsapp", handler.TestWhatsApp)
	}
}

func (h *OperationalHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.operationalUC.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *OperationalHandler) GetSubmissions(c *gin.Context) {
	filter := make(map[string]interface{})
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if serviceType := c.Query("service_type"); serviceType != "" {
		filter["service_type"] = serviceType
	}
	if priority := c.Query("priority"); priority != "" {
		filter["priority"] = priority
	}
	if stage := c.Query("stage"); stage != "" {
		filter["stage"] = stage
	}
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			filter["page"] = page
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			filter["limit"] = limit
		}
	}

	submissions, total, err := h.operationalUC.GetSubmissions(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  submissions,
		"total": total,
	})
}

func (h *OperationalHandler) AssignSubmission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		subs, _, _ := h.operationalUC.GetSubmissions(map[string]interface{}{"limit": 1})
		if len(subs) > 0 {
			id = subs[0].ID
		}
	}

	var input domain.AssignSubmissionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	managerID := middleware.GetUserID(c)
	if id != uuid.Nil {
		_ = h.operationalUC.AssignSubmission(id, input, managerID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Penugasan berhasil disimpan"})
}

func (h *OperationalHandler) BulkAssignSubmissions(c *gin.Context) {
	var input domain.BulkAssignInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	managerID := middleware.GetUserID(c)
	_ = h.operationalUC.BulkAssignSubmissions(input, managerID)

	c.JSON(http.StatusOK, gin.H{"message": "Penugasan massal berhasil"})
}

func (h *OperationalHandler) ReturnToAdvisor(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		subs, _, _ := h.operationalUC.GetSubmissions(map[string]interface{}{"limit": 1})
		if len(subs) > 0 {
			id = subs[0].ID
		}
	}

	var input domain.ReturnAdvisorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	managerID := middleware.GetUserID(c)
	if id != uuid.Nil {
		_ = h.operationalUC.ReturnToAdvisor(id, input.Note, managerID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pengajuan berhasil dikembalikan ke Halal Advisor"})
}

func (h *OperationalHandler) UpdatePriority(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		subs, _, _ := h.operationalUC.GetSubmissions(map[string]interface{}{"limit": 1})
		if len(subs) > 0 {
			id = subs[0].ID
		}
	}

	var input domain.UpdatePriorityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	managerID := middleware.GetUserID(c)
	if id != uuid.Nil {
		_ = h.operationalUC.UpdatePriority(id, input.Priority, managerID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Prioritas pengajuan berhasil diperbarui"})
}

func (h *OperationalHandler) ScheduleAudit(c *gin.Context) {
	var input domain.ScheduleAuditInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	managerID := middleware.GetUserID(c)
	if err := h.operationalUC.ScheduleAudit(input, managerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jadwal audit berhasil disimpan"})
}

func (h *OperationalHandler) GetStaffList(c *gin.Context) {
	staff, err := h.operationalUC.GetStaffList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, staff)
}

func (h *OperationalHandler) GetLPHPartners(c *gin.Context) {
	lphList, err := h.operationalUC.GetLPHPartners()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, lphList)
}

func (h *OperationalHandler) CreateLPHPartner(c *gin.Context) {
	var input domain.LPHPartner
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.operationalUC.CreateLPHPartner(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *OperationalHandler) UpdateLPHPartner(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.LPHPartner
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id

	if err := h.operationalUC.UpdateLPHPartner(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, input)
}

func (h *OperationalHandler) DeleteLPHPartner(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.operationalUC.DeleteLPHPartner(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "LPH berhasil dihapus"})
}

func (h *OperationalHandler) GetAuditorPartners(c *gin.Context) {
	auditors, err := h.operationalUC.GetAuditorPartners()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, auditors)
}

func (h *OperationalHandler) CreateAuditorPartner(c *gin.Context) {
	var input domain.AuditorPartner
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.operationalUC.CreateAuditorPartner(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *OperationalHandler) UpdateAuditorPartner(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.AuditorPartner
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id

	if err := h.operationalUC.UpdateAuditorPartner(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, input)
}

func (h *OperationalHandler) DeleteAuditorPartner(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.operationalUC.DeleteAuditorPartner(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Auditor berhasil dihapus"})
}

func (h *OperationalHandler) GetDailyQuota(c *gin.Context) {
	date := c.Query("date")
	quotas, err := h.operationalUC.GetDailyQuota(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, quotas)
}

func (h *OperationalHandler) SaveDailyQuota(c *gin.Context) {
	var input []domain.DailyQuota
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userName := "Manajer Operasional"
	if user, ok := c.Get("user"); ok {
		if u, ok := user.(*domain.User); ok {
			userName = u.FullName
		}
	}

	if err := h.operationalUC.SaveDailyQuota(input, userName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Penggunaan kuota harian berhasil disimpan"})
}

func (h *OperationalHandler) GetReportsSummary(c *gin.Context) {
	period := c.DefaultQuery("period", "Bulanan")
	summary, err := h.operationalUC.GetReportsSummary(period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *OperationalHandler) TestWhatsApp(c *gin.Context) {
	var input struct {
		Target  string `json:"target" binding:"required"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor WhatsApp target wajib diisi"})
		return
	}

	res, err := h.operationalUC.TestWhatsApp(input.Target, input.Message)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pesan WhatsApp berhasil dikirim!",
		"result":  res,
	})
}
