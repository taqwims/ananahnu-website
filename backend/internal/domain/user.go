package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Username     string    `gorm:"unique" json:"username"` // Optional/Nullable if using Email
	Email        string    `gorm:"unique;not null" json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	RoleID       int       `json:"role_id"`
	Role         Role      `gorm:"foreignKey:RoleID" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type PasswordResetToken struct {
	Token     string    `gorm:"primaryKey" json:"token"`
	UserID    uuid.UUID `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

type UserRepository interface {
	Create(user *User) error
	FindByEmail(email string) (*User, error)
	FindByID(id uuid.UUID) (*User, error)
	Update(user *User) error
}

type PasswordTokenRepository interface {
	Create(token *PasswordResetToken) error
	FindByToken(token string) (*PasswordResetToken, error)
	Delete(token string) error
}
