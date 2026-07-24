package usecase

import (
	"ananahnu/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type AdvisorPerformanceDTO struct {
	AdvisorID          uuid.UUID  `json:"advisor_id"`
	AdvisorName        string     `json:"advisor_name"`
	Email              string     `json:"email"`
	Phone              string     `json:"phone"`
	ManagerID          *uuid.UUID `json:"manager_id,omitempty"`
	ManagerName        string     `json:"manager_name"`
	SelfDeclareCount   int        `json:"self_declare_count"`
	RegulerCount       int        `json:"reguler_count"`
	TotalClients       int        `json:"total_clients"`
	ProductivityStatus string     `json:"productivity_status"` // "produktif", "Aktif", "pasif"
}

type ConsultantUsecase interface {
	GetProfile(userID uuid.UUID) (*domain.ConsultantProfile, error)
	UpdateProfile(profile *domain.ConsultantProfile) error
	GetAllProfiles() ([]domain.ConsultantProfile, error)
	VerifyProfile(userID uuid.UUID, verified bool, leaderID *uuid.UUID) error
	GetAdvisorPerformance(period string, managerID *uuid.UUID) ([]AdvisorPerformanceDTO, error)
}

type ConsultantUsecaseDeps struct {
	ProfileRepo    domain.ConsultantProfileRepository
	UserRepo       domain.UserRepository
	SubmissionRepo domain.SubmissionRepository
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
	existing.DynamicData = profile.DynamicData

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

func (uc *consultantUsecase) GetAdvisorPerformance(period string, managerID *uuid.UUID) ([]AdvisorPerformanceDTO, error) {
	// Find all HALAL_ADVISOR users directly from UserRepo
	userFilter := map[string]interface{}{"roles": []string{"HALAL_ADVISOR", "HALAL_MANAGER"}}
	users, _, err := uc.UserRepo.FindAll(userFilter, 1, 1000)
	if err != nil {
		return nil, err
	}

	// Find all submissions
	var subFilter map[string]interface{}
	allSubmissions, _ := uc.SubmissionRepo.FindAll(subFilter)

	var result []AdvisorPerformanceDTO

	for _, u := range users {
		// Filter strictly for HALAL_ADVISOR role in performance list
		if u.Role.Name != "HALAL_ADVISOR" {
			continue
		}

		if managerID != nil && (u.LeaderID == nil || *u.LeaderID != *managerID) {
			continue
		}

		managerName := "-"
		if u.Leader != nil {
			managerName = u.Leader.FullName
		}

		sdCount := 0
		regCount := 0

		for _, sub := range allSubmissions {
			if sub.ConsultantID != nil && *sub.ConsultantID == u.ID {
				subPeriod := sub.CreatedAt.Format("2006-01")
				if period == "" || period == "ALL" || subPeriod == period {
					if sub.ServiceType == "SELF_DECLARE" || sub.ServiceType == "SELF_DECLARE_MANDIRI" {
						sdCount++
					} else if sub.ServiceType == "REGULER" {
						regCount++
					}
				}
			}
		}

		totalClients := sdCount + regCount

		status := "pasif"
		if sdCount > 10 || regCount > 1 {
			status = "produktif"
		} else if (sdCount >= 1 && sdCount <= 10) || regCount == 1 {
			status = "Aktif"
		} else {
			status = "pasif"
		}

		dto := AdvisorPerformanceDTO{
			AdvisorID:          u.ID,
			AdvisorName:        u.FullName,
			Email:              u.Email,
			Phone:              u.Phone,
			ManagerID:          u.LeaderID,
			ManagerName:        managerName,
			SelfDeclareCount:   sdCount,
			RegulerCount:       regCount,
			TotalClients:       totalClients,
			ProductivityStatus: status,
		}
		result = append(result, dto)
	}

	return result, nil
}
