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

type ConsultantUsecaseDeps struct {
	ProfileRepo domain.ConsultantProfileRepository
	UserRepo    domain.UserRepository
}

type consultantUsecase struct {
	ConsultantUsecaseDeps
}

func NewConsultantUsecase(deps ConsultantUsecaseDeps) ConsultantUsecase {
	return &consultantUsecase{
		ConsultantUsecaseDeps: deps,
	}
}

func (uc *consultantUsecase) GetProfile(userID uuid.UUID) (*domain.ConsultantProfile, error) {
	return uc.ProfileRepo.FindByUserID(userID)
}

func (uc *consultantUsecase) UpdateProfile(profile *domain.ConsultantProfile) error {
	existing, err := uc.ProfileRepo.FindByUserID(profile.UserID)
	if err != nil {
		// First time creating profile
		return uc.ProfileRepo.Create(profile)
	}

	// Update existing
	existing.KTPURL = profile.KTPURL
	existing.Photo3x4URL = profile.Photo3x4URL
	existing.IjazahSTAURL = profile.IjazahSTAURL
	existing.BankAccountURL = profile.BankAccountURL
	existing.NPWPURL = profile.NPWPURL

	return uc.ProfileRepo.Update(existing)
}

func (uc *consultantUsecase) GetAllProfiles() ([]domain.ConsultantProfile, error) {
	return uc.ProfileRepo.FindAll()
}

func (uc *consultantUsecase) VerifyProfile(userID uuid.UUID, verified bool, leaderID *uuid.UUID) error {
	profile, err := uc.ProfileRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("profile not found")
	}
	profile.IsVerified = verified
	if err := uc.ProfileRepo.Update(profile); err != nil {
		return err
	}

	// Update user's leader if provided
	if leaderID != nil {
		user, err := uc.UserRepo.FindByID(userID)
		if err == nil {
			user.LeaderID = leaderID
			return uc.UserRepo.Update(user)
		}
	}
	return nil
}
