package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/utils"
	"errors"
	"log"
	"strings"

	"github.com/google/uuid"
)

type ClientUsecase interface {
	GetClients(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error)
	GetClient(id uuid.UUID) (*domain.Client, error)
	CreateClient(client *domain.Client) error
	UpdateClient(client *domain.Client) error
}

type ClientUsecaseDeps struct {
	ClientRepo      domain.ClientRepository
	UserRepo        domain.UserRepository
	ConsultantRepo  domain.ConsultantProfileRepository
	ParticipantRepo domain.TrainingParticipantRepository
}

type clientUsecase struct {
	ClientUsecaseDeps
}

func NewClientUsecase(deps ClientUsecaseDeps) ClientUsecase {
	return &clientUsecase{
		ClientUsecaseDeps: deps,
	}
}

func (uc *clientUsecase) GetClients(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error) {
	return uc.ClientRepo.FindAll(filter, page, limit)
}

func (uc *clientUsecase) GetClient(id uuid.UUID) (*domain.Client, error) {
	return uc.ClientRepo.FindByID(id)
}

func (uc *clientUsecase) checkVerification(userID uuid.UUID) error {
	user, err := uc.UserRepo.FindByID(userID)
	if err != nil {
		return err
	}

	// Only check verification for consultants
	if user.Role.Name == "HALAL_ADVISOR" {
		// 1. Check Profile Verification
		profile, err := uc.ConsultantRepo.FindByUserID(userID)
		if err != nil || profile == nil || !profile.IsVerified {
			return errors.New("akun Anda belum terverifikasi. Silakan lengkapi profil dan tunggu verifikasi data oleh admin")
		}

		// 2. Check Training Graduation
		trainings, err := uc.ParticipantRepo.FindByUser(userID)
		isGraduated := false
		if err == nil {
			for _, t := range trainings {
				if t.Status == "LULUS" {
					isGraduated = true
					break
				}
			}
		}

		log.Printf("[DEBUG] Consultant check for user %s: ProfileVerified=%v, IsGraduated=%v", userID, profile.IsVerified, isGraduated)

		if !profile.IsVerified && !isGraduated {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi admin dan Anda belum dinyatakan lulus pelatihan.")
		}
		if !profile.IsVerified {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi oleh admin. Silakan lengkapi dokumen di Profil Advisor.")
		}
		if !isGraduated {
			return errors.New("Akses Dibatasi: Anda belum dinyatakan lulus pelatihan. Silakan pastikan status kelulusan Anda di menu Pelatihan.")
		}
	}
	return nil
}

func (uc *clientUsecase) CreateClient(client *domain.Client) error {
	if err := uc.checkVerification(client.CreatedBy); err != nil {
		return err
	}

	// Sanitize and Validate NIK (16 digits required)
	client.NIK = utils.CleanDigits(client.NIK)
	if err := utils.ValidateNIK(client.NIK, true); err != nil {
		return err
	}

	// Validate Phone
	client.Phone = utils.CleanPhone(client.Phone)
	if err := utils.ValidatePhone(client.Phone, true); err != nil {
		return err
	}

	// Sanitize text fields to prevent injection/XSS
	client.BusinessName = utils.SanitizeInput(client.BusinessName)
	client.ClientName = utils.SanitizeInput(client.ClientName)
	client.Address = utils.SanitizeInput(client.Address)
	client.ProductName = utils.SanitizeInput(client.ProductName)
	client.ContactPerson = utils.SanitizeInput(client.ContactPerson)

	// Handle and validate NIB
	trimmedNIB := strings.TrimSpace(client.NIB)
	if trimmedNIB == "" {
		client.NIB = "DRAFT-" + uuid.New().String()[:8]
	} else {
		client.NIB = utils.CleanDigits(trimmedNIB)
		if err := utils.ValidateNIB(client.NIB, true); err != nil {
			return err
		}
		// Check if real NIB already exists
		existing, _ := uc.ClientRepo.FindByNIB(client.NIB)
		if existing != nil {
			return domain.ErrNIBExists
		}
	}

	client.ID = uuid.New()
	return uc.ClientRepo.Create(client)
}

func (uc *clientUsecase) UpdateClient(client *domain.Client) error {
	// Sanitize and Validate NIK
	if client.NIK != "" {
		client.NIK = utils.CleanDigits(client.NIK)
		if err := utils.ValidateNIK(client.NIK, true); err != nil {
			return err
		}
	}

	// Validate Phone
	if client.Phone != "" {
		client.Phone = utils.CleanPhone(client.Phone)
		if err := utils.ValidatePhone(client.Phone, true); err != nil {
			return err
		}
	}

	// Validate NIB if provided
	if client.NIB != "" && !strings.HasPrefix(client.NIB, "DRAFT-") {
		client.NIB = utils.CleanDigits(client.NIB)
		if err := utils.ValidateNIB(client.NIB, true); err != nil {
			return err
		}
	}

	// Sanitize text fields
	client.BusinessName = utils.SanitizeInput(client.BusinessName)
	client.ClientName = utils.SanitizeInput(client.ClientName)
	client.Address = utils.SanitizeInput(client.Address)
	client.ProductName = utils.SanitizeInput(client.ProductName)
	client.ContactPerson = utils.SanitizeInput(client.ContactPerson)

	return uc.ClientRepo.Update(client)
}

