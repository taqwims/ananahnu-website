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
	Role         string `json:"role" binding:"required"` // "HALAL_ADVISOR"
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

type AuthUsecaseDeps struct {
	UserRepo       domain.UserRepository
	RoleRepo       domain.RoleRepository
	ClientRepo     domain.ClientRepository
	TokenRepo      domain.PasswordTokenRepository
	CommissionRepo domain.CommissionRepository
	EmailSender    email.EmailSender
}

type authUsecase struct {
	AuthUsecaseDeps
}

func NewAuthUsecase(deps AuthUsecaseDeps) AuthUsecase {
	return &authUsecase{
		AuthUsecaseDeps: deps,
	}
}

func (uc *authUsecase) Login(email, password string) (string, string, *domain.User, error) {
	user, err := uc.UserRepo.FindByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return "", "", nil, errors.New("invalid credentials")
	}

	// Auto-generate ReferralCode for existing users who don't have one
	if user.ReferralCode == "" {
		user.ReferralCode = uc.generateReferralCode(user.FullName, user.ID)
		// Best effort update, ignore error
		_ = uc.UserRepo.Update(user)
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
	if input.Role != "HALAL_ADVISOR" {
		return errors.New("invalid role for registration")
	}

	// 2. Check if email exists
	if _, err := uc.UserRepo.FindByEmail(input.Email); err == nil {
		return errors.New("email already exists")
	}

	// 3. Hash Password
	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return err
	}

	// 4. Get Role ID
	role, err := uc.RoleRepo.FindByName(input.Role)
	if err != nil {
		return fmt.Errorf("role %s not found", input.Role)
	}

	// 5. Create User
	userID := uuid.New()
	
	// Handle Referral Code
	var referredByID *uuid.UUID
	var leaderID *uuid.UUID
	if input.ReferralCode != "" {
		referrer, err := uc.UserRepo.FindByReferralCode(input.ReferralCode)
		if err == nil && referrer != nil {
			referredByID = &referrer.ID
			// Otomatis set leader_id ke referrer agar masuk tim karir referrer
			leaderID = &referrer.ID
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
		ReferralCode: uc.generateReferralCode(input.FullName, userID),
		ReferredByID: referredByID,
		LeaderID:     leaderID,
	}

	if err := uc.UserRepo.Create(user); err != nil {
		return err
	}

	// Buat komisi REFERRAL untuk referrer jika ada
	if referredByID != nil && uc.CommissionRepo != nil {
		_ = uc.CommissionRepo.Create(&domain.Commission{
			ID:         uuid.New(),
			Type:       domain.CommissionTypeReferral,
			ReferrerID: referredByID,
			ReferredID: &userID,
			Amount:     0, // Nominal diisi saat invoice pertama dibayar, atau bisa dikonfigurasi
			Status:     domain.CommissionStatusPending,
		})
	}

	return nil
}

func (uc *authUsecase) ListFacilitators() ([]domain.User, error) {
	// Find users with role HALAL_ADVISOR
	filter := map[string]interface{}{"role": "HALAL_ADVISOR"}
	users, _, err := uc.UserRepo.FindAll(filter, 1, 1000)
	return users, err
}


func (uc *authUsecase) GenerateAccount(input GenerateAccountInput) (string, error) {
	// 1. Generate Random Password
	password := utils.RandomString(10)
	
	// 2. Check Email
	if _, err := uc.UserRepo.FindByEmail(input.Email); err == nil {
		return "", errors.New("email already exists")
	}

	// 3. Hash
	hash, err := utils.HashPassword(password)
	if err != nil {
		return "", err
	}

	// 4. Find Role
	role, err := uc.RoleRepo.FindByName(input.Role)
	if err != nil {
		return "", errors.New("role not found: " + input.Role)
	}

	// 5. Create User
	newUserID := uuid.New()
	user := &domain.User{
		ID:           newUserID,
		Username:     input.Email,
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.Name,
		RoleID:       role.ID,
		ReferralCode: uc.generateReferralCode(input.Name, newUserID),
	}
	
	if err := uc.UserRepo.Create(user); err != nil {
		return "", err
	}
	
	return password, nil
}

func (uc *authUsecase) ForgotPassword(emailAddr string) error {
	user, err := uc.UserRepo.FindByEmail(emailAddr)
	if err != nil {
		// Return nil to avoid email enumeration — caller always returns 200
		return nil
	}

	token := utils.RandomString(32) // Generate secure token
	
	// Expire in 1 hour
	resetToken := &domain.PasswordResetToken{
		Token:     token,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	if err := uc.TokenRepo.Create(resetToken); err != nil {
		return err
	}

	// Send Email
	link := fmt.Sprintf("%s/reset-password?token=%s", os.Getenv("APP_URL"), token)
	body := fmt.Sprintf("<p>Click here to reset your password: <a href='%s'>%s</a></p>", link, link)
	
	// Async send? For now sync
	return uc.EmailSender.SendEmail([]string{emailAddr}, "Reset Password Request", body)
}

func (uc *authUsecase) ResetPassword(tokenStr, newPassword string) error {
	token, err := uc.TokenRepo.FindByToken(tokenStr)
	if err != nil {
		return errors.New("invalid token")
	}

	if time.Now().After(token.ExpiresAt) {
		uc.TokenRepo.Delete(tokenStr)
		return errors.New("token expired")
	}

	user, err := uc.UserRepo.FindByID(token.UserID)
	if err != nil {
		return err
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}
	user.PasswordHash = hash

	if err := uc.UserRepo.Update(user); err != nil {
		return err
	}

	// Invalidate token
	return uc.TokenRepo.Delete(tokenStr)
}

func removeVowelsAndNonAlpha(w string) string {
	var clean []rune
	for _, r := range w {
		switch r {
		case 'a', 'i', 'u', 'e', 'o', 'A', 'I', 'U', 'E', 'O':
			// skip vowels
		default:
			// keep alphabetical consonants
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
				clean = append(clean, r)
			}
		}
	}
	return string(clean)
}

func (uc *authUsecase) generateReferralCode(fullName string, userID uuid.UUID) string {
	// Hapus semua vokal dari seluruh nama, ambil konsonan saja
	prefix := strings.ToUpper(removeVowelsAndNonAlpha(fullName))
	if prefix == "" {
		prefix = "RF"
	}

	// Cek keunikan, jika duplikat tambah angka di belakang
	// Batasi iterasi untuk mencegah infinite loop
	const maxAttempts = 1000
	code := prefix
	counter := 2
	for i := 0; i < maxAttempts; i++ {
		existing, err := uc.UserRepo.FindByReferralCode(code)
		if err != nil {
			// Record not found → kode unik
			return code
		}
		// If found but belongs to the same user, it is not a collision
		if userID != uuid.Nil && existing != nil && existing.ID == userID {
			return code
		}
		code = fmt.Sprintf("%s%d", prefix, counter)
		counter++
	}
	// Fallback: gunakan UUID pendek agar selalu unik
	uuidStr := strings.ReplaceAll(uuid.New().String(), "-", "")
	cleanUUID := strings.ToUpper(removeVowelsAndNonAlpha(uuidStr))
	if len(cleanUUID) > 6 {
		cleanUUID = cleanUUID[:6]
	}
	return fmt.Sprintf("%s-%s", prefix, cleanUUID)
}

