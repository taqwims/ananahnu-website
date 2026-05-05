package repository

import (
	"ananahnu/internal/domain"

	"gorm.io/gorm"
)

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) domain.RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) FindByName(name string) (*domain.Role, error) {
	var role domain.Role
	if err := r.db.Preload("Permissions").Where("name = ?", name).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *roleRepository) Create(role *domain.Role) error {
	return r.db.Create(role).Error
}

func (r *roleRepository) FindAll() ([]domain.Role, error) {
	var roles []domain.Role
	if err := r.db.Order("name ASC").Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

