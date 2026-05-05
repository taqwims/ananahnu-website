package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CMSHandler struct {
	cmsUC usecase.CMSUsecase
}

func NewCMSHandler(r *gin.Engine, uc usecase.CMSUsecase) {
	handler := &CMSHandler{cmsUC: uc}

	// Public endpoints
	public := r.Group("/public/cms")
	{
		public.GET("/news", handler.GetNews)
		public.GET("/blocks/:key", handler.GetBlock)
		public.GET("/blocks", handler.ListBlocks)
		public.GET("/affiliates", handler.ListAffiliates)
		public.GET("/products", handler.ListProducts)
	}

	// Admin endpoints (auth required)
	admin := r.Group("/admin/cms")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.RoleMiddleware("DIRECTOR", "MANAGER"))
	{
		// News
		admin.POST("/news", handler.CreateNews)
		admin.PUT("/news/:id", handler.UpdateNews)
		admin.DELETE("/news/:id", handler.DeleteNews)

		// Content Blocks
		admin.PUT("/blocks", handler.UpdateBlock)

		// Affiliates
		admin.POST("/affiliates", handler.CreateAffiliate)
		admin.PUT("/affiliates/:id", handler.UpdateAffiliate)
		admin.DELETE("/affiliates/:id", handler.DeleteAffiliate)

		// Certified Products
		admin.POST("/products", handler.CreateProduct)
		admin.PUT("/products/:id", handler.UpdateProduct)
		admin.DELETE("/products/:id", handler.DeleteProduct)
	}
}

// --- News ---

func (h *CMSHandler) GetNews(c *gin.Context) {
	news, err := h.cmsUC.GetNews()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, news)
}

func (h *CMSHandler) CreateNews(c *gin.Context) {
	var input domain.News
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.cmsUC.CreateNews(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "news created", "id": input.ID})
}

func (h *CMSHandler) UpdateNews(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.News
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cmsUC.UpdateNews(id, &input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "news updated"})
}

func (h *CMSHandler) DeleteNews(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.cmsUC.DeleteNews(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "news deleted"})
}

// --- Content Blocks ---

func (h *CMSHandler) GetBlock(c *gin.Context) {
	key := c.Param("key")
	block, err := h.cmsUC.GetContentBlock(key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "block not found"})
		return
	}
	c.JSON(http.StatusOK, block)
}

func (h *CMSHandler) ListBlocks(c *gin.Context) {
	blocks, err := h.cmsUC.ListContentBlocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, blocks)
}

func (h *CMSHandler) UpdateBlock(c *gin.Context) {
	var input domain.ContentBlock
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.cmsUC.UpdateContentBlock(input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "block updated"})
}

// --- Affiliates ---

func (h *CMSHandler) ListAffiliates(c *gin.Context) {
	affiliates, err := h.cmsUC.ListAffiliates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, affiliates)
}

func (h *CMSHandler) CreateAffiliate(c *gin.Context) {
	var input domain.Affiliate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.cmsUC.CreateAffiliate(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "affiliate created", "id": input.ID})
}

func (h *CMSHandler) UpdateAffiliate(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.Affiliate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cmsUC.UpdateAffiliate(id, &input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "affiliate updated"})
}

func (h *CMSHandler) DeleteAffiliate(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.cmsUC.DeleteAffiliate(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "affiliate deleted"})
}

// --- Certified Products ---

func (h *CMSHandler) ListProducts(c *gin.Context) {
	products, err := h.cmsUC.ListCertifiedProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (h *CMSHandler) CreateProduct(c *gin.Context) {
	var input domain.CertifiedProduct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.cmsUC.CreateCertifiedProduct(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "product created", "id": input.ID})
}

func (h *CMSHandler) UpdateProduct(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input domain.CertifiedProduct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cmsUC.UpdateCertifiedProduct(id, &input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "product updated"})
}

func (h *CMSHandler) DeleteProduct(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.cmsUC.DeleteCertifiedProduct(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}
