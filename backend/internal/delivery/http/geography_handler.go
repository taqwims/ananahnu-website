package http

import (
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
		// Province
		geo.GET("/provinces", handler.GetProvinces)
		geo.POST("/provinces", handler.CreateProvince)
		geo.PUT("/provinces/:id", handler.UpdateProvince)
		geo.DELETE("/provinces/:id", handler.DeleteProvince)

		// Regency
		geo.GET("/regencies/:provinceId", handler.GetRegencies)
		geo.POST("/regencies", handler.CreateRegency)
		geo.PUT("/regencies/:id", handler.UpdateRegency)
		geo.DELETE("/regencies/:id", handler.DeleteRegency)

		// District
		geo.GET("/districts/:regencyId", handler.GetDistricts)
		geo.POST("/districts", handler.CreateDistrict)
		geo.PUT("/districts/:id", handler.UpdateDistrict)
		geo.DELETE("/districts/:id", handler.DeleteDistrict)
	}

	// Billing Rates
	rates := r.Group("/billing-rates")
	{
		rates.GET("/", handler.GetBillingRates)
		rates.POST("/", handler.CreateBillingRate)
		rates.PUT("/:id", handler.UpdateBillingRate)
		rates.DELETE("/:id", handler.DeleteBillingRate)
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
