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
	VerifyProfile(userID uuid.UUID, verified bool, leaderID *uuid.UUID) error
}

type consultantUsecase struct {
	profileRepo domain.ConsultantProfileRepository
	userRepo    domain.UserRepository
}

func NewConsultantUsecase(p domain.ConsultantProfileRepository, u domain.UserRepository) ConsultantUsecase {
	return &consultantUsecase{profileRepo: p, userRepo: u}
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

func (uc *consultantUsecase) VerifyProfile(userID uuid.UUID, verified bool, leaderID *uuid.UUID) error {
	profile, err := uc.profileRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("profile not found")
	}
	profile.IsVerified = verified
	if err := uc.profileRepo.Update(profile); err != nil {
		return err
	}

	// Update user's leader if provided
	if leaderID != nil {
		user, err := uc.userRepo.FindByID(userID)
		if err == nil {
			user.LeaderID = leaderID
			return uc.userRepo.Update(user)
		}
	}
	return nil
}
