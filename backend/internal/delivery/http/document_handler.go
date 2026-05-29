package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DocumentHandler struct {
	documentUsecase usecase.DocumentUsecase
}

func NewDocumentHandler(r *gin.Engine, uc usecase.DocumentUsecase) {
	handler := &DocumentHandler{
		documentUsecase: uc,
	}

	g := r.Group("/documents")
	g.Use(middleware.AuthMiddleware())
	{
		g.GET("/submissions/:id/contract", handler.GenerateContract)
		g.GET("/submissions/:id/sph", handler.GenerateSPH)
	}
}

func (h *DocumentHandler) GenerateContract(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission id"})
		return
	}

	format := c.DefaultQuery("format", "docx")
	if format != "docx" && format != "pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported format, use docx or pdf"})
		return
	}

	data, filename, err := h.documentUsecase.GenerateContract(id, format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	contentType := "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	if format == "pdf" {
		contentType = "application/pdf"
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, data)
}

func (h *DocumentHandler) GenerateSPH(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission id"})
		return
	}

	data, filename, err := h.documentUsecase.GenerateSPH(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", data)
}
