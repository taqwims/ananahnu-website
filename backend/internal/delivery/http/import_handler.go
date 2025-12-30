package http

import (
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ImportHandler struct {
	importUC usecase.ImportUsecase
}

func NewImportHandler(r *gin.Engine, uc usecase.ImportUsecase) {
	handler := &ImportHandler{importUC: uc}

	r.POST("/clients/import", handler.ImportClients)
}

func (h *ImportHandler) ImportClients(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	if err := h.importUC.ImportClients(file); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "import success"})
}
