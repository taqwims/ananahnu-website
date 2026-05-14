package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ananahnu/internal/usecase"
)

type SystemSettingHandler struct {
	settingUsecase usecase.SystemSettingUsecase
}

func NewSystemSettingHandler(r *gin.Engine, settingUsecase usecase.SystemSettingUsecase) {
	handler := &SystemSettingHandler{settingUsecase: settingUsecase}

	// Routes
	r.GET("/system-settings", handler.GetAllSettings)
	r.GET("/system-settings/:key", handler.GetSetting)
	r.PUT("/system-settings", handler.UpdateSetting)
}

func (h *SystemSettingHandler) GetSetting(c *gin.Context) {
	key := c.Param("key")
	defaultValue := c.Query("default")

	val, err := h.settingUsecase.GetSetting(key, defaultValue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"key": key, "value": val})
}

func (h *SystemSettingHandler) UpdateSetting(c *gin.Context) {
	var input struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.settingUsecase.UpdateSetting(input.Key, input.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Setting updated successfully"})
}

func (h *SystemSettingHandler) GetAllSettings(c *gin.Context) {
	settings, err := h.settingUsecase.GetAllSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Convert slice to map for easier frontend consumption
	settingMap := make(map[string]string)
	for _, s := range settings {
		settingMap[s.Key] = s.Value
	}

	c.JSON(http.StatusOK, settingMap)
}
