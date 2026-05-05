package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Username     string     `gorm:"unique" json:"username"` // Optional/Nullable if using Email
	Email        string     `gorm:"unique;not null" json:"email"`
	PasswordHash string     `json:"-"`
	FullName     string     `json:"full_name"`
	RoleID       int        `json:"role_id"`
	Role         Role       `gorm:"foreignKey:RoleID" json:"role"`
	LeaderID     *uuid.UUID `gorm:"type:uuid" json:"leader_id,omitempty"` // Koordinator
	Leader       *User      `gorm:"foreignKey:LeaderID" json:"leader,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
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
	FindByLeaderID(leaderID uuid.UUID) ([]User, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]User, int64, error)
	Update(user *User) error
	Delete(id uuid.UUID) error
}

type PasswordTokenRepository interface {
	Create(token *PasswordResetToken) error
	FindByToken(token string) (*PasswordResetToken, error)
	Delete(token string) error
}
