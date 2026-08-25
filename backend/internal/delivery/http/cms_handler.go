package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"fmt"
	"html"
	"net/http"
	"os"
	"strconv"
	"strings"

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
		public.GET("/news/categories", handler.GetNewsCategories)
		public.GET("/news/sitemap", handler.GetNewsSitemap)
		public.GET("/news/:slug", handler.GetNewsDetail)
		public.GET("/news/:slug/share", handler.GetNewsShareHTML)
		public.GET("/news/:slug/og", handler.GetNewsShareHTML)
		public.GET("/blocks/:key", handler.GetBlock)
		public.GET("/blocks", handler.ListBlocks)
		public.GET("/affiliates", handler.ListAffiliates)
		public.GET("/products", handler.ListProducts)
	}

	// Root share shortcut for bots
	r.GET("/share/news/:slug", handler.GetNewsShareHTML)

	// Admin endpoints (auth required)
	admin := r.Group("/admin/cms")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.RoleMiddleware("DIRECTOR", "MANAGER", "MARKETING", "BUSINESS_DEVELOPMENT", "ADMIN_PELATIHAN"))
	{
		// News
		admin.GET("/news", handler.AdminListNews)
		admin.GET("/news/categories", handler.GetNewsCategories)
		admin.GET("/news/:id", handler.AdminGetNewsByID)
		admin.POST("/news", handler.CreateNews)
		admin.PUT("/news/:id", handler.UpdateNews)
		admin.PATCH("/news/:id/status", handler.ToggleNewsStatus)
		admin.PATCH("/news/:id/featured", handler.ToggleNewsFeatured)
		admin.PATCH("/news/:id/landing", handler.ToggleNewsLanding)
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
	search := c.Query("search")
	category := c.Query("category")
	landingOnly := c.Query("landing_only") == "true"
	featuredOnly := c.Query("featured_only") == "true"
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))

	news, total, err := h.cmsUC.ListNews(search, category, true, landingOnly, featuredOnly, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":  news,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *CMSHandler) GetNewsDetail(c *gin.Context) {
	slugOrID := c.Param("slug")
	news, related, err := h.cmsUC.GetNewsDetail(slugOrID, true)
	if err != nil || news == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artikel tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":    news,
		"related": related,
	})
}

// GetNewsShareHTML generates fully-rendered OpenGraph HTML for Social Media Crawlers (WhatsApp, Facebook, Twitter, LinkedIn)
func (h *CMSHandler) GetNewsShareHTML(c *gin.Context) {
	slugOrID := c.Param("slug")
	news, _, err := h.cmsUC.GetNewsDetail(slugOrID, false)
	if err != nil || news == nil {
		c.String(http.StatusNotFound, "Artikel tidak ditemukan")
		return
	}

	// 1. Determine base protocol & host dynamically
	scheme := "https"
	if c.Request.TLS == nil && c.GetHeader("X-Forwarded-Proto") != "https" {
		if strings.HasPrefix(c.Request.Host, "localhost") || strings.HasPrefix(c.Request.Host, "127.0.0.1") {
			scheme = "http"
		}
	}
	currentOrigin := fmt.Sprintf("%s://%s", scheme, c.Request.Host)

	siteURL := os.Getenv("FRONTEND_URL")
	if siteURL == "" {
		siteURL = os.Getenv("APP_FRONTEND_URL")
	}
	if siteURL == "" {
		siteURL = currentOrigin
	}
	if strings.Contains(siteURL, ",") {
		siteURL = strings.Split(siteURL, ",")[0]
	}
	siteURL = strings.TrimRight(siteURL, "/")

	apiURL := os.Getenv("API_BASE_URL")
	if apiURL == "" {
		apiURL = currentOrigin
	}
	apiURL = strings.TrimRight(apiURL, "/")

	title := news.MetaTitle
	if title == "" {
		title = news.Title
	}

	desc := news.MetaDescription
	if desc == "" {
		desc = news.Excerpt
	}
	if desc == "" && news.Content != "" {
		clean := strings.ReplaceAll(news.Content, "#", "")
		clean = strings.ReplaceAll(clean, "*", "")
		if len(clean) > 160 {
			clean = clean[:160] + "..."
		}
		desc = clean
	}

	// Priority: OG Image -> Thumbnail URL -> Fallback Icon
	rawImg := strings.TrimSpace(news.OGImageURL)
	if rawImg == "" {
		rawImg = strings.TrimSpace(news.ThumbnailURL)
	}

	imgURL := rawImg
	if imgURL == "" {
		imgURL = siteURL + "/icon.png"
	} else if !strings.HasPrefix(imgURL, "http://") && !strings.HasPrefix(imgURL, "https://") {
		if !strings.HasPrefix(imgURL, "/") {
			imgURL = "/" + imgURL
		}
		imgURL = apiURL + imgURL
	}

	imgType := "image/jpeg"
	lowerImg := strings.ToLower(imgURL)
	if strings.Contains(lowerImg, ".png") {
		imgType = "image/png"
	} else if strings.Contains(lowerImg, ".webp") {
		imgType = "image/webp"
	} else if strings.Contains(lowerImg, ".gif") {
		imgType = "image/gif"
	}

	articleURL := fmt.Sprintf("%s/news/%s", siteURL, news.Slug)

	safeTitle := html.EscapeString(title)
	safeDesc := html.EscapeString(desc)
	safeImg := html.EscapeString(imgURL)
	safeURL := html.EscapeString(articleURL)

	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s | Halal Core</title>
    <meta name="description" content="%s">
    <link rel="canonical" href="%s">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="Halal Core">
    <meta property="og:type" content="article">
    <meta property="og:url" content="%s">
    <meta property="og:title" content="%s">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s">
    <meta property="og:image:secure_url" content="%s">
    <meta property="og:image:type" content="%s">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="%s">
    <meta property="og:locale" content="id_ID">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="%s">
    <meta name="twitter:title" content="%s">
    <meta name="twitter:description" content="%s">
    <meta name="twitter:image" content="%s">
    <meta name="twitter:image:alt" content="%s">

    <!-- Immediate Redirect for Human Visitors -->
    <meta http-equiv="refresh" content="0; url=%s">
    <script>window.location.replace("%s");</script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; text-align: center; color: #1e293b; background: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <img src="%s" alt="%s" style="max-width: 100%%; height: auto; border-radius: 0.75rem; margin-bottom: 1.5rem; max-height: 300px; object-fit: cover;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 1.25rem;">%s</h2>
        <p style="color: #64748b; font-size: 0.95rem; line-height: 1.5;">%s</p>
        <p style="margin-top: 1.5rem;"><a href="%s" style="display: inline-block; padding: 0.75rem 1.5rem; background: #005a48; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: bold;">Baca Artikel Selengkapnya &rarr;</a></p>
    </div>
</body>
</html>`,
		safeTitle, safeDesc, safeURL,
		safeURL, safeTitle, safeDesc, safeImg, safeImg, imgType, safeTitle,
		safeURL, safeTitle, safeDesc, safeImg, safeTitle,
		safeURL, safeURL,
		safeImg, safeTitle, safeTitle, safeDesc, safeURL,
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, htmlContent)
}

func (h *CMSHandler) GetNewsCategories(c *gin.Context) {
	categories, err := h.cmsUC.GetNewsCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (h *CMSHandler) GetNewsSitemap(c *gin.Context) {
	news, _, err := h.cmsUC.ListNews("", "", true, false, false, 1, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var sitemapItems []gin.H
	for _, item := range news {
		sitemapItems = append(sitemapItems, gin.H{
			"slug":          item.Slug,
			"title":         item.Title,
			"category":      item.Category,
			"published_at":  item.PublishedAt,
			"updated_at":    item.UpdatedAt,
			"thumbnail_url": item.ThumbnailURL,
			"url":           fmt.Sprintf("/news/%s", item.Slug),
		})
	}
	c.JSON(http.StatusOK, sitemapItems)
}

func (h *CMSHandler) AdminListNews(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")
	landingOnly := c.Query("landing_only") == "true"
	featuredOnly := c.Query("featured_only") == "true"
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	news, total, err := h.cmsUC.ListNews(search, category, false, landingOnly, featuredOnly, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":  news,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *CMSHandler) AdminGetNewsByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	news, err := h.cmsUC.GetNewsByID(id)
	if err != nil || news == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artikel tidak ditemukan"})
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
	c.JSON(http.StatusCreated, gin.H{"message": "news created", "data": input})
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
	c.JSON(http.StatusOK, gin.H{"message": "news updated", "data": input})
}

func (h *CMSHandler) ToggleNewsStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var body struct {
		IsPublished bool `json:"is_published"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cmsUC.ToggleNewsStatus(id, body.IsPublished); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "status updated", "is_published": body.IsPublished})
}

func (h *CMSHandler) ToggleNewsFeatured(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var body struct {
		IsFeatured bool `json:"is_featured"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cmsUC.ToggleNewsFeatured(id, body.IsFeatured); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "featured status updated", "is_featured": body.IsFeatured})
}

func (h *CMSHandler) ToggleNewsLanding(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var body struct {
		ShowOnLanding bool `json:"show_on_landing"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cmsUC.ToggleNewsLanding(id, body.ShowOnLanding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "landing status updated", "show_on_landing": body.ShowOnLanding})
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
