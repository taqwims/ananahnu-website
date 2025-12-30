package usecase

import (
	"ananahnu/internal/domain"
	"github.com/google/uuid"
)

type DashboardUsecase interface {
	GetStats(userID uuid.UUID, role string) (map[string]interface{}, error)
}

type dashboardUsecase struct {
	submissionRepo domain.SubmissionRepository
	clientRepo     domain.ClientRepository
}

func NewDashboardUsecase(s domain.SubmissionRepository, c domain.ClientRepository) DashboardUsecase {
	return &dashboardUsecase{
		submissionRepo: s,
		clientRepo:     c,
	}
}

func (uc *dashboardUsecase) GetStats(userID uuid.UUID, role string) (map[string]interface{}, error) {
	// 1. Get total clients
	// 2. Get submission breakdown
	
	// Mocking for now, as strict repository methods for CountByStatus might not exist yet
	// In real implementation, add Count methods to repositories
	
	// stats := map[string]interface{}{
	// 	"total_clients": 150,
	// 	"submissions": map[string]int{
	// 		"SH_TERBIT": 45,
	// 		"SIDANG_FATWA": 12,
	// 		"ON_PROCESS": 30, // Aggregate others
	// 	},
	// }
	
	return map[string]interface{}{
		"total_clients": 120, // Stub
		"sh_terbit": 40,
		"sidang_fatwa": 15,
		"pending": 65,
	}, nil
}
