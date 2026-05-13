package repository

import (
	"ananahnu/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByEmail(email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.Preload("Role.Permissions").Preload("Leader").Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(id uuid.UUID) (*domain.User, error) {
	var user domain.User
	if err := r.db.Preload("Role.Permissions").First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByReferralCode(code string) (*domain.User, error) {
	var user domain.User
	if err := r.db.Where("referral_code = ?", code).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByReferredByID(id uuid.UUID) ([]domain.User, error) {
	var users []domain.User
	if err := r.db.Where("referred_by_id = ?", id).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) GetAllReferralAnalytics() ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := `
		SELECT 
			u.id, 
			u.full_name, 
			u.email, 
			u.referral_code, 
			roles.name as role_name, 
			COUNT(ref.id) as total_referred
		FROM users u
		JOIN roles ON roles.id = u.role_id
		LEFT JOIN users ref ON ref.referred_by_id = u.id
		WHERE u.referral_code IS NOT NULL AND u.referral_code != ''
		GROUP BY u.id, roles.id
		ORDER BY total_referred DESC
	`
	if err := r.db.Raw(query).Scan(&results).Error; err != nil {
		return nil, err
	}
	return results, nil
}

func (r *userRepository) Update(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) FindByLeaderID(leaderID uuid.UUID) ([]domain.User, error) {
	var users []domain.User
	if err := r.db.Preload("Role").Where("leader_id = ?", leaderID).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.db.Model(&domain.User{}).Preload("Role")

	if roleID, ok := filter["role_id"]; ok {
		query = query.Where("users.role_id = ?", roleID)
	}
	if role, ok := filter["role"]; ok {
		query = query.Joins("JOIN roles ON roles.id = users.role_id").
			Where("roles.name = ?", role)
	}
	if roleName, ok := filter["role_name"]; ok {
		query = query.Joins("JOIN roles ON roles.id = users.role_id").
			Where("roles.name = ?", roleName)
	}
	if roles, ok := filter["roles"]; ok {
		query = query.Joins("JOIN roles ON roles.id = users.role_id").
			Where("roles.name IN ?", roles)
	}
	if search, ok := filter["search"]; ok {
		s := "%" + search.(string) + "%"
		query = query.Where("users.full_name ILIKE ? OR users.email ILIKE ?", s, s)
	}
	if noLeader, ok := filter["no_leader"]; ok && noLeader == true {
		query = query.Where("users.leader_id IS NULL")
	}

	query = query.Preload("Leader")

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (r *userRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.User{}, id).Error
}

// Referral Commission Implementation
type referralCommissionRepository struct {
	db *gorm.DB
}

func NewReferralCommissionRepository(db *gorm.DB) domain.ReferralCommissionRepository {
	return &referralCommissionRepository{db: db}
}

func (r *referralCommissionRepository) Create(commission *domain.ReferralCommission) error {
	return r.db.Create(commission).Error
}

func (r *referralCommissionRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.ReferralCommission, int64, error) {
	var commissions []domain.ReferralCommission
	var total int64

	db := r.db.Model(&domain.ReferralCommission{}).Preload("Referrer").Preload("Referred").Preload("Submission")

	// Apply filters if needed

	db.Count(&total)

	offset := (page - 1) * limit
	err := db.Offset(offset).Limit(limit).Order("created_at desc").Find(&commissions).Error

	return commissions, total, err
}

func (r *referralCommissionRepository) UpdateStatus(id uuid.UUID, status domain.ReferralCommissionStatus, paidAt *time.Time) error {
	return r.db.Model(&domain.ReferralCommission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":  status,
		"paid_at": paidAt,
	}).Error
}

func (r *referralCommissionRepository) FindBySubmissionID(submissionID uuid.UUID) (*domain.ReferralCommission, error) {
	var commission domain.ReferralCommission
	if err := r.db.Where("submission_id = ?", submissionID).First(&commission).Error; err != nil {
		return nil, err
	}
	return &commission, nil
}
