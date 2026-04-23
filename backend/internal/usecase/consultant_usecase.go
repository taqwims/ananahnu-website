package usecase

import (
	"ananahnu/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type ConsultantUsecase interface {
	GetProfile(userID uuid.UUID) (*domain.ConsultantProfile, error)
	UpdateProfile(profile *domain.ConsultantProfile) error
	GetAllProfiles() ([]domain.ConsultantProfile, error)
	VerifyProfile(profileID uuid.UUID, verified bool) error
}

type consultantUsecase struct {
	profileRepo domain.ConsultantProfileRepository
}

func NewConsultantUsecase(p domain.ConsultantProfileRepository) ConsultantUsecase {
	return &consultantUsecase{profileRepo: p}
}

func (uc *consultantUsecase) GetProfile(userID uuid.UUID) (*domain.ConsultantProfile, error) {
	return uc.profileRepo.FindByUserID(userID)
}

func (uc *consultantUsecase) UpdateProfile(profile *domain.ConsultantProfile) error {
	existing, err := uc.profileRepo.FindByUserID(profile.UserID)
	if err != nil {
		// First time creating profile
		return uc.profileRepo.Create(profile)
	}

	// Update existing
	existing.KTPURL = profile.KTPURL
	existing.Photo3x4URL = profile.Photo3x4URL
	existing.IjazahSTAURL = profile.IjazahSTAURL
	existing.BankAccountURL = profile.BankAccountURL
	existing.NPWPURL = profile.NPWPURL

	return uc.profileRepo.Update(existing)
}

func (uc *consultantUsecase) GetAllProfiles() ([]domain.ConsultantProfile, error) {
	return uc.profileRepo.FindAll()
}

func (uc *consultantUsecase) VerifyProfile(profileID uuid.UUID, verified bool) error {
	profile, err := uc.profileRepo.FindByUserID(profileID)
	if err != nil {
		return errors.New("profile not found")
	}
	profile.IsVerified = verified
	return uc.profileRepo.Update(profile)
}
