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

type FormConfigHandler struct {
	formConfigUC usecase.FormConfigUsecase
}

func NewFormConfigHandler(r *gin.Engine, uc usecase.FormConfigUsecase) {
	handler := &FormConfigHandler{formConfigUC: uc}

	// Form config admin CRUD
	g := r.Group("/form-config")
	{
		g.GET("/:formType", handler.GetConfig)
		g.POST("/", handler.CreateField)
		g.PUT("/:id", handler.UpdateField)
		g.DELETE("/:id", handler.DeleteField)
	}

	// Submission field values
	f := r.Group("/submission-fields")
	f.Use(middleware.AuthMiddleware())
	{
		f.POST("/:submissionId", handler.SubmitFieldValues)
		f.GET("/:submissionId", handler.GetFieldValues)
	}
}

// GetConfig returns all form field configs for a given form type.
func (h *FormConfigHandler) GetConfig(c *gin.Context) {
	formType := c.Param("formType")
	var btIDPtr *int64
	if btIDStr := c.Query("business_type_id"); btIDStr != "" {
		if id, err := strconv.ParseInt(btIDStr, 10, 64); err == nil {
			btIDPtr = &id
		}
	}

	configs, err := h.formConfigUC.GetFormConfig(formType, btIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

// CreateField creates a new form field config (admin only).
func (h *FormConfigHandler) CreateField(c *gin.Context) {
	var input domain.FormFieldConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.formConfigUC.CreateField(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdateField updates an existing form field config (admin only).
func (h *FormConfigHandler) UpdateField(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.FormFieldConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id

	if err := h.formConfigUC.UpdateField(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "field updated"})
}

// DeleteField deletes a form field config (admin only).
func (h *FormConfigHandler) DeleteField(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.formConfigUC.DeleteField(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "field deleted"})
}

// SubmitFieldValues submits form field values for a submission.
func (h *FormConfigHandler) SubmitFieldValues(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	var inputs []usecase.FieldValueInput
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uploaderID := middleware.GetUserID(c)

	if err := h.formConfigUC.SubmitFieldValues(subID, uploaderID, inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "field values submitted"})
}

// GetFieldValues returns all submitted field values for a submission.
func (h *FormConfigHandler) GetFieldValues(c *gin.Context) {
	subID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
		return
	}

	values, err := h.formConfigUC.GetFieldValues(subID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, values)
}
