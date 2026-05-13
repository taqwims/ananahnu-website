package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/utils"
	"ananahnu/pkg/email"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

type AuthUsecase interface {
	Login(email, password string) (string, string, *domain.User, error) // AccessToken, RefreshToken, User, Error
	Register(input RegisterInput) error
	GenerateAccount(input GenerateAccountInput) (string, error) // Returns plaintext password
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
	ListFacilitators() ([]domain.User, error)
}

type RegisterInput struct {
	FullName     string `json:"full_name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=6"`
	Role         string `json:"role" binding:"required"` // "HALAL_KONSULTAN"
	Address       string     `json:"address" binding:"required"`
	Phone         string     `json:"phone" binding:"required"`
	ProvinceID    string     `json:"province_id" binding:"required"`
	RegencyID     string     `json:"regency_id" binding:"required"`
	ReferralCode string `json:"referral_code"`
}

type GenerateAccountInput struct {
	Name  string
	Email string
	Role  string
}

type authUsecase struct {
	userRepo   domain.UserRepository
	roleRepo   domain.RoleRepository
	clientRepo domain.ClientRepository
	tokenRepo  domain.PasswordTokenRepository
	emailSender email.EmailSender
}

func NewAuthUsecase(u domain.UserRepository, r domain.RoleRepository, c domain.ClientRepository, t domain.PasswordTokenRepository, e email.EmailSender) AuthUsecase {
	return &authUsecase{
		userRepo:   u,
		roleRepo:   r,
		clientRepo: c,
		tokenRepo:  t,
		emailSender: e,
	}
}

func (uc *authUsecase) Login(email, password string) (string, string, *domain.User, error) {
	user, err := uc.userRepo.FindByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return "", "", nil, errors.New("invalid credentials")
	}

	// Auto-generate ReferralCode for existing users who don't have one
	if user.ReferralCode == "" {
		user.ReferralCode = uc.generateReferralCode(user.FullName)
		// Best effort update, ignore error
		_ = uc.userRepo.Update(user)
	}

	// Token Expiration
	expHours, _ := strconv.Atoi(os.Getenv("JWT_EXPIRATION_HOURS"))
	if expHours == 0 {
		expHours = 24
	}

	token, err := utils.GenerateToken(user.ID.String(), user.Role.Name, expHours)
	if err != nil {
		return "", "", nil, err
	}
	
	// Refresh Token (simplified, reusing same generation logic but longer)
	refreshExp, _ := strconv.Atoi(os.Getenv("REFRESH_TOKEN_EXPIRATION_DAYS"))
	if refreshExp == 0 {
		refreshExp = 7
	}
	refreshToken, err := utils.GenerateToken(user.ID.String(), user.Role.Name, refreshExp*24)
	
	return token, refreshToken, user, err
}

func (uc *authUsecase) Register(input RegisterInput) error {
	// 1. Validate Role
	if input.Role != "HALAL_KONSULTAN" {
		return errors.New("invalid role for registration")
	}

	// 2. Check if email exists
	if _, err := uc.userRepo.FindByEmail(input.Email); err == nil {
		return errors.New("email already exists")
	}

	// 3. Hash Password
	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return err
	}

	// 4. Get Role ID
	role, err := uc.roleRepo.FindByName(input.Role)
	if err != nil {
		return fmt.Errorf("role %s not found", input.Role)
	}

	// 5. Create User
	userID := uuid.New()
	
	// Handle Referral Code
	var referredByID *uuid.UUID
	if input.ReferralCode != "" {
		referrer, err := uc.userRepo.FindByReferralCode(input.ReferralCode)
		if err == nil && referrer != nil {
			referredByID = &referrer.ID
		} else {
			return errors.New("invalid referral code")
		}
	}

	pID, _ := strconv.ParseInt(input.ProvinceID, 10, 64)
	rID, _ := strconv.ParseInt(input.RegencyID, 10, 64)

	user := &domain.User{
		ID:           userID,
		Username:     input.Email,
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.FullName,
		Phone:        input.Phone,
		Address:      input.Address,
		ProvinceID:   pID,
		RegencyID:    rID,
		RoleID:       role.ID,
		ReferralCode: uc.generateReferralCode(input.FullName),
		ReferredByID: referredByID,
	}

	if err := uc.userRepo.Create(user); err != nil {
		return err
	}

	return nil
}

func (uc *authUsecase) ListFacilitators() ([]domain.User, error) {
	// Find users with role HALAL_KONSULTAN
	filter := map[string]interface{}{"role": "HALAL_KONSULTAN"}
	users, _, err := uc.userRepo.FindAll(filter, 1, 1000)
	return users, err
}


func (uc *authUsecase) GenerateAccount(input GenerateAccountInput) (string, error) {
	// 1. Generate Random Password
	password := utils.RandomString(10)
	
	// 2. Check Email
	if _, err := uc.userRepo.FindByEmail(input.Email); err == nil {
		return "", errors.New("email already exists")
	}

	// 3. Hash
	hash, err := utils.HashPassword(password)
	if err != nil {
		return "", err
	}

	// 4. Find Role
	role, err := uc.roleRepo.FindByName(input.Role)
	if err != nil {
		return "", errors.New("role not found: " + input.Role)
	}

	// 5. Create User
	user := &domain.User{
		ID:           uuid.New(),
		Username:     input.Email,
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.Name,
		RoleID:       role.ID,
	}
	
	if err := uc.userRepo.Create(user); err != nil {
		return "", err
	}
	
	return password, nil
}

func (uc *authUsecase) ForgotPassword(emailAddr string) error {
	user, err := uc.userRepo.FindByEmail(emailAddr)
	if err != nil {
		return errors.New("email not found") // Or return nil to avoid enumeration
	}

	token := utils.RandomString(32) // Generate secure token
	
	// Expire in 1 hour
	resetToken := &domain.PasswordResetToken{
		Token:     token,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	if err := uc.tokenRepo.Create(resetToken); err != nil {
		return err
	}

	// Send Email
	link := fmt.Sprintf("%s/reset-password?token=%s", os.Getenv("APP_URL"), token)
	body := fmt.Sprintf("<p>Click here to reset your password: <a href='%s'>%s</a></p>", link, link)
	
	// Async send? For now sync
	return uc.emailSender.SendEmail([]string{emailAddr}, "Reset Password Request", body)
}

func (uc *authUsecase) ResetPassword(tokenStr, newPassword string) error {
	token, err := uc.tokenRepo.FindByToken(tokenStr)
	if err != nil {
		return errors.New("invalid token")
	}

	if time.Now().After(token.ExpiresAt) {
		uc.tokenRepo.Delete(tokenStr)
		return errors.New("token expired")
	}

	user, err := uc.userRepo.FindByID(token.UserID)
	if err != nil {
		return err
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}
	user.PasswordHash = hash

	if err := uc.userRepo.Update(user); err != nil {
		return err
	}

	// Invalidate token
	return uc.tokenRepo.Delete(tokenStr)
}

func (uc *authUsecase) generateReferralCode(fullName string) string {
	words := strings.Fields(fullName)
	var prefix string

	if len(words) > 0 {
		w1 := words[0]
		// Ambil karakter indeks 0, 2, 4 dari kata pertama
		for _, i := range []int{0, 2, 4} {
			if i < len(w1) {
				prefix += string(w1[i])
			}
		}
	}

	if len(words) > 1 {
		w2 := words[1]
		// Ambil karakter pertama dari kata kedua
		if len(w2) > 0 {
			prefix += string(w2[0])
		}
		// Ambil karakter terakhir dari kata kedua
		if len(w2) > 1 {
			prefix += string(w2[len(w2)-1])
		}
	}

	prefix = strings.ToUpper(prefix)
	if prefix == "" {
		prefix = "USER"
	}

	code := prefix
	counter := 2
	for {
		_, err := uc.userRepo.FindByReferralCode(code)
		if err != nil {
			// Record not found, so it's unique
			return code
		}
		code = fmt.Sprintf("%s%d", prefix, counter)
		counter++
	}
}
