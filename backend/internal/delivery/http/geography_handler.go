package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type GeographyHandler struct {
	geoUC usecase.GeographyUsecase
}

func NewGeographyHandler(r *gin.Engine, uc usecase.GeographyUsecase) {
	handler := &GeographyHandler{geoUC: uc}

	geo := r.Group("/geography")
	{
		// GET boleh diakses tanpa auth (dipakai di form publik & submission)
		geo.GET("/provinces", handler.GetProvinces)
		geo.GET("/regencies/:provinceId", handler.GetRegencies)
		geo.GET("/districts/:regencyId", handler.GetDistricts)

		// Write — hanya DIRECTOR, MANAGER, ADMIN_KEUANGAN
		geoAdmin := geo.Group("")
		geoAdmin.Use(middleware.AuthMiddleware())
		geoAdmin.Use(middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_KEUANGAN"))
		{
			geoAdmin.POST("/provinces", handler.CreateProvince)
			geoAdmin.PUT("/provinces/:id", handler.UpdateProvince)
			geoAdmin.DELETE("/provinces/:id", handler.DeleteProvince)

			geoAdmin.POST("/regencies", handler.CreateRegency)
			geoAdmin.PUT("/regencies/:id", handler.UpdateRegency)
			geoAdmin.DELETE("/regencies/:id", handler.DeleteRegency)

			geoAdmin.POST("/districts", handler.CreateDistrict)
			geoAdmin.PUT("/districts/:id", handler.UpdateDistrict)
			geoAdmin.DELETE("/districts/:id", handler.DeleteDistrict)
		}
	}

	// Billing Rates
	rates := r.Group("/billing-rates")
	{
		rates.GET("/", handler.GetBillingRates)

		ratesAdmin := rates.Group("")
		ratesAdmin.Use(middleware.AuthMiddleware())
		ratesAdmin.Use(middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_KEUANGAN"))
		{
			ratesAdmin.POST("/", handler.CreateBillingRate)
			ratesAdmin.PUT("/:id", handler.UpdateBillingRate)
			ratesAdmin.DELETE("/:id", handler.DeleteBillingRate)
		}
	}
}

// --- Province ---

func (h *GeographyHandler) GetProvinces(c *gin.Context) {
	provinces, err := h.geoUC.GetProvinces()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, provinces)
}

func (h *GeographyHandler) CreateProvince(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p, err := h.geoUC.CreateProvince(input.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *GeographyHandler) UpdateProvince(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.geoUC.UpdateProvince(id, input.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *GeographyHandler) DeleteProvince(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.geoUC.DeleteProvince(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// --- Regency ---

func (h *GeographyHandler) GetRegencies(c *gin.Context) {
	provinceID, _ := strconv.ParseInt(c.Param("provinceId"), 10, 64)
	regencies, err := h.geoUC.GetRegencies(provinceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, regencies)
}

func (h *GeographyHandler) CreateRegency(c *gin.Context) {
	var input struct {
		ProvinceID int64  `json:"province_id" binding:"required"`
		Name       string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	r, err := h.geoUC.CreateRegency(input.ProvinceID, input.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, r)
}

func (h *GeographyHandler) UpdateRegency(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.geoUC.UpdateRegency(id, input.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *GeographyHandler) DeleteRegency(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.geoUC.DeleteRegency(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// --- District ---

func (h *GeographyHandler) GetDistricts(c *gin.Context) {
	regencyID, _ := strconv.ParseInt(c.Param("regencyId"), 10, 64)
	districts, err := h.geoUC.GetDistricts(regencyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, districts)
}

func (h *GeographyHandler) CreateDistrict(c *gin.Context) {
	var input struct {
		RegencyID int64  `json:"regency_id" binding:"required"`
		Name      string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d, err := h.geoUC.CreateDistrict(input.RegencyID, input.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, d)
}

func (h *GeographyHandler) UpdateDistrict(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.geoUC.UpdateDistrict(id, input.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *GeographyHandler) DeleteDistrict(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.geoUC.DeleteDistrict(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// --- Billing Rates ---

func (h *GeographyHandler) GetBillingRates(c *gin.Context) {
	serviceType := c.Query("service_type")
	rates, err := h.geoUC.GetBillingRates(serviceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rates)
}

func (h *GeographyHandler) CreateBillingRate(c *gin.Context) {
	var input domain.BillingRate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.geoUC.CreateBillingRate(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *GeographyHandler) UpdateBillingRate(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input domain.BillingRate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.geoUC.UpdateBillingRate(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *GeographyHandler) DeleteBillingRate(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.geoUC.DeleteBillingRate(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
