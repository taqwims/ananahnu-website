package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"log"
	
	"github.com/google/uuid"
)


type ClientUsecase interface {
	GetClients(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error)
	GetClient(id uuid.UUID) (*domain.Client, error)
	CreateClient(client *domain.Client) error
	UpdateClient(client *domain.Client) error
}

type clientUsecase struct {
	clientRepo     domain.ClientRepository
	userRepo       domain.UserRepository
	consultantRepo  domain.ConsultantProfileRepository
	participantRepo domain.TrainingParticipantRepository
}

func NewClientUsecase(r domain.ClientRepository, u domain.UserRepository, con domain.ConsultantProfileRepository, p domain.TrainingParticipantRepository) ClientUsecase {
	return &clientUsecase{
		clientRepo:      r,
		userRepo:        u,
		consultantRepo:  con,
		participantRepo: p,
	}
}

func (uc *clientUsecase) GetClients(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error) {
	return uc.clientRepo.FindAll(filter, page, limit)
}

func (uc *clientUsecase) GetClient(id uuid.UUID) (*domain.Client, error) {
	return uc.clientRepo.FindByID(id)
}

func (uc *clientUsecase) checkVerification(userID uuid.UUID) error {
	user, err := uc.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	// Only check verification for consultants
	if user.Role.Name == "HALAL_KONSULTAN" {
		// 1. Check Profile Verification
		profile, err := uc.consultantRepo.FindByUserID(userID)
		if err != nil || profile == nil || !profile.IsVerified {
			return errors.New("akun Anda belum terverifikasi. Silakan lengkapi profil dan tunggu verifikasi data oleh admin")
		}

		// 2. Check Training Graduation
		trainings, err := uc.participantRepo.FindByUser(userID)
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
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi admin DAN Anda belum dinyatakan lulus pelatihan.")
		}
		if !profile.IsVerified {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi oleh admin. Silakan lengkapi dokumen di Profil Konsultan.")
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

	// Handle empty NIB by generating a unique placeholder
	if client.NIB == "" {
		client.NIB = "DRAFT-" + uuid.New().String()[:8]
	} else {
		// Check if real NIB already exists
		existing, _ := uc.clientRepo.FindByNIB(client.NIB)
		if existing != nil {
			return domain.ErrNIBExists
		}
	}

	client.ID = uuid.New()
	return uc.clientRepo.Create(client)
}

func (uc *clientUsecase) UpdateClient(client *domain.Client) error {
	return uc.clientRepo.Update(client)
}
