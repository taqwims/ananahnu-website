package http

import (
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ExportHandler struct {
	exportUC usecase.ExportUsecase
}

func NewExportHandler(r *gin.Engine, uc usecase.ExportUsecase) {
	handler := &ExportHandler{exportUC: uc}

	r.GET("/reports/export", handler.Export)
}

func (h *ExportHandler) Export(c *gin.Context) {
	format := c.Query("type") // xlsx or pdf
	if format == "" {
		format = "xlsx"
	}

	filter := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if facilitator := c.Query("facilitator"); facilitator != "" {
		filter["facilitator_name"] = facilitator
	}
	if startDate := c.Query("start_date"); startDate != "" {
		filter["start_date"] = startDate
	}
	if endDate := c.Query("end_date"); endDate != "" {
		filter["end_date"] = endDate
	}

	data, err := h.exportUC.ExportClients(filter, format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if format == "xlsx" {
		c.Header("Content-Disposition", "attachment; filename=report.xlsx")
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	} else {
		c.Header("Content-Disposition", "attachment; filename=report.pdf")
		c.Header("Content-Type", "application/pdf")
	}

	c.Data(http.StatusOK, c.Writer.Header().Get("Content-Type"), data)
}
