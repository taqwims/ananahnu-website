package domain

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/datatypes"
)

type AuditLog struct {
	ID         int64          `gorm:"primaryKey" json:"id"`
	UserID     uuid.UUID      `gorm:"type:uuid" json:"user_id"`
	User       *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Action     string         `json:"action"`
	EntityType string         `json:"entity_type"`
	EntityID   string         `json:"entity_id"`
	Payload    datatypes.JSON `json:"payload"`
	Notes      string         `json:"notes"`
	CreatedAt  time.Time      `json:"created_at"`
}

type ContentBlock struct {
	ID         int64  `gorm:"primaryKey" json:"id"`
	SectionKey string `gorm:"unique" json:"section_key"` // e.g. "landing_hero"
	Title      string `json:"title"`
	Body       string `json:"body"`
	ImageURL   string `json:"image_url"`
}

type News struct {
    ID           int64     `gorm:"primaryKey" json:"id"`
    Title        string    `json:"title"`
    Slug         string    `gorm:"unique" json:"slug"`
    Content      string    `json:"content"`
    ThumbnailURL string    `json:"thumbnail_url"`
    PublishedAt  time.Time `json:"published_at"`
    Tags         string    `json:"tags"`
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
