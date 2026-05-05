package domain

type Role struct {
	ID          int          `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"unique;not null" json:"name"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions"`
}

type Permission struct {
	ID          int    `gorm:"primaryKey" json:"id"`
	Code        string `gorm:"unique;not null" json:"code"`
	Description string `json:"description"`
}

type RolePermission struct {
	RoleID       int `gorm:"primaryKey"`
	PermissionID int `gorm:"primaryKey"`
}

type RoleRepository interface {
	FindByName(name string) (*Role, error)
	FindAll() ([]Role, error)
	Create(role *Role) error
}
