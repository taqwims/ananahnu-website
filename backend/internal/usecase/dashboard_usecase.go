package usecase

import (
	"ananahnu/internal/domain"
	"github.com/google/uuid"
)

type DashboardUsecase interface {
	GetStats(userID uuid.UUID, role string) (map[string]interface{}, error)
	GetRecentActivities(userID uuid.UUID, role string, limit int) ([]domain.AuditLog, error)
}

type dashboardUsecase struct {
	submissionRepo domain.SubmissionRepository
	clientRepo     domain.ClientRepository
	auditRepo      domain.AuditLogRepository
	userRepo       domain.UserRepository
}

func NewDashboardUsecase(s domain.SubmissionRepository, c domain.ClientRepository, a domain.AuditLogRepository, u domain.UserRepository) DashboardUsecase {
	return &dashboardUsecase{
		submissionRepo: s,
		clientRepo:     c,
		auditRepo:      a,
		userRepo:       u,
	}
}

func (uc *dashboardUsecase) GetStats(userID uuid.UUID, role string) (map[string]interface{}, error) {
	facilitatorIDs := []uuid.UUID{}

	if role == "HALAL_KONSULTAN" {
		facilitatorIDs = append(facilitatorIDs, userID)
	} else if role == "KOORDINATOR" {
		// Find team members
		team, _ := uc.userRepo.FindByLeaderID(userID)
		for _, u := range team {
			facilitatorIDs = append(facilitatorIDs, u.ID)
		}
		// Also include self
		facilitatorIDs = append(facilitatorIDs, userID)
	}

	// Filter
	filter := make(map[string]interface{})
	if len(facilitatorIDs) > 0 {
		filter["facilitator_ids"] = facilitatorIDs
	}

	// 1. Get total clients
	_, totalClients, _ := uc.clientRepo.FindAll(filter, 1, 0)

	// 2. Get submission breakdown
	submissions, _ := uc.submissionRepo.FindAll(filter)

	shTerbit := 0
	sidangFatwa := 0
	pending := 0

	for _, s := range submissions {
		if s.Status == "SH_TERBIT" {
			shTerbit++
		} else if s.Status == "SIDANG_FATWA" {
			sidangFatwa++
		} else {
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
	
	if role == "HALAL_KONSULTAN" {
		filter["user_ids"] = []uuid.UUID{userID}
	} else if role == "KOORDINATOR" {
		team, _ := uc.userRepo.FindByLeaderID(userID)
		userIDs := []uuid.UUID{userID}
		for _, u := range team {
			userIDs = append(userIDs, u.ID)
		}
		filter["user_ids"] = userIDs
	}

	return uc.auditRepo.FindRecent(limit, filter)
}
