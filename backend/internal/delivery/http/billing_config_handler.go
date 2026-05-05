package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"

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
		g.GET("/product-categories", handler.GetProductCategories)
		g.POST("/product-categories", handler.CreateProductCategory)

		g.GET("/business-scales", handler.GetBusinessScales)
		g.POST("/business-scales", handler.CreateBusinessScale)

		g.GET("/halal-agencies", handler.GetHalalAgencies)
		g.POST("/halal-agencies", handler.CreateHalalAgency)

		g.GET("/components", handler.GetBillingComponents)
		g.POST("/components", handler.CreateBillingComponent)

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

func (h *BillingConfigHandler) GetProductCategories(c *gin.Context) {
	data, err := h.uc.GetProductCategories()
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

func (h *BillingConfigHandler) GetHalalAgencies(c *gin.Context) {
	data, err := h.uc.GetHalalAgencies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BillingConfigHandler) CreateHalalAgency(c *gin.Context) {
	var input domain.HalalAgency
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreateHalalAgency(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *BillingConfigHandler) GetBillingComponents(c *gin.Context) {
	data, err := h.uc.GetBillingComponents()
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
	if role != "FINANCE" && role != "ADMIN_KEUANGAN" && role != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only finance staff can set costs"})
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
