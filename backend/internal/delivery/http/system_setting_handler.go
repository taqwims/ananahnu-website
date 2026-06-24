package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
)

type SystemSettingHandler struct {
	settingUsecase usecase.SystemSettingUsecase
}

func NewSystemSettingHandler(r *gin.Engine, settingUsecase usecase.SystemSettingUsecase) {
	handler := &SystemSettingHandler{settingUsecase: settingUsecase}

	// Public endpoint (tanpa AuthMiddleware)
	r.GET("/system-settings/public", handler.GetPublicSettings)

	// GET (read) boleh diakses semua user yang sudah login
	settings := r.Group("/system-settings")
	settings.Use(middleware.AuthMiddleware())
	{
		settings.GET("", handler.GetAllSettings)
		settings.GET("/:key", handler.GetSetting)
		// PUT (write) hanya DIRECTOR
		settings.PUT("", middleware.RoleMiddleware("DIRECTOR"), handler.UpdateSetting)
	}
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

func (h *SystemSettingHandler) GetPublicSettings(c *gin.Context) {
	settings, err := h.settingUsecase.GetAllSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	allowedKeys := map[string]bool{
		"COMPANY_NAME":    true,
		"COMPANY_ADDRESS": true,
		"COMPANY_PHONE":   true,
		"COMPANY_EMAIL":   true,
	}

	settingMap := make(map[string]string)
	for _, s := range settings {
		if allowedKeys[s.Key] {
			settingMap[s.Key] = s.Value
		}
	}

	c.JSON(http.StatusOK, settingMap)
}
