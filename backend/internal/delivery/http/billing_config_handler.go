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

type BillingConfigHandler struct {
	uc usecase.BillingConfigUsecase
}

func NewBillingConfigHandler(r *gin.Engine, uc usecase.BillingConfigUsecase) {
	handler := &BillingConfigHandler{uc: uc}

	g := r.Group("/billing-config")
	g.Use(middleware.AuthMiddleware())
	{
		g.GET("/sales-schemes", handler.GetSalesSchemes)
		g.POST("/sales-schemes", handler.CreateSalesScheme)
		g.PUT("/sales-schemes/:id", handler.UpdateSalesScheme)
		g.DELETE("/sales-schemes/:id", handler.DeleteSalesScheme)

		g.GET("/business-types", handler.GetBusinessTypes)
		g.POST("/business-types", handler.CreateBusinessType)
		g.PUT("/business-types/:id", handler.UpdateBusinessType)
		g.DELETE("/business-types/:id", handler.DeleteBusinessType)

		g.GET("/product-categories", handler.GetProductCategories)
		g.POST("/product-categories", handler.CreateProductCategory)
		g.PUT("/product-categories/:id", handler.UpdateProductCategory)
		g.DELETE("/product-categories/:id", handler.DeleteProductCategory)

		g.GET("/business-scales", handler.GetBusinessScales)
		g.POST("/business-scales", handler.CreateBusinessScale)
		g.PUT("/business-scales/:id", handler.UpdateBusinessScale)
		g.DELETE("/business-scales/:id", handler.DeleteBusinessScale)

		g.GET("/components", handler.GetBillingComponents)
		g.POST("/components", handler.CreateBillingComponent)
		g.PUT("/components/:id", handler.UpdateBillingComponent)
		g.DELETE("/components/:id", handler.DeleteBillingComponent)

		g.GET("/scheme-prices", handler.GetSalesSchemePrices)
		g.POST("/scheme-prices", handler.CreateSalesSchemePrice)
		g.PUT("/scheme-prices/:id", handler.UpdateSalesSchemePrice)
		g.DELETE("/scheme-prices/:id", handler.DeleteSalesSchemePrice)

		g.GET("/coordinator-rates", handler.GetCoordinatorRates)
		g.POST("/coordinator-rates", handler.SaveCoordinatorRate)
	}

	s := r.Group("/submissions")
	s.Use(middleware.AuthMiddleware())
	{
		s.GET("/:id/cost-detail", handler.GetSubmissionCost)
		s.POST("/:id/cost-detail", handler.SaveSubmissionCost)
	}
}

func (h *BillingConfigHandler) GetSalesSchemes(c *gin.Context) {
	data, err := h.uc.GetSalesSchemes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateSalesScheme(c *gin.Context) {
	var input domain.SalesScheme
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateSalesScheme(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) UpdateSalesScheme(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var input domain.SalesScheme
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.uc.UpdateSalesScheme(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) DeleteSalesScheme(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.uc.DeleteSalesScheme(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *BillingConfigHandler) GetBusinessTypes(c *gin.Context) {
	data, err := h.uc.GetBusinessTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateBusinessType(c *gin.Context) {
	var input domain.BusinessType
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateBusinessType(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) UpdateBusinessType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var input domain.BusinessType
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.uc.UpdateBusinessType(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) DeleteBusinessType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.uc.DeleteBusinessType(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *BillingConfigHandler) GetProductCategories(c *gin.Context) {
	filter := map[string]interface{}{}
	if v := c.Query("business_type_id"); v != "" {
		filter["business_type_id"] = v
	}
	data, err := h.uc.GetProductCategoriesFiltered(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateProductCategory(c *gin.Context) {
	var input domain.ProductCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateProductCategory(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) UpdateProductCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var input domain.ProductCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.uc.UpdateProductCategory(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) DeleteProductCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.uc.DeleteProductCategory(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *BillingConfigHandler) GetBusinessScales(c *gin.Context) {
	data, err := h.uc.GetBusinessScales()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateBusinessScale(c *gin.Context) {
	var input domain.BusinessScale
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateBusinessScale(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) UpdateBusinessScale(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var input domain.BusinessScale
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.uc.UpdateBusinessScale(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) DeleteBusinessScale(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.uc.DeleteBusinessScale(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}


func (h *BillingConfigHandler) GetBillingComponents(c *gin.Context) {
	filter := map[string]interface{}{}
	if v := c.Query("type"); v != "" {
		filter["type"] = v
	}
	if v := c.Query("category"); v != "" {
		filter["category"] = v
	}
	if v := c.Query("business_type_id"); v != "" {
		filter["business_type_id"] = v
	}
	if v := c.Query("product_category_id"); v != "" {
		filter["product_category_id"] = v
	}
	if v := c.Query("is_mandatory"); v != "" {
		filter["is_mandatory"] = v
	}
	if v := c.Query("business_scale_id"); v != "" {
		filter["business_scale_id"] = v
	}
	if v := c.Query("sales_scheme_id"); v != "" {
		filter["sales_scheme_id"] = v
	}
	if v := c.Query("data_source"); v != "" {
		filter["data_source"] = v
	}
	if v := c.Query("province_id"); v != "" {
		filter["province_id"] = v
	}
	if v := c.Query("regency_id"); v != "" {
		filter["regency_id"] = v
	}
	if v := c.Query("district_id"); v != "" {
		filter["district_id"] = v
	}
	if v := c.Query("resolve_geography"); v == "true" {
		filter["resolve_geography"] = true
	}

	data, err := h.uc.GetBillingComponentsFiltered(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateBillingComponent(c *gin.Context) {
	var input domain.BillingComponent
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateBillingComponent(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) UpdateBillingComponent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var input domain.BillingComponent
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.uc.UpdateBillingComponent(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) DeleteBillingComponent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.uc.DeleteBillingComponent(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *BillingConfigHandler) GetSubmissionCost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission id"})
		return
	}
	
	detail, err := h.uc.GetSubmissionCost(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, detail)
}

func (h *BillingConfigHandler) SaveSubmissionCost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission id"})
		return
	}
	
	role := middleware.GetUserRole(c)
	if role != "FINANCE" && role != "ADMIN_KEUANGAN" && role != "ADMIN" && role != "DIRECTOR" && role != "HALAL_ADVISOR" && role != "MARKETING" && role != "HALAL_MANAGER" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only authorized staff can set costs"})
		return
	}
	
	var input domain.SubmissionCostDetail
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	input.SubmissionID = id
	if err := h.uc.SaveSubmissionCost(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) GetCoordinatorRates(c *gin.Context) {
	data, err := h.uc.GetCoordinatorRates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) SaveCoordinatorRate(c *gin.Context) {
	var input domain.CoordinatorRate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.SetCoordinatorRate(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

// --- SalesSchemePrice Handlers ---

func (h *BillingConfigHandler) GetSalesSchemePrices(c *gin.Context) {
	filter := map[string]interface{}{}
	if v := c.Query("sales_scheme_id"); v != "" {
		filter["sales_scheme_id"] = v
	}
	if v := c.Query("data_source"); v != "" {
		filter["data_source"] = v
	}
	if v := c.Query("product_category_id"); v != "" {
		filter["product_category_id"] = v
	}
	if v := c.Query("business_type_id"); v != "" {
		filter["business_type_id"] = v
	}
	if v := c.Query("business_scale_id"); v != "" {
		filter["business_scale_id"] = v
	}

	data, err := h.uc.GetSalesSchemePrices(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateSalesSchemePrice(c *gin.Context) {
	var input domain.SalesSchemePrice
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateSalesSchemePrice(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) UpdateSalesSchemePrice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.SalesSchemePrice
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.uc.UpdateSalesSchemePrice(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, input)
}

func (h *BillingConfigHandler) DeleteSalesSchemePrice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.uc.DeleteSalesSchemePrice(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}
