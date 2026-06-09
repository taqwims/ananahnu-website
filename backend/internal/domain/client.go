package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Client struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	NIB           string    `gorm:"unique;column:nib" json:"nib"`
	NIK           string    `gorm:"column:nik" json:"nik"`
	BusinessName  string    `gorm:"column:business_name" json:"business_name"`
	ClientName    string    `gorm:"column:client_name" json:"client_name"`
	Address       string    `gorm:"column:address" json:"address"`
	ProductName   string    `gorm:"column:product_name" json:"product_name"`
	ServiceType   string    `gorm:"column:service_type" json:"service_type"` // SELF_DECLARE or REGULER
	SelfDeclareType string    `gorm:"column:self_declare_type" json:"self_declare_type,omitempty"` // MANDIRI or GRATIS
	FacilitatorID uuid.UUID `gorm:"type:uuid;column:facilitator_id" json:"facilitator_id"` // Pendamping
	Facilitator   User      `gorm:"foreignKey:FacilitatorID" json:"facilitator"`
	ContactPerson string    `json:"contact_person"`
	Phone         string    `json:"phone"`
	CreatedBy     uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ClientRepository interface {
	Create(client *Client) error
	ImportBulk(clients []Client) error
	FindAll(filter map[string]interface{}, page, limit int) ([]Client, int64, error)
	FindByID(id uuid.UUID) (*Client, error)
	FindByNIB(nib string) (*Client, error)
	Update(client *Client) error
}

var (
	ErrNIBExists = errors.New("NIB already registered")
)
