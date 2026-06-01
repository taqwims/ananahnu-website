package usecase

import (
	"ananahnu/internal/domain"
	"github.com/google/uuid"
)

type DashboardUsecase interface {
	GetStats(userID uuid.UUID, role string) (map[string]interface{}, error)
	GetRecentActivities(userID uuid.UUID, role string, limit int) ([]domain.AuditLog, error)
}

type DashboardUsecaseDeps struct {
	SubmissionRepo domain.SubmissionRepository
	ClientRepo     domain.ClientRepository
	AuditRepo      domain.AuditLogRepository
	UserRepo       domain.UserRepository
}

type dashboardUsecase struct {
	DashboardUsecaseDeps
}

func NewDashboardUsecase(deps DashboardUsecaseDeps) DashboardUsecase {
	return &dashboardUsecase{
		DashboardUsecaseDeps: deps,
	}
}

func (uc *dashboardUsecase) GetStats(userID uuid.UUID, role string) (map[string]interface{}, error) {
	facilitatorIDs := []uuid.UUID{}

	switch role {
	case "HALAL_ADVISOR":
		facilitatorIDs = append(facilitatorIDs, userID)
	case "HALAL_MANAGER":
		// Find team members
		team, _ := uc.UserRepo.FindByLeaderID(userID)
		for _, u := range team {
			facilitatorIDs = append(facilitatorIDs, u.ID)
		}
		// Also include self
		facilitatorIDs = append(facilitatorIDs, userID)
	case "HALAL_DIRECTOR":
		// Find all managers immediately under this director
		managers, _ := uc.UserRepo.FindByLeaderID(userID)
		for _, m := range managers {
			facilitatorIDs = append(facilitatorIDs, m.ID)
			// Find advisors under each manager
			advisors, _ := uc.UserRepo.FindByLeaderID(m.ID)
			for _, a := range advisors {
				facilitatorIDs = append(facilitatorIDs, a.ID)
			}
		}
		// Also include self
		facilitatorIDs = append(facilitatorIDs, userID)
	}

	// Filter
	filter := make(map[string]interface{})
	if len(facilitatorIDs) > 0 {
		filter["facilitator_ids"] = facilitatorIDs
	}
	if role == "VERIFIKATOR" {
		filter["service_type"] = "REGULER"
	}

	// 1. Get total clients
	_, totalClients, _ := uc.ClientRepo.FindAll(filter, 1, 0)

	// 2. Get submission breakdown
	submissions, _ := uc.SubmissionRepo.FindAll(filter)

	shTerbit := 0
	sidangFatwa := 0
	pending := 0

	for _, s := range submissions {
		switch s.Status {
		case "SH_TERBIT":
			shTerbit++
		case "SIDANG_FATWA":
			sidangFatwa++
		default:
			pending++
		}
	}

	return map[string]interface{}{
		"total_clients": totalClients,
		"sh_terbit":     shTerbit,
		"sidang_fatwa":  sidangFatwa,
		"pending":       pending,
	}, nil
}

func (uc *dashboardUsecase) GetRecentActivities(userID uuid.UUID, role string, limit int) ([]domain.AuditLog, error) {
	filter := make(map[string]interface{})
	
	switch role {
	case "HALAL_ADVISOR":
		filter["user_ids"] = []uuid.UUID{userID}
	case "HALAL_MANAGER":
		team, _ := uc.UserRepo.FindByLeaderID(userID)
		userIDs := []uuid.UUID{userID}
		for _, u := range team {
			userIDs = append(userIDs, u.ID)
		}
		filter["user_ids"] = userIDs
	case "HALAL_DIRECTOR":
		userIDs := []uuid.UUID{userID}
		managers, _ := uc.UserRepo.FindByLeaderID(userID)
		for _, m := range managers {
			userIDs = append(userIDs, m.ID)
			advisors, _ := uc.UserRepo.FindByLeaderID(m.ID)
			for _, a := range advisors {
				userIDs = append(userIDs, a.ID)
			}
		}
		filter["user_ids"] = userIDs
	}

	return uc.AuditRepo.FindRecent(limit, filter)
}
