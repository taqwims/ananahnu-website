package usecase

import (
	"ananahnu/internal/domain"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type CMSUsecase interface {
	// News
	GetNews() ([]domain.News, error)
	ListNews(search string, category string, isPublishedOnly bool, landingOnly bool, featuredOnly bool, page int, limit int) ([]domain.News, int64, error)
	GetNewsDetail(slugOrID string, incrementView bool) (*domain.News, []domain.News, error)
	GetNewsByID(id int64) (*domain.News, error)
	CreateNews(news *domain.News) error
	UpdateNews(id int64, news *domain.News) error
	DeleteNews(id int64) error
	ToggleNewsStatus(id int64, isPublished bool) error
	ToggleNewsFeatured(id int64, isFeatured bool) error
	ToggleNewsLanding(id int64, showOnLanding bool) error
	GetNewsCategories() ([]string, error)

	// Content Blocks
	GetContentBlock(key string) (*domain.ContentBlock, error)
	ListContentBlocks() ([]domain.ContentBlock, error)
	UpdateContentBlock(input domain.ContentBlock) error

	// Affiliates
	ListAffiliates() ([]domain.Affiliate, error)
	CreateAffiliate(a *domain.Affiliate) error
	UpdateAffiliate(id int64, a *domain.Affiliate) error
	DeleteAffiliate(id int64) error

	// Certified Products
	ListCertifiedProducts() ([]domain.CertifiedProduct, error)
	CreateCertifiedProduct(p *domain.CertifiedProduct) error
	UpdateCertifiedProduct(id int64, p *domain.CertifiedProduct) error
	DeleteCertifiedProduct(id int64) error
}

type CMSUsecaseDeps struct {
	CMSRepo domain.CMSRepository
}

type cmsUsecase struct {
	CMSUsecaseDeps
}

func NewCMSUsecase(deps CMSUsecaseDeps) CMSUsecase {
	return &cmsUsecase{
		CMSUsecaseDeps: deps,
	}
}

// --- Helper Functions for News SEO & Content ---

var nonAlphaNumRegex = regexp.MustCompile(`[^a-z0-9]+`)
var htmlTagRegex = regexp.MustCompile(`<[^>]*>`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonAlphaNumRegex.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func stripHTML(s string) string {
	return htmlTagRegex.ReplaceAllString(s, "")
}

func calculateReadingTime(content string) int {
	cleanText := stripHTML(content)
	words := len(strings.Fields(cleanText))
	if words == 0 {
		return 1
	}
	minutes := int(math.Ceil(float64(words) / 200.0))
	if minutes < 1 {
		return 1
	}
	return minutes
}

func generateExcerpt(content string, maxLen int) string {
	clean := strings.TrimSpace(stripHTML(content))
	clean = strings.ReplaceAll(clean, "\n", " ")
	clean = strings.Join(strings.Fields(clean), " ")
	if len([]rune(clean)) <= maxLen {
		return clean
	}
	runes := []rune(clean)
	return string(runes[:maxLen]) + "..."
}

// --- News ---

func (uc *cmsUsecase) GetNews() ([]domain.News, error) {
	return uc.CMSRepo.FindAllNews(map[string]interface{}{"is_published": true})
}

func (uc *cmsUsecase) ListNews(search string, category string, isPublishedOnly bool, landingOnly bool, featuredOnly bool, page int, limit int) ([]domain.News, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit
	return uc.CMSRepo.FindAllNewsWithFilter(search, category, isPublishedOnly, landingOnly, featuredOnly, limit, offset)
}

func (uc *cmsUsecase) GetNewsDetail(slugOrID string, incrementView bool) (*domain.News, []domain.News, error) {
	var news *domain.News
	var err error

	// Try find by slug first
	news, err = uc.CMSRepo.FindNewsBySlug(slugOrID)
	if err != nil || news == nil {
		// If not found by slug, try parse as ID
		if id, parseErr := strconv.ParseInt(slugOrID, 10, 64); parseErr == nil {
			news, err = uc.CMSRepo.FindNewsByID(id)
		}
	}

	if err != nil || news == nil {
		return nil, nil, err
	}

	if incrementView {
		_ = uc.CMSRepo.IncrementNewsViews(news.ID)
		news.Views++
	}

	// Fetch related news
	related, _ := uc.CMSRepo.FindRelatedNews(news.Category, news.ID, 3)

	return news, related, nil
}

func (uc *cmsUsecase) GetNewsByID(id int64) (*domain.News, error) {
	return uc.CMSRepo.FindNewsByID(id)
}

func (uc *cmsUsecase) CreateNews(news *domain.News) error {
	now := time.Now()
	if news.Slug == "" {
		news.Slug = slugify(news.Title)
	} else {
		news.Slug = slugify(news.Slug)
	}

	if news.Slug == "" {
		news.Slug = fmt.Sprintf("berita-%d", now.Unix())
	}

	if news.AuthorName == "" {
		news.AuthorName = "Tim Halal Core"
	}
	if news.Category == "" {
		news.Category = "Berita Halal"
	}
	if news.ReadingTime <= 0 {
		news.ReadingTime = calculateReadingTime(news.Content)
	}
	if news.Excerpt == "" && news.Content != "" {
		news.Excerpt = generateExcerpt(news.Content, 160)
	}
	if news.MetaTitle == "" {
		news.MetaTitle = news.Title
	}
	if news.MetaDescription == "" {
		news.MetaDescription = news.Excerpt
	}
	if news.OGImageURL == "" && news.ThumbnailURL != "" {
		news.OGImageURL = news.ThumbnailURL
	}
	if news.PublishedAt.IsZero() {
		news.PublishedAt = now
	}
	news.CreatedAt = now
	news.UpdatedAt = now

	return uc.CMSRepo.CreateNews(news)
}

func (uc *cmsUsecase) UpdateNews(id int64, news *domain.News) error {
	existing, err := uc.CMSRepo.FindNewsByID(id)
	if err != nil {
		return err
	}

	if news.Slug == "" {
		news.Slug = slugify(news.Title)
	} else {
		news.Slug = slugify(news.Slug)
	}

	if news.AuthorName == "" {
		news.AuthorName = existing.AuthorName
	}
	if news.Category == "" {
		news.Category = existing.Category
	}
	if news.ReadingTime <= 0 {
		news.ReadingTime = calculateReadingTime(news.Content)
	}
	if news.Excerpt == "" && news.Content != "" {
		news.Excerpt = generateExcerpt(news.Content, 160)
	}
	if news.MetaTitle == "" {
		news.MetaTitle = news.Title
	}
	if news.MetaDescription == "" {
		news.MetaDescription = news.Excerpt
	}
	if news.OGImageURL == "" && news.ThumbnailURL != "" {
		news.OGImageURL = news.ThumbnailURL
	}
	if news.PublishedAt.IsZero() {
		news.PublishedAt = existing.PublishedAt
	}

	news.ID = id
	news.Views = existing.Views
	news.CreatedAt = existing.CreatedAt
	news.UpdatedAt = time.Now()

	return uc.CMSRepo.UpdateNews(news)
}

func (uc *cmsUsecase) DeleteNews(id int64) error {
	return uc.CMSRepo.DeleteNews(id)
}

func (uc *cmsUsecase) ToggleNewsStatus(id int64, isPublished bool) error {
	existing, err := uc.CMSRepo.FindNewsByID(id)
	if err != nil {
		return err
	}
	existing.IsPublished = isPublished
	existing.UpdatedAt = time.Now()
	return uc.CMSRepo.UpdateNews(existing)
}

func (uc *cmsUsecase) ToggleNewsFeatured(id int64, isFeatured bool) error {
	existing, err := uc.CMSRepo.FindNewsByID(id)
	if err != nil {
		return err
	}
	existing.IsFeatured = isFeatured
	existing.UpdatedAt = time.Now()
	return uc.CMSRepo.UpdateNews(existing)
}

func (uc *cmsUsecase) ToggleNewsLanding(id int64, showOnLanding bool) error {
	existing, err := uc.CMSRepo.FindNewsByID(id)
	if err != nil {
		return err
	}
	existing.ShowOnLanding = showOnLanding
	existing.UpdatedAt = time.Now()
	return uc.CMSRepo.UpdateNews(existing)
}

func (uc *cmsUsecase) GetNewsCategories() ([]string, error) {
	categories, err := uc.CMSRepo.GetNewsCategories()
	if err != nil {
		return nil, err
	}
	// Add standard default categories if not present
	defaultCategories := []string{"Sertifikasi Halal", "Regulasi BPJPH", "Edukasi & Tips", "Berita Industri", "Tips UMKM"}
	catMap := make(map[string]bool)
	for _, c := range categories {
		if strings.TrimSpace(c) != "" {
			catMap[c] = true
		}
	}
	for _, dc := range defaultCategories {
		if !catMap[dc] {
			categories = append(categories, dc)
		}
	}
	return categories, nil
}

// --- Content Blocks ---

func (uc *cmsUsecase) GetContentBlock(key string) (*domain.ContentBlock, error) {
	return uc.CMSRepo.FindContentBlock(key)
}

func (uc *cmsUsecase) ListContentBlocks() ([]domain.ContentBlock, error) {
	return uc.CMSRepo.FindAllContentBlocks()
}

func (uc *cmsUsecase) UpdateContentBlock(input domain.ContentBlock) error {
	return uc.CMSRepo.UpdateContentBlock(&input)
}

// --- Affiliates ---

func (uc *cmsUsecase) ListAffiliates() ([]domain.Affiliate, error) {
	return uc.CMSRepo.FindAllAffiliates()
}

func (uc *cmsUsecase) CreateAffiliate(a *domain.Affiliate) error {
	return uc.CMSRepo.CreateAffiliate(a)
}

func (uc *cmsUsecase) UpdateAffiliate(id int64, a *domain.Affiliate) error {
	a.ID = id
	return uc.CMSRepo.UpdateAffiliate(a)
}

func (uc *cmsUsecase) DeleteAffiliate(id int64) error {
	return uc.CMSRepo.DeleteAffiliate(id)
}

// --- Certified Products ---

func (uc *cmsUsecase) ListCertifiedProducts() ([]domain.CertifiedProduct, error) {
	return uc.CMSRepo.FindAllCertifiedProducts()
}

func (uc *cmsUsecase) CreateCertifiedProduct(p *domain.CertifiedProduct) error {
	return uc.CMSRepo.CreateCertifiedProduct(p)
}

func (uc *cmsUsecase) UpdateCertifiedProduct(id int64, p *domain.CertifiedProduct) error {
	p.ID = id
	return uc.CMSRepo.UpdateCertifiedProduct(p)
}

func (uc *cmsUsecase) DeleteCertifiedProduct(id int64) error {
	return uc.CMSRepo.DeleteCertifiedProduct(id)
}
