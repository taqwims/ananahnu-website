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
		// PUT (write) DIRECTOR, MANAGER, ADMIN, HALAL_DIRECTOR, HALAL_MANAGER
		settings.PUT("", middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN", "HALAL_DIRECTOR", "HALAL_MANAGER"), handler.UpdateSetting)
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
		Key      string            `json:"key"`
		Value    *string           `json:"value"`
		Settings map[string]string `json:"settings"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Support batch update jika "settings" map disediakan
	if len(input.Settings) > 0 {
		for k, v := range input.Settings {
			if err := h.settingUsecase.UpdateSetting(k, v); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
		c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully"})
		return
	}

	// Single key-value update
	if input.Key != "" {
		val := ""
		if input.Value != nil {
			val = *input.Value
		}
		if err := h.settingUsecase.UpdateSetting(input.Key, val); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Setting updated successfully"})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Field 'key' or 'settings' is required"})
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
		"COMPANY_NAME":               true,
		"COMPANY_ADDRESS":            true,
		"COMPANY_PHONE":              true,
		"COMPANY_EMAIL":              true,
		"CS_PHONE":                   true,
		"CS_NAME":                    true,
		"SUPPORT_EMAIL":              true,
		"OPERATIONAL_HOURS":          true,
		"CONSULTATION_PHONE":         true,
		"WHATSAPP_DEFAULT_MESSAGE":   true,
		"admin_whatsapp_number":      true,
		"company_phone":              true,
		"company_email":              true,
		"company_address":            true,
		"company_name":               true,
		"BRAND_NAME":                 true,
		"SOCIAL_INSTAGRAM":           true,
		"SOCIAL_TIKTOK":              true,
		"SOCIAL_YOUTUBE":             true,
		"SOCIAL_LINKEDIN":            true,
		"COMPANY_WEBSITE":            true,
		"facilitation_quota_limit":   true,
		"facilitation_quota_used":    true,
		"PAYMENT_GATEWAY_ACTIVE":     true,
		"PAYMENT_MANUAL_ENABLED":     true,
		"PAYMENT_ONLINE_ENABLED":     true,
		"PAYMENT_BANK_NAME":          true,
		"PAYMENT_BANK_ACCOUNT_NO":    true,
		"PAYMENT_BANK_ACCOUNT_NAME":  true,
		"MIDTRANS_CLIENT_KEY":        true,
		"MIDTRANS_IS_PRODUCTION":     true,
		"MAYAR_IS_PRODUCTION":        true,
	}

	settingMap := make(map[string]string)
	for _, s := range settings {
		if allowedKeys[s.Key] {
			settingMap[s.Key] = s.Value
		}
	}

	c.JSON(http.StatusOK, settingMap)
}
