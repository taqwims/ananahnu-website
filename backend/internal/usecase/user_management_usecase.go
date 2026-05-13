package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/utils"
	"errors"

	"github.com/google/uuid"
)

type CreateUserInput struct {
	FullName string     `json:"full_name"`
	Email    string     `json:"email"`
	Role     string     `json:"role"`
	LeaderID *uuid.UUID `json:"leader_id,omitempty"`
	Password string     `json:"password,omitempty"`
}

type UpdateUserInput struct {
	FullName string     `json:"full_name"`
	Email    string     `json:"email"`
	Role     string     `json:"role"`
	LeaderID *uuid.UUID `json:"leader_id,omitempty"`
	Password string     `json:"password,omitempty"`
}

type UpdateProfileInput struct {
	FullName string `json:"full_name"`
	Password string `json:"password,omitempty"`
}

type UserManagementUsecase interface {
	ListUsers(filter map[string]interface{}, page, limit int) ([]domain.User, int64, error)
	GetUser(id uuid.UUID) (*domain.User, error)
	CreateUser(input CreateUserInput) (*domain.User, string, error) // Returns user + plaintext password
	UpdateUser(id uuid.UUID, input UpdateUserInput) error
	UpdateProfile(id uuid.UUID, input UpdateProfileInput) error
	DeleteUser(id uuid.UUID) error
	ResetUserPassword(id uuid.UUID) (string, error) // Returns new plaintext password
	ListRoles() ([]domain.Role, error)
	GetReferrals(userID uuid.UUID) ([]domain.User, error)
	GetAllReferralAnalytics() ([]map[string]interface{}, error)
}

type userManagementUsecase struct {
	userRepo domain.UserRepository
	roleRepo domain.RoleRepository
}

func NewUserManagementUsecase(u domain.UserRepository, r domain.RoleRepository) UserManagementUsecase {
	return &userManagementUsecase{userRepo: u, roleRepo: r}
}

func (uc *userManagementUsecase) ListUsers(filter map[string]interface{}, page, limit int) ([]domain.User, int64, error) {
	return uc.userRepo.FindAll(filter, page, limit)
}

func (uc *userManagementUsecase) GetUser(id uuid.UUID) (*domain.User, error) {
	return uc.userRepo.FindByID(id)
}

func (uc *userManagementUsecase) CreateUser(input CreateUserInput) (*domain.User, string, error) {
	// Check duplicate email
	if _, err := uc.userRepo.FindByEmail(input.Email); err == nil {
		return nil, "", errors.New("email already exists")
	}

	// Find role
	role, err := uc.roleRepo.FindByName(input.Role)
	if err != nil {
		return nil, "", errors.New("role not found: " + input.Role)
	}

	// Generate random password if not provided
	password := input.Password
	if password == "" {
		password = utils.RandomString(10)
	}
	hash, err := utils.HashPassword(password)
	if err != nil {
		return nil, "", err
	}

	user := &domain.User{
		ID:           uuid.New(),
		Username:     input.Email,
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.FullName,
		RoleID:       role.ID,
		LeaderID:     input.LeaderID,
	}

	if err := uc.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	// Reload with role preloaded
	created, _ := uc.userRepo.FindByID(user.ID)
	return created, password, nil
}

func (uc *userManagementUsecase) UpdateUser(id uuid.UUID, input UpdateUserInput) error {
	user, err := uc.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	// Check email uniqueness if changed
	if input.Email != "" && input.Email != user.Email {
		if existing, err := uc.userRepo.FindByEmail(input.Email); err == nil && existing.ID != id {
			return errors.New("email already taken")
		}
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.Email != "" {
		user.Email = input.Email
		user.Username = input.Email
	}
	if input.Role != "" {
		role, err := uc.roleRepo.FindByName(input.Role)
		if err != nil {
			return errors.New("role not found: " + input.Role)
		}
		user.RoleID = role.ID
	}
	if input.Password != "" {
		hash, err := utils.HashPassword(input.Password)
		if err != nil {
			return err
		}
		user.PasswordHash = hash
	}
	user.LeaderID = input.LeaderID

	return uc.userRepo.Update(user)
}

func (uc *userManagementUsecase) UpdateProfile(id uuid.UUID, input UpdateProfileInput) error {
	user, err := uc.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}

	if input.Password != "" {
		hash, err := utils.HashPassword(input.Password)
		if err != nil {
			return err
		}
		user.PasswordHash = hash
	}

	return uc.userRepo.Update(user)
}

func (uc *userManagementUsecase) DeleteUser(id uuid.UUID) error {
	if _, err := uc.userRepo.FindByID(id); err != nil {
		return errors.New("user not found")
	}
	return uc.userRepo.Delete(id)
}

func (uc *userManagementUsecase) ResetUserPassword(id uuid.UUID) (string, error) {
	user, err := uc.userRepo.FindByID(id)
	if err != nil {
		return "", errors.New("user not found")
	}

	password := utils.RandomString(10)
	hash, err := utils.HashPassword(password)
	if err != nil {
		return "", err
	}

	user.PasswordHash = hash
	if err := uc.userRepo.Update(user); err != nil {
		return "", err
	}

	return password, nil
}

func (uc *userManagementUsecase) ListRoles() ([]domain.Role, error) {
	return uc.roleRepo.FindAll()
}

func (uc *userManagementUsecase) GetReferrals(userID uuid.UUID) ([]domain.User, error) {
	return uc.userRepo.FindByReferredByID(userID)
}

func (uc *userManagementUsecase) GetAllReferralAnalytics() ([]map[string]interface{}, error) {
	return uc.userRepo.GetAllReferralAnalytics()
}
