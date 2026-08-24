package domain

import (
    "time"
)

type ContentBlock struct {
	ID         int64  `gorm:"primaryKey" json:"id"`
	SectionKey string `gorm:"unique" json:"section_key"` // e.g. "landing_hero"
	Title      string `json:"title"`
	Body       string `json:"body"`
	ImageURL   string `json:"image_url"`
}

type News struct {
    ID              int64     `gorm:"primaryKey" json:"id"`
    Title           string    `gorm:"type:varchar(255);not null" json:"title"`
    Slug            string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
    Excerpt         string    `gorm:"type:text" json:"excerpt"`
    Content         string    `gorm:"type:text;not null" json:"content"`
    Category        string    `gorm:"type:varchar(100);default:'Berita Halal'" json:"category"`
    ThumbnailURL    string    `gorm:"type:text" json:"thumbnail_url"`
    Tags            string    `gorm:"type:varchar(255)" json:"tags"`
    AuthorName      string    `gorm:"type:varchar(100);default:'Tim Halal Core'" json:"author_name"`
    ReadingTime     int       `gorm:"default:3" json:"reading_time"` // in minutes
    MetaTitle       string    `gorm:"type:varchar(255)" json:"meta_title"`
    MetaDescription string    `gorm:"type:text" json:"meta_description"`
    MetaKeywords    string    `gorm:"type:varchar(255)" json:"meta_keywords"`
    CanonicalURL    string    `gorm:"type:varchar(255)" json:"canonical_url"`
    OGImageURL      string    `gorm:"type:text" json:"og_image_url"`
    IsPublished     bool      `gorm:"default:true;index" json:"is_published"`
    IsFeatured      bool      `gorm:"default:false;index" json:"is_featured"`
    ShowOnLanding   bool      `gorm:"default:true;index" json:"show_on_landing"`
    Views           int64     `gorm:"default:0" json:"views"`
    PublishedAt     time.Time `gorm:"index" json:"published_at"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

type Affiliate struct {
    ID         int64  `gorm:"primaryKey" json:"id"`
    Name       string `json:"name"`
    LogoURL    string `json:"logo_url"`
    WebsiteURL string `json:"website_url"`
}

type CertifiedProduct struct {
    ID                int64     `gorm:"primaryKey" json:"id"`
    Name              string    `json:"name"`
    CompanyName       string    `json:"company_name"`
    CertificateNumber string    `json:"certificate_number"`
    ValidUntil        time.Time `json:"valid_until"`
    PhotoURL          string    `json:"photo_url"`
}
