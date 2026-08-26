package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

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
		public.GET("/news/:slug/render", handler.GetNewsRenderHTML)
		public.GET("/news/render", handler.GetNewsListRenderHTML)
		public.GET("/landing/render", handler.GetLandingRenderHTML)
		public.GET("/sitemap.xml", handler.GetDynamicSitemapXML)
		public.GET("/sitemap-news.xml", handler.GetDynamicSitemapXML)
		public.GET("/feed.xml", handler.GetNewsRSSFeed)
		public.GET("/rss.xml", handler.GetNewsRSSFeed)
		public.GET("/blocks/:key", handler.GetBlock)
		public.GET("/blocks", handler.ListBlocks)
		public.GET("/affiliates", handler.ListAffiliates)
		public.GET("/products", handler.ListProducts)
	}

	// Root SEO, Bot Pre-rendering, and Feed shortcuts
	r.GET("/sitemap.xml", handler.GetDynamicSitemapXML)
	r.GET("/sitemap-news.xml", handler.GetDynamicSitemapXML)
	r.GET("/rss.xml", handler.GetNewsRSSFeed)
	r.GET("/feed.xml", handler.GetNewsRSSFeed)
	r.GET("/news/feed.xml", handler.GetNewsRSSFeed)
	r.GET("/share/news/:slug", handler.GetNewsShareHTML)
	r.GET("/render/news", handler.GetNewsListRenderHTML)
	r.GET("/render/news/:slug", handler.GetNewsRenderHTML)
	r.GET("/render/landing", handler.GetLandingRenderHTML)
	r.GET("/render/home", handler.GetLandingRenderHTML)

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

var (
	sitemapCacheMu  sync.RWMutex
	sitemapCacheXML []byte
	sitemapCacheExp time.Time

	rssCacheMu  sync.RWMutex
	rssCacheXML []byte
	rssCacheExp time.Time
)

// GetDynamicSitemapXML generates standard XML sitemap for Search Engine Crawlers (Googlebot, Bingbot)
func (h *CMSHandler) GetDynamicSitemapXML(c *gin.Context) {
	sitemapCacheMu.RLock()
	if len(sitemapCacheXML) > 0 && time.Now().Before(sitemapCacheExp) {
		cached := sitemapCacheXML
		sitemapCacheMu.RUnlock()
		c.Header("Content-Type", "application/xml; charset=utf-8")
		c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
		c.Data(http.StatusOK, "application/xml; charset=utf-8", cached)
		return
	}
	sitemapCacheMu.RUnlock()

	siteURL := getBaseSiteURL(c)
	apiURL := getBaseAPIURL(c)

	news, _, err := h.cmsUC.ListNews("", "", true, false, false, 1, 5000)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error generating sitemap")
		return
	}

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	sb.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` + "\n")
	sb.WriteString(`        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` + "\n")
	sb.WriteString(`        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">` + "\n")

	nowStr := time.Now().Format("2006-01-02")

	// Static core pages
	staticPages := []struct {
		loc        string
		changefreq string
		priority   string
	}{
		{"/", "daily", "1.0"},
		{"/news", "daily", "0.9"},
		{"/track", "weekly", "0.8"},
		{"/register", "monthly", "0.6"},
		{"/login", "monthly", "0.5"},
	}

	for _, p := range staticPages {
		sb.WriteString("  <url>\n")
		sb.WriteString(fmt.Sprintf("    <loc>%s%s</loc>\n", siteURL, p.loc))
		sb.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", nowStr))
		sb.WriteString(fmt.Sprintf("    <changefreq>%s</changefreq>\n", p.changefreq))
		sb.WriteString(fmt.Sprintf("    <priority>%s</priority>\n", p.priority))
		sb.WriteString("  </url>\n")
	}

	// Dynamic News Articles
	for _, item := range news {
		lastmod := item.UpdatedAt
		if lastmod.IsZero() {
			lastmod = item.PublishedAt
		}
		if lastmod.IsZero() {
			lastmod = item.CreatedAt
		}
		lastmodStr := lastmod.Format("2006-01-02")

		imgURL := resolveMediaURL(item.ThumbnailURL, apiURL, siteURL)
		if imgURL == "" {
			imgURL = resolveMediaURL(item.OGImageURL, apiURL, siteURL)
		}

		sb.WriteString("  <url>\n")
		sb.WriteString(fmt.Sprintf("    <loc>%s/news/%s</loc>\n", siteURL, item.Slug))
		sb.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", lastmodStr))
		sb.WriteString("    <changefreq>weekly</changefreq>\n")
		sb.WriteString("    <priority>0.8</priority>\n")

		if imgURL != "" {
			sb.WriteString("    <image:image>\n")
			sb.WriteString(fmt.Sprintf("      <image:loc>%s</image:loc>\n", html.EscapeString(imgURL)))
			sb.WriteString(fmt.Sprintf("      <image:title>%s</image:title>\n", html.EscapeString(item.Title)))
			sb.WriteString("    </image:image>\n")
		}

		sb.WriteString("  </url>\n")
	}

	sb.WriteString("</urlset>\n")

	xmlBytes := []byte(sb.String())

	sitemapCacheMu.Lock()
	sitemapCacheXML = xmlBytes
	sitemapCacheExp = time.Now().Add(15 * time.Minute)
	sitemapCacheMu.Unlock()

	c.Header("Content-Type", "application/xml; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
	c.Data(http.StatusOK, "application/xml; charset=utf-8", xmlBytes)
}

// GetNewsRSSFeed generates standard RSS 2.0 feed for Google News, Publisher Center, and RSS readers
func (h *CMSHandler) GetNewsRSSFeed(c *gin.Context) {
	rssCacheMu.RLock()
	if len(rssCacheXML) > 0 && time.Now().Before(rssCacheExp) {
		cached := rssCacheXML
		rssCacheMu.RUnlock()
		c.Header("Content-Type", "application/rss+xml; charset=utf-8")
		c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
		c.Data(http.StatusOK, "application/rss+xml; charset=utf-8", cached)
		return
	}
	rssCacheMu.RUnlock()

	siteURL := getBaseSiteURL(c)

	news, _, err := h.cmsUC.ListNews("", "", true, false, false, 1, 50)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error generating RSS feed")
		return
	}

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	sb.WriteString(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">` + "\n")
	sb.WriteString("  <channel>\n")
	sb.WriteString("    <title>Halal Core | Berita &amp; Knowledge Center</title>\n")
	sb.WriteString(fmt.Sprintf("    <link>%s/news</link>\n", siteURL))
	sb.WriteString("    <description>Berita terkini, regulasi sertifikasi halal BPJPH, wawasan industri, dan edukasi bisnis halal profesional dari Halal Core.</description>\n")
	sb.WriteString("    <language>id-ID</language>\n")
	sb.WriteString(fmt.Sprintf("    <lastBuildDate>%s</lastBuildDate>\n", time.Now().Format(time.RFC1123Z)))
	sb.WriteString(fmt.Sprintf("    <atom:link href=\"%s/rss.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n", siteURL))

	for _, item := range news {
		pubDate := item.PublishedAt
		if pubDate.IsZero() {
			pubDate = item.CreatedAt
		}

		desc := item.Excerpt
		if desc == "" {
			desc = cleanPlainText(item.Content, 200)
		}

		sb.WriteString("    <item>\n")
		sb.WriteString(fmt.Sprintf("      <title>%s</title>\n", html.EscapeString(item.Title)))
		sb.WriteString(fmt.Sprintf("      <link>%s/news/%s</link>\n", siteURL, item.Slug))
		sb.WriteString(fmt.Sprintf("      <guid isPermaLink=\"true\">%s/news/%s</guid>\n", siteURL, item.Slug))
		sb.WriteString(fmt.Sprintf("      <pubDate>%s</pubDate>\n", pubDate.Format(time.RFC1123Z)))
		if item.Category != "" {
			sb.WriteString(fmt.Sprintf("      <category>%s</category>\n", html.EscapeString(item.Category)))
		}
		sb.WriteString(fmt.Sprintf("      <description>%s</description>\n", html.EscapeString(desc)))
		sb.WriteString("    </item>\n")
	}

	sb.WriteString("  </channel>\n")
	sb.WriteString("</rss>\n")

	rssBytes := []byte(sb.String())

	rssCacheMu.Lock()
	rssCacheXML = rssBytes
	rssCacheExp = time.Now().Add(15 * time.Minute)
	rssCacheMu.Unlock()

	c.Header("Content-Type", "application/rss+xml; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
	c.Data(http.StatusOK, "application/rss+xml; charset=utf-8", rssBytes)
}

// GetNewsRenderHTML generates FULL Semantic HTML for Search Engine Crawlers (Googlebot, Bingbot, Baiduspider)
// This delivers complete content with NewsArticle & Breadcrumb Schema, H1-H3 headings, full body text, and NO redirect loops.
func (h *CMSHandler) GetNewsRenderHTML(c *gin.Context) {
	slugOrID := c.Param("slug")
	news, related, err := h.cmsUC.GetNewsDetail(slugOrID, true)
	if err != nil || news == nil {
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusNotFound, `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Artikel Tidak Ditemukan | Halal Core</title><meta name="robots" content="noindex, follow"></head><body style="font-family:sans-serif;padding:3rem;text-align:center;"><h1>Artikel Tidak Ditemukan</h1><p><a href="/news">Kembali ke Berita</a></p></body></html>`)
		return
	}

	siteURL := getBaseSiteURL(c)
	apiURL := getBaseAPIURL(c)

	title := news.MetaTitle
	if title == "" {
		title = news.Title
	}

	desc := news.MetaDescription
	if desc == "" {
		desc = news.Excerpt
	}
	if desc == "" && news.Content != "" {
		desc = cleanPlainText(news.Content, 160)
	}

	keywords := news.MetaKeywords
	if keywords == "" {
		keywords = "sertifikasi halal, halal core, berita halal, bpjph, halal indonesia"
		if news.Tags != "" {
			keywords = news.Tags + ", " + keywords
		}
	}

	author := news.AuthorName
	if author == "" {
		author = "Tim Halal Core"
	}

	rawImg := strings.TrimSpace(news.OGImageURL)
	if rawImg == "" {
		rawImg = strings.TrimSpace(news.ThumbnailURL)
	}
	imgURL := resolveMediaURL(rawImg, apiURL, siteURL)
	if imgURL == "" {
		imgURL = siteURL + "/icon.png"
	}

	articleURL := fmt.Sprintf("%s/news/%s", siteURL, news.Slug)
	pubDateISO := news.PublishedAt.Format(time.RFC3339)
	updDateISO := news.UpdatedAt.Format(time.RFC3339)
	if news.UpdatedAt.IsZero() {
		updDateISO = pubDateISO
	}
	formattedDate := formatDateIndonesian(news.PublishedAt)

	// JSON-LD Structured Data
	schemaData := []map[string]interface{}{
		{
			"@context": "https://schema.org",
			"@type":    "NewsArticle",
			"mainEntityOfPage": map[string]interface{}{
				"@type": "@id",
				"@id":   articleURL,
			},
			"headline":      news.Title,
			"description":   desc,
			"image":         []string{imgURL},
			"datePublished": pubDateISO,
			"dateModified":  updDateISO,
			"author": map[string]interface{}{
				"@type": "Person",
				"name":  author,
			},
			"publisher": map[string]interface{}{
				"@type": "Organization",
				"name":  "Halal Core",
				"logo": map[string]interface{}{
					"@type": "ImageObject",
					"url":   siteURL + "/icon.png",
				},
			},
			"articleSection": news.Category,
			"keywords":       news.Tags,
		},
		{
			"@context": "@type",
			"@type":    "BreadcrumbList",
			"itemListElement": []map[string]interface{}{
				{
					"@type":    "ListItem",
					"position": 1,
					"name":     "Beranda",
					"item":     siteURL,
				},
				{
					"@type":    "ListItem",
					"position": 2,
					"name":     "Berita",
					"item":     siteURL + "/news",
				},
				{
					"@type":    "ListItem",
					"position": 3,
					"name":     news.Title,
					"item":     articleURL,
				},
			},
		},
	}

	schemaJSON, _ := json.Marshal(schemaData)

	// Convert Markdown Content to Semantic HTML
	renderedBody := renderMarkdownToHTML(news.Content, apiURL, siteURL)

	// Related articles HTML
	var relatedHTML strings.Builder
	if len(related) > 0 {
		relatedHTML.WriteString(`<section class="related-section">`)
		relatedHTML.WriteString(`<h2>Artikel Terkait</h2>`)
		relatedHTML.WriteString(`<div class="related-grid">`)
		for _, rel := range related {
			relImg := resolveMediaURL(rel.ThumbnailURL, apiURL, siteURL)
			if relImg == "" {
				relImg = siteURL + "/icon.png"
			}
			relatedHTML.WriteString(fmt.Sprintf(`
				<article class="related-card">
					<a href="%s/news/%s" class="related-link">
						<img src="%s" alt="%s" loading="lazy" class="related-thumb">
						<div class="related-info">
							<span class="related-cat">%s</span>
							<h3 class="related-title">%s</h3>
						</div>
					</a>
				</article>`,
				siteURL, rel.Slug,
				html.EscapeString(relImg), html.EscapeString(rel.Title),
				html.EscapeString(rel.Category),
				html.EscapeString(rel.Title),
			))
		}
		relatedHTML.WriteString(`</div></section>`)
	}

	// Tags HTML
	var tagsHTML strings.Builder
	if news.Tags != "" {
		tags := strings.Split(news.Tags, ",")
		tagsHTML.WriteString(`<div class="tags-container"><span class="tags-label">Tags:</span> `)
		for _, tag := range tags {
			t := strings.TrimSpace(tag)
			if t != "" {
				tagsHTML.WriteString(fmt.Sprintf(`<span class="tag-badge">#%s</span> `, html.EscapeString(t)))
			}
		}
		tagsHTML.WriteString(`</div>`)
	}

	readingTime := news.ReadingTime
	if readingTime <= 0 {
		readingTime = 3
	}

	safeTitle := html.EscapeString(title)
	safeDesc := html.EscapeString(desc)
	safeKeywords := html.EscapeString(keywords)
	safeAuthor := html.EscapeString(author)
	safeImg := html.EscapeString(imgURL)
	safeURL := html.EscapeString(articleURL)
	safeCategory := html.EscapeString(news.Category)

	htmlOutput := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s | Halal Core</title>
    <meta name="description" content="%s">
    <meta name="keywords" content="%s">
    <meta name="author" content="%s">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="%s">

    <!-- Open Graph Meta Tags -->
    <meta property="og:site_name" content="Halal Core">
    <meta property="og:type" content="article">
    <meta property="og:url" content="%s">
    <meta property="og:title" content="%s">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s">
    <meta property="og:image:alt" content="%s">
    <meta property="og:locale" content="id_ID">
    <meta property="article:published_time" content="%s">
    <meta property="article:modified_time" content="%s">
    <meta property="article:author" content="%s">
    <meta property="article:section" content="%s">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="%s">
    <meta name="twitter:title" content="%s">
    <meta name="twitter:description" content="%s">
    <meta name="twitter:image" content="%s">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    %s
    </script>

    <style>
        :root {
            --brand-primary: #005a48;
            --brand-dark: #00382d;
            --brand-accent: #059669;
            --brand-light: #ecfdf5;
            --text-main: #0f172a;
            --text-muted: #475569;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --border-color: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: var(--text-main);
            background-color: var(--bg-page);
            line-height: 1.7;
            font-size: 16px;
        }
        a { color: var(--brand-primary); text-decoration: none; }
        a:hover { text-decoration: underline; }
        header.site-header {
            background: #ffffff;
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 1.5rem;
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .header-inner {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .logo-text { font-size: 1.25rem; font-weight: 800; color: var(--brand-primary); }
        .nav-links a { margin-left: 1.25rem; color: var(--text-muted); font-weight: 500; font-size: 0.9rem; }
        .nav-links a:hover { color: var(--brand-primary); }
        main.main-content { max-width: 860px; margin: 2rem auto; padding: 0 1.25rem; }
        .breadcrumb { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem; }
        .breadcrumb ol { display: flex; flex-wrap: wrap; list-style: none; gap: 0.5rem; align-items: center; }
        .breadcrumb li { display: flex; align-items: center; gap: 0.5rem; }
        article.article-wrap {
            background: var(--bg-card);
            border-radius: 1.25rem;
            padding: 2.5rem 2rem;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--border-color);
        }
        .category-badge {
            display: inline-block;
            background: var(--brand-light);
            color: var(--brand-primary);
            font-weight: 700;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            margin-bottom: 1rem;
        }
        h1.article-title {
            font-size: 2.25rem;
            font-weight: 800;
            line-height: 1.25;
            color: #0f172a;
            margin-bottom: 1.25rem;
            letter-spacing: -0.02em;
        }
        .article-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.25rem;
            font-size: 0.9rem;
            color: var(--text-muted);
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 2rem;
        }
        .article-meta span { display: inline-flex; align-items: center; gap: 0.35rem; }
        figure.featured-image { margin-bottom: 2rem; border-radius: 1rem; overflow: hidden; }
        figure.featured-image img { width: 100%%; height: auto; display: block; max-height: 480px; object-fit: cover; }
        figure.featured-image figcaption { font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem; text-align: center; font-style: italic; }
        .article-lead {
            font-size: 1.15rem;
            line-height: 1.6;
            color: #334155;
            font-weight: 500;
            margin-bottom: 2rem;
            padding: 1.25rem;
            background: #f1f5f9;
            border-left: 4px solid var(--brand-primary);
            border-radius: 0 0.75rem 0.75rem 0;
        }
        .article-body h2 { font-size: 1.65rem; font-weight: 700; color: #0f172a; margin: 2rem 0 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
        .article-body h3 { font-size: 1.35rem; font-weight: 600; color: #1e293b; margin: 1.5rem 0 0.75rem; }
        .article-body p { margin-bottom: 1.25rem; color: #334155; font-size: 1.05rem; }
        .article-body ul, .article-body ol { margin: 1rem 0 1.5rem 1.5rem; color: #334155; }
        .article-body li { margin-bottom: 0.5rem; }
        .article-body figure.article-image { margin: 2rem 0; border-radius: 0.75rem; overflow: hidden; border: 1px solid var(--border-color); }
        .article-body figure.article-image img { width: 100%%; max-height: 450px; object-fit: cover; display: block; }
        .article-body figure.article-image figcaption { font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem; text-align: center; }
        .article-body blockquote { margin: 1.5rem 0; padding: 1rem 1.5rem; background: var(--brand-light); border-left: 4px solid var(--brand-accent); font-style: italic; color: #065f46; border-radius: 0 0.5rem 0.5rem 0; }
        .article-body .callout-tip { margin: 1.5rem 0; padding: 1rem 1.25rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.75rem; display: flex; gap: 0.75rem; color: #92400e; }
        .article-body .table-container { overflow-x: auto; margin: 1.5rem 0; border: 1px solid var(--border-color); border-radius: 0.75rem; }
        .article-body table { width: 100%%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
        .article-body th { background: #f8fafc; padding: 0.75rem 1rem; border-bottom: 2px solid var(--border-color); font-weight: 700; color: #0f172a; }
        .article-body td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); color: #334155; }
        .tags-container { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); font-size: 0.9rem; }
        .tags-label { font-weight: 700; color: var(--text-muted); }
        .tag-badge { display: inline-block; background: #f1f5f9; color: var(--text-muted); padding: 0.25rem 0.6rem; border-radius: 0.5rem; margin: 0.25rem; font-size: 0.85rem; }
        .related-section { margin-top: 3rem; padding-top: 2rem; border-top: 2px solid var(--border-color); }
        .related-section h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.25rem; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
        .related-card { background: #ffffff; border: 1px solid var(--border-color); border-radius: 0.75rem; overflow: hidden; transition: transform 0.2s; }
        .related-card:hover { transform: translateY(-2px); }
        .related-link { display: block; color: inherit; }
        .related-thumb { width: 100%%; height: 130px; object-fit: cover; }
        .related-info { padding: 0.85rem; }
        .related-cat { font-size: 0.75rem; font-weight: 700; color: var(--brand-primary); text-transform: uppercase; }
        .related-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem; line-height: 1.35; }
        footer.site-footer { background: #ffffff; border-top: 1px solid var(--border-color); padding: 2rem 1.25rem; margin-top: 4rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); }
        @media (max-width: 640px) {
            h1.article-title { font-size: 1.65rem; }
            article.article-wrap { padding: 1.5rem 1rem; }
        }
    </style>
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <a href="%s/" class="logo-text">HALAL CORE</a>
            <nav class="nav-links">
                <a href="%s/">Beranda</a>
                <a href="%s/news">Berita &amp; Wawasan</a>
                <a href="%s/track">Lacak Sertifikasi</a>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <nav aria-label="Breadcrumb" class="breadcrumb">
            <ol>
                <li><a href="%s/">Beranda</a></li>
                <li><span>&rsaquo;</span></li>
                <li><a href="%s/news">Berita</a></li>
                <li><span>&rsaquo;</span></li>
                <li aria-current="page">%s</li>
            </ol>
        </nav>

        <article class="article-wrap">
            <header>
                <div class="category-badge">%s</div>
                <h1 class="article-title">%s</h1>
                <div class="article-meta">
                    <span>✍️ <strong>%s</strong></span>
                    <span>📅 <time datetime="%s">%s</time></span>
                    <span>⏱️ %d menit membaca</span>
                </div>
            </header>

            %s

            %s

            <div class="article-body">
                %s
            </div>

            %s
        </article>

        %s
    </main>

    <footer class="site-footer">
        <p>&copy; %d Halal Core Indonesia. Building Halal Business Excellence.</p>
        <p style="margin-top: 0.5rem;"><a href="%s/news">Index Berita</a> &bull; <a href="%s/sitemap.xml">Sitemap XML</a> &bull; <a href="%s/rss.xml">RSS Feed</a></p>
    </footer>
</body>
</html>`,
		safeTitle, safeDesc, safeKeywords, safeAuthor, safeURL,
		safeURL, safeTitle, safeDesc, safeImg, safeTitle,
		pubDateISO, updDateISO, safeAuthor, safeCategory,
		safeURL, safeTitle, safeDesc, safeImg,
		string(schemaJSON),
		siteURL, siteURL, siteURL, siteURL,
		siteURL, siteURL, safeTitle,
		safeCategory, safeTitle, safeAuthor, pubDateISO, formattedDate, readingTime,
		renderFeaturedImageHTML(imgURL, title),
		renderLeadHTML(news.Excerpt),
		renderedBody,
		tagsHTML.String(),
		relatedHTML.String(),
		time.Now().Year(),
		siteURL, siteURL, siteURL,
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
	c.String(http.StatusOK, htmlOutput)
}

// GetNewsListRenderHTML generates FULL Semantic HTML for the /news list page for Search Crawlers
func (h *CMSHandler) GetNewsListRenderHTML(c *gin.Context) {
	siteURL := getBaseSiteURL(c)
	apiURL := getBaseAPIURL(c)

	category := c.Query("category")
	news, total, err := h.cmsUC.ListNews("", category, true, false, false, 1, 30)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error generating news page")
		return
	}

	categories, _ := h.cmsUC.GetNewsCategories()

	pageTitle := "Pusat Edukasi & Berita Sertifikasi Halal Indonesia"
	pageDesc := "Kumpulan berita halal terbaru, regulasi BPJPH, panduan sertifikasi halal online gratis dan reguler, serta tips bisnis halal terpercaya dari para ahli Halal Core."
	pageURL := fmt.Sprintf("%s/news", siteURL)

	// Build ItemList schema
	var listItems []map[string]interface{}
	for i, item := range news {
		if i >= 10 {
			break
		}
		listItems = append(listItems, map[string]interface{}{
			"@type":    "ListItem",
			"position": i + 1,
			"url":      fmt.Sprintf("%s/news/%s", siteURL, item.Slug),
			"name":     item.Title,
		})
	}

	schemaData := []map[string]interface{}{
		{
			"@context": "https://schema.org",
			"@type":    "BreadcrumbList",
			"itemListElement": []map[string]interface{}{
				{
					"@type":    "ListItem",
					"position": 1,
					"name":     "Beranda",
					"item":     siteURL,
				},
				{
					"@type":    "ListItem",
					"position": 2,
					"name":     "Berita & Artikel",
					"item":     pageURL,
				},
			},
		},
		{
			"@context":        "https://schema.org",
			"@type":           "ItemList",
			"name":            pageTitle,
			"description":     pageDesc,
			"itemListElement": listItems,
		},
	}

	schemaJSON, _ := json.Marshal(schemaData)

	// Build category chips HTML
	var catHTML strings.Builder
	catHTML.WriteString(fmt.Sprintf(`<a href="%s/news" class="cat-chip active">Semua</a>`, siteURL))
	for _, cat := range categories {
		catHTML.WriteString(fmt.Sprintf(`<a href="%s/news?category=%s" class="cat-chip">%s</a>`, siteURL, html.EscapeString(cat), html.EscapeString(cat)))
	}

	// Build articles grid HTML
	var gridHTML strings.Builder
	for _, item := range news {
		imgURL := resolveMediaURL(item.ThumbnailURL, apiURL, siteURL)
		if imgURL == "" {
			imgURL = siteURL + "/icon.png"
		}
		formattedDate := formatDateIndonesian(item.PublishedAt)
		readTime := item.ReadingTime
		if readTime <= 0 {
			readTime = 3
		}

		gridHTML.WriteString(fmt.Sprintf(`
			<article class="news-card">
				<a href="%s/news/%s" class="news-card-link">
					<div class="news-thumb-wrap">
						<img src="%s" alt="%s" loading="lazy" width="400" height="220" class="news-thumb">
						<span class="news-cat-badge">%s</span>
					</div>
					<div class="news-card-body">
						<div class="news-card-meta">
							<span>%s</span> &bull; <span>%d min baca</span>
						</div>
						<h2 class="news-card-title">%s</h2>
						<p class="news-card-excerpt">%s</p>
						<span class="read-more-link">Baca Selengkapnya &rarr;</span>
					</div>
				</a>
			</article>`,
			siteURL, item.Slug,
			html.EscapeString(imgURL), html.EscapeString(item.Title),
			html.EscapeString(item.Category),
			formattedDate, readTime,
			html.EscapeString(item.Title),
			html.EscapeString(cleanPlainText(item.Excerpt, 120)),
		))
	}

	htmlOutput := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s | Halal Core</title>
    <meta name="description" content="%s">
    <meta name="keywords" content="berita halal indonesia, regulasi bpjph 2026, panduan sertifikasi halal, syarat sertifikat halal, sihalal, tips umkm halal">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="%s">

    <!-- Open Graph -->
    <meta property="og:site_name" content="Halal Core">
    <meta property="og:type" content="website">
    <meta property="og:url" content="%s">
    <meta property="og:title" content="%s | Halal Core">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s/icon.png">
    <meta property="og:locale" content="id_ID">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="%s | Halal Core">
    <meta name="twitter:description" content="%s">
    <meta name="twitter:image" content="%s/icon.png">

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    %s
    </script>

    <style>
        :root {
            --brand-primary: #005a48;
            --brand-dark: #00382d;
            --brand-accent: #059669;
            --brand-light: #ecfdf5;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --border-color: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: var(--text-main);
            background-color: var(--bg-page);
            line-height: 1.6;
        }
        a { color: inherit; text-decoration: none; }
        header.site-header {
            background: #ffffff;
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 1.5rem;
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .header-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .logo-text { font-size: 1.25rem; font-weight: 800; color: var(--brand-primary); }
        .nav-links a { margin-left: 1.25rem; color: var(--text-muted); font-weight: 500; font-size: 0.9rem; }
        .nav-links a:hover { color: var(--brand-primary); }
        
        .hero-banner {
            background: linear-gradient(135deg, #004033, #00261f);
            color: white;
            padding: 3.5rem 1.5rem;
            text-align: center;
        }
        .hero-banner h1 { font-size: 2.25rem; font-weight: 800; max-width: 800px; margin: 0 auto 1rem; }
        .hero-banner p { font-size: 1.05rem; color: #cbd5e1; max-width: 650px; margin: 0 auto; }

        .container { max-width: 1100px; margin: 2rem auto; padding: 0 1.25rem; }
        .cat-bar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; justify-content: center; }
        .cat-chip { padding: 0.4rem 1rem; background: white; border: 1px solid var(--border-color); border-radius: 9999px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .cat-chip.active, .cat-chip:hover { background: var(--brand-primary); color: white; border-color: var(--brand-primary); }

        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.75rem; }
        .news-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
        .news-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -3px rgba(0,0,0,0.1); }
        .news-thumb-wrap { position: relative; height: 200px; background: #e2e8f0; }
        .news-thumb { width: 100%%; height: 100%%; object-fit: cover; }
        .news-cat-badge { position: absolute; top: 0.75rem; left: 0.75rem; background: rgba(255,255,255,0.92); color: var(--brand-primary); padding: 0.25rem 0.65rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .news-card-body { padding: 1.25rem; }
        .news-card-meta { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        .news-card-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; line-height: 1.4; }
        .news-card-excerpt { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem; }
        .read-more-link { font-size: 0.85rem; font-weight: 700; color: var(--brand-primary); display: inline-block; }

        footer.site-footer { background: #ffffff; border-top: 1px solid var(--border-color); padding: 2.5rem 1.25rem; margin-top: 4rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); }
        @media(max-width: 640px) {
            .hero-banner h1 { font-size: 1.65rem; }
            .news-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <a href="%s/" class="logo-text">HALAL CORE</a>
            <nav class="nav-links">
                <a href="%s/">Beranda</a>
                <a href="%s/news" style="color:var(--brand-primary);font-weight:700;">Berita &amp; Wawasan</a>
                <a href="%s/track">Lacak Sertifikasi</a>
            </nav>
        </div>
    </header>

    <div class="hero-banner">
        <h1>Pusat Edukasi &amp; Berita Sertifikasi Halal</h1>
        <p>Regulasi BPJPH terbaru, wawasan industri, dan panduan sertifikasi halal terpercaya untuk memajukan bisnis Anda.</p>
    </div>

    <main class="container">
        <div class="cat-bar">
            %s
        </div>

        <div class="news-grid">
            %s
        </div>
    </main>

    <footer class="site-footer">
        <p>&copy; %d Halal Core Indonesia. Total %d Artikel Berita.</p>
        <p style="margin-top: 0.5rem;"><a href="%s/sitemap.xml">Sitemap XML</a> &bull; <a href="%s/rss.xml">RSS Feed 2.0</a></p>
    </footer>
</body>
</html>`,
		pageTitle, pageDesc, pageURL,
		pageURL, pageTitle, pageDesc, siteURL,
		pageTitle, pageDesc, siteURL,
		string(schemaJSON),
		siteURL, siteURL, siteURL, siteURL,
		catHTML.String(),
		gridHTML.String(),
		time.Now().Year(), total,
		siteURL, siteURL,
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
	c.String(http.StatusOK, htmlOutput)
}

// GetLandingRenderHTML generates FULL Semantic HTML for the Root Homepage (/) for Search Crawlers
func (h *CMSHandler) GetLandingRenderHTML(c *gin.Context) {
	siteURL := getBaseSiteURL(c)
	apiURL := getBaseAPIURL(c)

	// Fetch top 3 latest published news for internal linking
	news, _, _ := h.cmsUC.ListNews("", "", true, false, false, 1, 3)

	pageTitle := "Halal Core | Platform Pendampingan Sertifikasi Halal Resmi BPJPH"
	pageDesc := "Halal Core membantu pelaku usaha dan UMKM mendapatkan Sertifikat Halal resmi BPJPH dengan mudah, cepat, dan terpercaya. Layanan Self Declare Rp0, Reguler, dan Pelatihan Halal."
	pageURL := fmt.Sprintf("%s/", siteURL)

	faqs := []struct {
		Q string
		A string
	}{
		{
			Q: "Apa itu Sertifikasi Halal Self Declare dan apakah benar biayanya Rp0?",
			A: "Sertifikasi Halal Self Declare adalah program pernyataan halal khusus bagi pelaku Usaha Mikro dan Kecil (UMK) dengan produk berisiko rendah dan bahan baku bersertifikat halal. Melalui program SEHATI dari BPJPH Kementerian Agama, biaya pendaftaran difasilitasi 100% (subsidi pemerintah) sehingga Rp0 atau gratis bagi UMK yang memenuhi syarat.",
		},
		{
			Q: "Berapa lama estimasi proses pembuatan Sertifikat Halal sampai terbit?",
			A: "Untuk jalur Self Declare (Fasilitasi & Mandiri), proses verifikasi dokumen hingga penerbitan Sertifikat Halal memakan waktu rata-rata 12–21 hari kerja sejak berkas dinyatakan lengkap di SIHALAL. Untuk jalur Reguler (melibatkan LPH dan Sidang Fatwa MUI), proses berkisar antara 21–35 hari kerja.",
		},
		{
			Q: "Dokumen apa saja yang diperlukan untuk mengajukan Sertifikasi Halal?",
			A: "Persyaratan utama meliputi: NIB (Nomor Induk Berusaha) berbasis risiko, data identitas KTP pemilik usaha, daftar nama produk dan bahan baku yang digunakan, uraian alur proses produksi halal, serta foto produk. Halal Advisor kami akan mendampingi penyusunan dokumen manual SJPH.",
		},
		{
			Q: "Apa perbedaan sertifikasi halal jalur Reguler dan Self Declare?",
			A: "Jalur Self Declare diperuntukkan bagi UMK dengan bahan baku sederhana dan non-kritis (tanpa sembelihan hewan yang rumit). Sedangkan jalur Reguler terbuka untuk semua skala usaha (mikro, kecil, menengah, besar, hingga manufaktur pabrik) yang memiliki bahan kritis, fasilitas restoran, katering, atau jasa penyembelihan RPH.",
		},
		{
			Q: "Apakah sertifikat halal yang diproses resmi dari BPJPH Kemenag?",
			A: "Ya, 100% resmi. Seluruh sertifikasi halal yang didampingi oleh Halal Core diterbitkan langsung oleh Badan Penyelenggara Jaminan Produk Halal (BPJPH) Kementerian Agama Republik Indonesia dengan Ketetapan Halal resmi dari Komite Fatwa Produk Halal / Majelis Ulama Indonesia (MUI).",
		},
	}

	var faqEntities []map[string]interface{}
	var faqHTML strings.Builder
	for i, faq := range faqs {
		faqEntities = append(faqEntities, map[string]interface{}{
			"@type": "Question",
			"name":  faq.Q,
			"acceptedAnswer": map[string]interface{}{
				"@type": "Answer",
				"text":  faq.A,
			},
		})

		faqHTML.WriteString(fmt.Sprintf(`
			<div class="faq-card">
				<h3 class="faq-question"><strong>Q%d:</strong> %s</h3>
				<p class="faq-answer">%s</p>
			</div>`,
			i+1, html.EscapeString(faq.Q), html.EscapeString(faq.A),
		))
	}

	schemaData := []map[string]interface{}{
		{
			"@context":    "https://schema.org",
			"@type":       "Organization",
			"name":        "Halal Core",
			"url":         siteURL,
			"logo":        fmt.Sprintf("%s/icon.png", siteURL),
			"description": pageDesc,
			"sameAs": []string{
				"https://www.instagram.com/halalcore.id",
				"https://www.tiktok.com/@halalcore.id",
			},
		},
		{
			"@context": "https://schema.org",
			"@type":    "WebSite",
			"name":     "Halal Core Indonesia",
			"url":      siteURL,
			"potentialAction": map[string]interface{}{
				"@type":       "SearchAction",
				"target":      fmt.Sprintf("%s/news?search={search_term_string}", siteURL),
				"query-input": "required name=search_term_string",
			},
		},
		{
			"@context":   "https://schema.org",
			"@type":      "FAQPage",
			"mainEntity": faqEntities,
		},
	}

	schemaJSON, _ := json.Marshal(schemaData)

	// Build News HTML
	var newsHTML strings.Builder
	for _, item := range news {
		imgURL := resolveMediaURL(item.ThumbnailURL, apiURL, siteURL)
		if imgURL == "" {
			imgURL = siteURL + "/icon.png"
		}
		formattedDate := formatDateIndonesian(item.PublishedAt)
		newsHTML.WriteString(fmt.Sprintf(`
			<article class="news-item">
				<a href="%s/news/%s">
					<img src="%s" alt="%s" loading="lazy" class="news-thumb">
					<div class="news-meta">%s &bull; %s</div>
					<h3>%s</h3>
					<p>%s</p>
				</a>
			</article>`,
			siteURL, item.Slug,
			html.EscapeString(imgURL), html.EscapeString(item.Title),
			html.EscapeString(item.Category), formattedDate,
			html.EscapeString(item.Title),
			html.EscapeString(cleanPlainText(item.Excerpt, 100)),
		))
	}

	htmlOutput := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s</title>
    <meta name="description" content="%s">
    <meta name="keywords" content="sertifikasi halal, halal core, pendampingan halal online, sertifikat halal bpjph, halal indonesia, syarat sertifikat halal, sihalal, biaya sertifikasi halal">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="%s">

    <!-- Open Graph -->
    <meta property="og:site_name" content="Halal Core">
    <meta property="og:type" content="website">
    <meta property="og:url" content="%s">
    <meta property="og:title" content="%s">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s/icon.png">
    <meta property="og:locale" content="id_ID">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="%s">
    <meta name="twitter:description" content="%s">
    <meta name="twitter:image" content="%s/icon.png">

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    %s
    </script>

    <style>
        :root {
            --brand-primary: #004033;
            --brand-dark: #00261f;
            --brand-accent: #059669;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --border-color: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: var(--text-main); background: var(--bg-page); line-height: 1.6; }
        a { color: inherit; text-decoration: none; }
        header.site-header { background: #fff; border-bottom: 1px solid var(--border-color); padding: 1rem 1.5rem; position: sticky; top: 0; z-index: 50; }
        .header-inner { max-width: 1150px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .logo-text { font-size: 1.3rem; font-weight: 900; color: var(--brand-primary); letter-spacing: -0.5px; }
        .nav-links a { margin-left: 1.25rem; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
        .nav-links a:hover { color: var(--brand-primary); }

        .hero { background: linear-gradient(135deg, #004033 0%%, #00261f 100%%); color: white; padding: 4.5rem 1.5rem; text-align: center; }
        .hero-inner { max-width: 850px; margin: 0 auto; }
        .hero-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 0.35rem 1rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.25rem; color: #a7f3d0; }
        .hero h1 { font-size: 2.75rem; font-weight: 900; line-height: 1.2; margin-bottom: 1.25rem; }
        .hero p { font-size: 1.15rem; color: #cbd5e1; margin-bottom: 2rem; max-width: 700px; margin-left: auto; margin-right: auto; }
        .hero-cta { display: inline-flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: #059669; color: white; padding: 0.85rem 1.75rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.95rem; }
        .btn-secondary { background: white; color: var(--brand-primary); padding: 0.85rem 1.75rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.95rem; }

        .container { max-width: 1150px; margin: 3rem auto; padding: 0 1.25rem; }
        .section-header { text-align: center; margin-bottom: 2.5rem; }
        .section-header h2 { font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
        .section-header p { font-size: 1rem; color: var(--text-muted); }

        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 4rem; }
        .service-card { background: #fff; border: 1px solid var(--border-color); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .service-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1rem; }
        .badge-reguler { background: #ecfdf5; color: #065f46; }
        .badge-self { background: #fef3c7; color: #92400e; }
        .service-card h3 { font-size: 1.35rem; font-weight: 800; margin-bottom: 0.75rem; color: #0f172a; }
        .service-card p { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1.25rem; }

        .news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 4rem; }
        .news-item { background: #fff; border: 1px solid var(--border-color); border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
        .news-thumb { width: 100%%; height: 180px; object-fit: cover; }
        .news-item a { display: block; padding: 1.25rem; }
        .news-meta { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; }
        .news-item h3 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
        .news-item p { font-size: 0.85rem; color: var(--text-muted); }

        .faq-list { max-width: 850px; margin: 0 auto 4rem; display: flex; flex-direction: column; gap: 1rem; }
        .faq-card { background: #fff; border: 1px solid var(--border-color); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
        .faq-question { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
        .faq-answer { font-size: 0.95rem; color: #475569; line-height: 1.6; }

        footer.site-footer { background: #fff; border-top: 1px solid var(--border-color); padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
        @media (max-width: 640px) {
            .hero h1 { font-size: 1.85rem; }
            .hero p { font-size: 1rem; }
        }
    </style>
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <a href="%s/" class="logo-text">HALAL CORE</a>
            <nav class="nav-links">
                <a href="%s/">Beranda</a>
                <a href="%s/news">Berita &amp; Wawasan</a>
                <a href="%s/track">Lacak Pengajuan</a>
                <a href="%s/register" style="color:var(--brand-accent);">Daftar Sertifikasi</a>
            </nav>
        </div>
    </header>

    <section class="hero">
        <div class="hero-inner">
            <span class="hero-badge">Official Halal Certification Ecosystem</span>
            <h1>Satu Platform, Solusi Sertifikasi Halal Untuk Semua</h1>
            <p>Halal Core mendampingi pelaku usaha dan UMKM dalam pengurusan Sertifikat Halal resmi BPJPH Kementerian Agama secara mudah, cepat, dan terpercaya.</p>
            <div class="hero-cta">
                <a href="%s/register" class="btn-primary">Ajukan Layanan Halal</a>
                <a href="%s/news" class="btn-secondary">Baca Panduan &amp; Berita</a>
            </div>
        </div>
    </section>

    <main class="container">
        <section>
            <div class="section-header">
                <h2>Pilihan Jalur Sertifikasi Halal BPJPH</h2>
                <p>Pilih jalur sertifikasi halal yang sesuai dengan jenis produk dan skala usaha Anda</p>
            </div>
            <div class="services-grid">
                <div class="service-card">
                    <span class="service-badge badge-reguler">Jalur Reguler</span>
                    <h3>Sertifikasi Halal Reguler</h3>
                    <p>Pendampingan penuh dari audit dokumen, verifikasi Lembaga Pemeriksa Halal (LPH), hingga Sidang Fatwa MUI. Cocok untuk skala UKM, Menengah, Pabrik, dan Korporasi.</p>
                    <a href="%s/register" style="font-weight:700; color:#059669;">Daftar Reguler &rarr;</a>
                </div>
                <div class="service-card">
                    <span class="service-badge badge-self">Biaya Rp0 (Subsidi BPJPH)</span>
                    <h3>Self Declare Fasilitasi</h3>
                    <p>Program sertifikasi pernyataan halal bersubsidi 100%% dari BPJPH khusus bagi pelaku Usaha Mikro dan Kecil (UMK) dengan produk berisiko rendah.</p>
                    <a href="%s/register" style="font-weight:700; color:#059669;">Daftar Self Declare Fasilitasi &rarr;</a>
                </div>
                <div class="service-card">
                    <span class="service-badge badge-self">Proses Fleksibel</span>
                    <h3>Self Declare Mandiri</h3>
                    <p>Pendampingan intensif bagi pelaku usaha yang menginginkan proses verifikasi kilat, validasi SJPH terarah, dan bimbingan langsung dari Halal Advisor.</p>
                    <a href="%s/register" style="font-weight:700; color:#059669;">Daftar Self Declare Mandiri &rarr;</a>
                </div>
            </div>
        </section>

        <section>
            <div class="section-header">
                <h2>Berita &amp; Panduan Halal Terkini</h2>
                <p>Update regulasi terbaru, wawasan industri halal, dan panduan praktis dari para ahli</p>
            </div>
            <div class="news-grid">
                %s
            </div>
            <div style="text-align:center; margin-top:-2rem; margin-bottom:3.5rem;">
                <a href="%s/news" style="font-weight:700; color:var(--brand-primary); text-decoration:underline;">Lihat Semua Artikel Berita &rarr;</a>
            </div>
        </section>

        <section>
            <div class="section-header">
                <h2>Pertanyaan yang Sering Diajukan (FAQ)</h2>
                <p>Jawaban atas pertanyaan umum seputar pengurusan sertifikat halal resmi</p>
            </div>
            <div class="faq-list">
                %s
            </div>
        </section>
    </main>

    <footer class="site-footer">
        <p>&copy; %d Halal Core Indonesia. Building Halal Business Excellence.</p>
        <p style="margin-top: 0.5rem;"><a href="%s/news">Index Berita</a> &bull; <a href="%s/sitemap.xml">Sitemap XML</a> &bull; <a href="%s/rss.xml">RSS Feed</a> &bull; <a href="%s/track">Lacak Sertifikat</a></p>
    </footer>
</body>
</html>`,
		pageTitle, pageDesc, pageURL,
		pageURL, pageTitle, pageDesc, siteURL,
		pageTitle, pageDesc, siteURL,
		string(schemaJSON),
		siteURL, siteURL, siteURL, siteURL, siteURL,
		siteURL, siteURL,
		siteURL, siteURL, siteURL,
		newsHTML.String(),
		siteURL,
		faqHTML.String(),
		time.Now().Year(),
		siteURL, siteURL, siteURL, siteURL,
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800, s-maxage=3600")
	c.String(http.StatusOK, htmlOutput)
}

func renderFeaturedImageHTML(imgURL, title string) string {
	if imgURL == "" || strings.HasSuffix(imgURL, "/icon.png") {
		return ""
	}
	return fmt.Sprintf(`<figure class="featured-image"><img src="%s" alt="%s" width="1200" height="630" fetchpriority="high"><figcaption>%s</figcaption></figure>`, html.EscapeString(imgURL), html.EscapeString(title), html.EscapeString(title))
}

func renderLeadHTML(excerpt string) string {
	if strings.TrimSpace(excerpt) == "" {
		return ""
	}
	return fmt.Sprintf(`<div class="article-lead"><p>%s</p></div>`, html.EscapeString(excerpt))
}

func getBaseSiteURL(c *gin.Context) string {
	siteURL := os.Getenv("FRONTEND_URL")
	if siteURL == "" {
		siteURL = os.Getenv("APP_FRONTEND_URL")
	}
	if siteURL == "" {
		scheme := "https"
		if c.Request.TLS == nil && c.GetHeader("X-Forwarded-Proto") != "https" {
			if strings.HasPrefix(c.Request.Host, "localhost") || strings.HasPrefix(c.Request.Host, "127.0.0.1") {
				scheme = "http"
			}
		}
		siteURL = fmt.Sprintf("%s://%s", scheme, c.Request.Host)
	}
	if strings.Contains(siteURL, ",") {
		siteURL = strings.Split(siteURL, ",")[0]
	}
	return strings.TrimRight(siteURL, "/")
}

func getBaseAPIURL(c *gin.Context) string {
	apiURL := os.Getenv("API_BASE_URL")
	if apiURL == "" {
		apiURL = getBaseSiteURL(c)
	}
	if strings.Contains(apiURL, ",") {
		apiURL = strings.Split(apiURL, ",")[0]
	}
	return strings.TrimRight(apiURL, "/")
}

func resolveMediaURL(rawURL, apiURL, siteURL string) string {
	raw := strings.TrimSpace(rawURL)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if !strings.HasPrefix(raw, "/") {
		raw = "/" + raw
	}
	return apiURL + raw
}

func cleanPlainText(text string, maxLen int) string {
	clean := strings.ReplaceAll(text, "#", "")
	clean = strings.ReplaceAll(clean, "*", "")
	clean = strings.ReplaceAll(clean, "`", "")
	clean = strings.ReplaceAll(clean, "\n", " ")
	clean = strings.TrimSpace(clean)
	if len(clean) > maxLen && maxLen > 0 {
		return clean[:maxLen] + "..."
	}
	return clean
}

func formatDateIndonesian(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	months := []string{
		"", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
		"Juli", "Agustus", "September", "Oktober", "November", "Desember",
	}
	days := []string{
		"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
	}
	return fmt.Sprintf("%s, %d %s %d", days[t.Weekday()], t.Day(), months[t.Month()], t.Year())
}

func sanitizeSlug(text string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9\s-]`)
	cleaned := reg.ReplaceAllString(text, "")
	cleaned = strings.ToLower(strings.TrimSpace(cleaned))
	spaceReg := regexp.MustCompile(`\s+`)
	return spaceReg.ReplaceAllString(cleaned, "-")
}

func renderInlineMarkdown(text, apiURL, siteURL string) string {
	if text == "" {
		return ""
	}

	// Escape HTML first to prevent XSS
	escaped := html.EscapeString(text)

	// Bold: **text**
	boldReg := regexp.MustCompile(`\*\*(.+?)\*\*`)
	escaped = boldReg.ReplaceAllString(escaped, "<strong>$1</strong>")

	// Italic: *text*
	italicReg := regexp.MustCompile(`\*([^\*]+?)\*`)
	escaped = italicReg.ReplaceAllString(escaped, "<em>$1</em>")

	// Code: `text`
	codeReg := regexp.MustCompile("`([^`]+?)`")
	escaped = codeReg.ReplaceAllString(escaped, "<code>$1</code>")

	// Link: [label](url)
	linkReg := regexp.MustCompile(`\[(.+?)\]\((.+?)\)`)
	escaped = linkReg.ReplaceAllStringFunc(escaped, func(m string) string {
		match := linkReg.FindStringSubmatch(m)
		if len(match) == 3 {
			label := match[1]
			url := match[2]
			return fmt.Sprintf(`<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>`, url, label)
		}
		return m
	})

	return escaped
}

func renderMarkdownToHTML(content, apiURL, siteURL string) string {
	if strings.TrimSpace(content) == "" {
		return "<p>Belum ada konten artikel.</p>"
	}

	blocks := strings.Split(content, "\n\n")
	var htmlBlocks []string

	for _, block := range blocks {
		trimmed := strings.TrimSpace(block)
		if trimmed == "" {
			continue
		}

		// 1. Heading 2 (## Heading)
		if strings.HasPrefix(trimmed, "## ") {
			hText := strings.TrimPrefix(trimmed, "## ")
			id := sanitizeSlug(hText)
			htmlBlocks = append(htmlBlocks, fmt.Sprintf("<h2 id=\"%s\">%s</h2>", id, renderInlineMarkdown(hText, apiURL, siteURL)))
			continue
		}

		// 2. Heading 3 (### Heading)
		if strings.HasPrefix(trimmed, "### ") {
			hText := strings.TrimPrefix(trimmed, "### ")
			id := sanitizeSlug(hText)
			htmlBlocks = append(htmlBlocks, fmt.Sprintf("<h3 id=\"%s\">%s</h3>", id, renderInlineMarkdown(hText, apiURL, siteURL)))
			continue
		}

		// 3. Image: ![Caption](url)
		if strings.HasPrefix(trimmed, "![") && strings.Contains(trimmed, "](") && strings.HasSuffix(trimmed, ")") {
			capEnd := strings.Index(trimmed, "](")
			if capEnd != -1 {
				caption := trimmed[2:capEnd]
				imgURL := trimmed[capEnd+2 : len(trimmed)-1]
				fullImg := resolveMediaURL(imgURL, apiURL, siteURL)
				safeCap := html.EscapeString(caption)
				safeImg := html.EscapeString(fullImg)
				htmlBlocks = append(htmlBlocks, fmt.Sprintf(`<figure class="article-image"><img src="%s" alt="%s" loading="lazy"><figcaption>%s</figcaption></figure>`, safeImg, safeCap, safeCap))
				continue
			}
		}

		// 4. Blockquote or Tip Box (> ...)
		if strings.HasPrefix(trimmed, "> ") {
			quoteText := strings.TrimPrefix(trimmed, "> ")
			if strings.HasPrefix(quoteText, "💡") || strings.HasPrefix(quoteText, "Tips:") || strings.HasPrefix(quoteText, "TIPS:") {
				htmlBlocks = append(htmlBlocks, fmt.Sprintf(`<div class="callout-tip"><span>💡</span><div>%s</div></div>`, renderInlineMarkdown(quoteText, apiURL, siteURL)))
			} else {
				htmlBlocks = append(htmlBlocks, fmt.Sprintf(`<blockquote>%s</blockquote>`, renderInlineMarkdown(quoteText, apiURL, siteURL)))
			}
			continue
		}

		// 5. Divider
		if trimmed == "---" || trimmed == "***" {
			htmlBlocks = append(htmlBlocks, "<hr />")
			continue
		}

		// 6. Bullet List (- Item or * Item)
		if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
			lines := strings.Split(trimmed, "\n")
			var liItems []string
			for _, line := range lines {
				l := strings.TrimSpace(line)
				if l == "" {
					continue
				}
				if strings.HasPrefix(l, "- ") {
					liItems = append(liItems, fmt.Sprintf("<li>%s</li>", renderInlineMarkdown(strings.TrimPrefix(l, "- "), apiURL, siteURL)))
				} else if strings.HasPrefix(l, "* ") {
					liItems = append(liItems, fmt.Sprintf("<li>%s</li>", renderInlineMarkdown(strings.TrimPrefix(l, "* "), apiURL, siteURL)))
				}
			}
			htmlBlocks = append(htmlBlocks, fmt.Sprintf("<ul>%s</ul>", strings.Join(liItems, "")))
			continue
		}

		// 7. Numbered List (1. Item)
		if len(trimmed) > 3 && (trimmed[0] >= '0' && trimmed[0] <= '9') && (strings.Contains(trimmed[:4], ". ")) {
			lines := strings.Split(trimmed, "\n")
			var liItems []string
			for _, line := range lines {
				l := strings.TrimSpace(line)
				if l == "" {
					continue
				}
				dotIdx := strings.Index(l, ". ")
				if dotIdx != -1 && dotIdx < 5 {
					liItems = append(liItems, fmt.Sprintf("<li>%s</li>", renderInlineMarkdown(l[dotIdx+2:], apiURL, siteURL)))
				}
			}
			htmlBlocks = append(htmlBlocks, fmt.Sprintf("<ol>%s</ol>", strings.Join(liItems, "")))
			continue
		}

		// 8. Markdown Table (| Col 1 | Col 2 |)
		if strings.Contains(trimmed, "|") && strings.Contains(trimmed, "\n") && strings.Contains(trimmed, "---") {
			lines := strings.Split(trimmed, "\n")
			var headerCols []string
			var rowLines []string
			isHeaderFound := false
			for _, line := range lines {
				l := strings.TrimSpace(line)
				if l == "" {
					continue
				}
				if strings.Contains(l, "---") {
					continue
				}
				parts := strings.Split(l, "|")
				var cols []string
				for _, p := range parts {
					c := strings.TrimSpace(p)
					if c != "" {
						cols = append(cols, c)
					}
				}
				if !isHeaderFound && len(cols) > 0 {
					headerCols = cols
					isHeaderFound = true
				} else if len(cols) > 0 {
					var rowCells []string
					for _, cell := range cols {
						rowCells = append(rowCells, fmt.Sprintf("<td>%s</td>", renderInlineMarkdown(cell, apiURL, siteURL)))
					}
					rowLines = append(rowLines, fmt.Sprintf("<tr>%s</tr>", strings.Join(rowCells, "")))
				}
			}
			if isHeaderFound {
				var thCells []string
				for _, h := range headerCols {
					thCells = append(thCells, fmt.Sprintf("<th>%s</th>", renderInlineMarkdown(h, apiURL, siteURL)))
				}
				tableHTML := fmt.Sprintf(`<div class="table-container"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>`, strings.Join(thCells, ""), strings.Join(rowLines, ""))
				htmlBlocks = append(htmlBlocks, tableHTML)
				continue
			}
		}

		// 9. Regular Paragraph
		htmlBlocks = append(htmlBlocks, fmt.Sprintf("<p>%s</p>", renderInlineMarkdown(trimmed, apiURL, siteURL)))
	}

	return strings.Join(htmlBlocks, "\n")
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
