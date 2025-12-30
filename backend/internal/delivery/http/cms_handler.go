package http

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CMSHandler struct {
	cmsUC usecase.CMSUsecase
}

func NewCMSHandler(r *gin.Engine, uc usecase.CMSUsecase) {
	handler := &CMSHandler{cmsUC: uc}

	public := r.Group("/public/cms")
	{
		public.GET("/news", handler.GetNews)
		public.GET("/blocks/:key", handler.GetBlock)
	}

	admin := r.Group("/admin/cms")
	// Auth middleware needed
	{
		admin.POST("/news", handler.CreateNews)
		admin.PUT("/blocks", handler.UpdateBlock)
	}
}

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
	c.JSON(http.StatusCreated, gin.H{"message": "news created"})
}

func (h *CMSHandler) GetBlock(c *gin.Context) {
	key := c.Param("key")
	block, err := h.cmsUC.GetContentBlock(key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "block not found"})
		return
	}
	c.JSON(http.StatusOK, block)
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
