package usecase

import (
	"ananahnu/internal/domain"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type MonthlyPerformance struct {
	Month            string  `json:"month"` // "2026-01"
	TotalSubmissions int     `json:"total_submissions"`
	SHTerbit         int     `json:"sh_terbit"`
	Revenue          float64 `json:"revenue"`
	Reguler          int     `json:"reguler"`
	SelfDeclare      int     `json:"self_declare"`
}

type TeamMemberPerformance struct {
	UserID           string `json:"user_id"`
	FullName         string `json:"full_name"`
	RoleName         string `json:"role_name"`
	TotalSubmissions int    `json:"total_submissions"`
	SHTerbit         int    `json:"sh_terbit"`
	InProgress       int    `json:"in_progress"`
}

type LeaderPerformanceData struct {
	UserID           string                  `json:"user_id"`
	FullName         string                  `json:"full_name"`
	RoleName         string                  `json:"role_name"` // "HALAL_ADVISOR", "HALAL_MANAGER", "DIRECTOR"
	TotalSubmissions int                     `json:"total_submissions"`
	SHTerbit         int                     `json:"sh_terbit"`
	InProgress       int                     `json:"in_progress"`
	TeamSize         int                     `json:"team_size"`
	TeamMembers      []TeamMemberPerformance `json:"team_members"`
}

type BizDevDashboardData struct {
	MonthlyStats       []MonthlyPerformance    `json:"monthly_stats"`
	LayananReguler     int                     `json:"layanan_reguler"`
	LayananSelfDeclare int                     `json:"layanan_self_declare"`
	TotalSHTerbit      int                     `json:"total_sh_terbit"`
	TotalClients       int64                   `json:"total_clients"`
	Target             *domain.CompanyTarget   `json:"target,omitempty"`
	LeaderPerformance  []LeaderPerformanceData `json:"leader_performance"`
}

type BizDevUsecase interface {
	GetDashboard(month, year int) (*BizDevDashboardData, error)
	GetMonthlyProgress(year int) ([]MonthlyPerformance, error)
	GetAllSubmissions(filter map[string]interface{}, page, limit int) ([]domain.Submission, int64, error)
	GetTarget(period string) (*domain.CompanyTarget, error)
	SetTarget(target *domain.CompanyTarget) error
	GetAllTargets() ([]domain.CompanyTarget, error)
	DeleteTarget(id int64) error
}

type BizDevUsecaseDeps struct {
	SubmissionRepo domain.SubmissionRepository
	ClientRepo     domain.ClientRepository
	InvoiceRepo    domain.InvoiceRepository
	TargetRepo     domain.CompanyTargetRepository
	UserRepo       domain.UserRepository
}

type bizDevUsecase struct {
	BizDevUsecaseDeps
}

func NewBizDevUsecase(deps BizDevUsecaseDeps) BizDevUsecase {
	return &bizDevUsecase{BizDevUsecaseDeps: deps}
}

func (uc *bizDevUsecase) GetDashboard(month, year int) (*BizDevDashboardData, error) {
	dashboard := &BizDevDashboardData{
		LeaderPerformance: []LeaderPerformanceData{},
	}

	// Get all submissions
	submissions, _ := uc.SubmissionRepo.FindAll(map[string]interface{}{})

	perfMap := make(map[string]*LeaderPerformanceData)

	for _, s := range submissions {
		// Filter by year
		if year > 0 && s.CreatedAt.Year() != year {
			continue
		}
		if month > 0 && int(s.CreatedAt.Month()) != month {
			continue
		}

		if s.ServiceType == "REGULER" {
			dashboard.LayananReguler++
		} else {
			dashboard.LayananSelfDeclare++
		}

		isSH := s.Status == "SH_TERBIT"
		if isSH {
			dashboard.TotalSHTerbit++
		}

		// 1. Advisor (Facilitator)
		adv := s.Client.Facilitator
		if adv.ID != uuid.Nil && adv.FullName != "" {
			if _, ok := perfMap[adv.ID.String()]; !ok {
				roleName := "HALAL_ADVISOR"
				if adv.Role.Name != "" {
					roleName = adv.Role.Name
				}
				perfMap[adv.ID.String()] = &LeaderPerformanceData{
					UserID:   adv.ID.String(),
					FullName: adv.FullName,
					RoleName: roleName,
				}
			}
			perfMap[adv.ID.String()].TotalSubmissions++
			if isSH {
				perfMap[adv.ID.String()].SHTerbit++
			} else {
				perfMap[adv.ID.String()].InProgress++
			}
		}

		// 2. Halal Manager (Advisor's Leader)
		if adv.ID != uuid.Nil && adv.Leader != nil && adv.Leader.ID != uuid.Nil && adv.Leader.FullName != "" {
			mgr := adv.Leader
			if _, ok := perfMap[mgr.ID.String()]; !ok {
				roleName := "HALAL_MANAGER"
				if mgr.Role.Name != "" {
					roleName = mgr.Role.Name
				}
				perfMap[mgr.ID.String()] = &LeaderPerformanceData{
					UserID:   mgr.ID.String(),
					FullName: mgr.FullName,
					RoleName: roleName,
				}
			}
			perfMap[mgr.ID.String()].TotalSubmissions++
			if isSH {
				perfMap[mgr.ID.String()].SHTerbit++
			} else {
				perfMap[mgr.ID.String()].InProgress++
			}

			// 3. Halal Director (Manager's Leader)
			if mgr.Leader != nil && mgr.Leader.ID != uuid.Nil && mgr.Leader.FullName != "" {
				dir := mgr.Leader
				if _, ok := perfMap[dir.ID.String()]; !ok {
					roleName := "DIRECTOR"
					if dir.Role.Name != "" {
						roleName = dir.Role.Name
					}
					perfMap[dir.ID.String()] = &LeaderPerformanceData{
						UserID:   dir.ID.String(),
						FullName: dir.FullName,
						RoleName: roleName,
					}
				}
				perfMap[dir.ID.String()].TotalSubmissions++
				if isSH {
					perfMap[dir.ID.String()].SHTerbit++
				} else {
					perfMap[dir.ID.String()].InProgress++
				}
			}
		}
	}

	// Convert map to slice after computing team details
	users, _, _ := uc.UserRepo.FindAll(map[string]interface{}{}, 1, 100000)

	userNameMap := make(map[string]string)
	userRoleMap := make(map[string]string)
	teamSizeMap := make(map[string]int)
	leaderMembers := make(map[string][]string)

	for _, u := range users {
		userNameMap[u.ID.String()] = u.FullName
		roleName := "HALAL_ADVISOR"
		if u.Role.Name != "" {
			roleName = u.Role.Name
		}
		userRoleMap[u.ID.String()] = roleName

		if u.LeaderID != nil {
			leaderID := u.LeaderID.String()
			teamSizeMap[leaderID]++
			leaderMembers[leaderID] = append(leaderMembers[leaderID], u.ID.String())
		}
	}

	for leaderID, leaderPerf := range perfMap {
		leaderPerf.TeamSize = teamSizeMap[leaderID]
		members := leaderMembers[leaderID]
		leaderPerf.TeamMembers = make([]TeamMemberPerformance, 0, len(members))
		for _, memberID := range members {
			mName := userNameMap[memberID]
			mRole := userRoleMap[memberID]

			subs := 0
			sh := 0
			ip := 0
			if mPerf, ok := perfMap[memberID]; ok {
				subs = mPerf.TotalSubmissions
				sh = mPerf.SHTerbit
				ip = mPerf.InProgress
			}

			leaderPerf.TeamMembers = append(leaderPerf.TeamMembers, TeamMemberPerformance{
				UserID:           memberID,
				FullName:         mName,
				RoleName:         mRole,
				TotalSubmissions: subs,
				SHTerbit:         sh,
				InProgress:       ip,
			})
		}
	}

	for _, p := range perfMap {
		dashboard.LeaderPerformance = append(dashboard.LeaderPerformance, *p)
	}

	// Get total clients
	_, totalClients, _ := uc.ClientRepo.FindAll(map[string]interface{}{}, 1, 0)
	dashboard.TotalClients = totalClients

	// Get monthly stats for the year
	if year > 0 {
		stats, _ := uc.GetMonthlyProgress(year)
		dashboard.MonthlyStats = stats
	} else {
		stats, _ := uc.GetMonthlyProgress(time.Now().Year())
		dashboard.MonthlyStats = stats
	}

	// Get current period target
	var period string
	if month > 0 && year > 0 {
		period = fmt.Sprintf("%d-%02d", year, month)
	} else if year > 0 {
		period = fmt.Sprintf("%d", year)
	} else {
		period = time.Now().Format("2006")
	}
	target, err := uc.TargetRepo.FindByPeriod(period)
	if err == nil && target != nil {
		dashboard.Target = target
	}

	return dashboard, nil
}

func (uc *bizDevUsecase) GetMonthlyProgress(year int) ([]MonthlyPerformance, error) {
	submissions, _ := uc.SubmissionRepo.FindAll(map[string]interface{}{})
	invoices, _, _ := uc.InvoiceRepo.FindAll(map[string]interface{}{}, 1, 100000)

	// Build monthly map
	monthlyMap := make(map[string]*MonthlyPerformance)
	for m := 1; m <= 12; m++ {
		key := fmt.Sprintf("%d-%02d", year, m)
		monthlyMap[key] = &MonthlyPerformance{Month: key}
	}

	for _, s := range submissions {
		if s.CreatedAt.Year() != year {
			continue
		}
		key := s.CreatedAt.Format("2006-01")
		if perf, ok := monthlyMap[key]; ok {
			perf.TotalSubmissions++
			if s.ServiceType == "REGULER" {
				perf.Reguler++
			} else {
				perf.SelfDeclare++
			}
			if s.Status == "SH_TERBIT" {
				perf.SHTerbit++
			}
		}
	}

	for _, inv := range invoices {
		if inv.CreatedAt.Year() != year || inv.Status != domain.InvoiceStatusPaid {
			continue
		}
		key := inv.CreatedAt.Format("2006-01")
		if perf, ok := monthlyMap[key]; ok {
			perf.Revenue += inv.Amount
		}
	}

	// Convert to slice
	var result []MonthlyPerformance
	for m := 1; m <= 12; m++ {
		key := fmt.Sprintf("%d-%02d", year, m)
		result = append(result, *monthlyMap[key])
	}

	return result, nil
}

func (uc *bizDevUsecase) GetAllSubmissions(filter map[string]interface{}, page, limit int) ([]domain.Submission, int64, error) {
	submissions, err := uc.SubmissionRepo.FindAll(filter)
	if err != nil {
		return nil, 0, err
	}
	total := int64(len(submissions))
	start := (page - 1) * limit
	end := start + limit
	if start > len(submissions) {
		return []domain.Submission{}, total, nil
	}
	if end > len(submissions) {
		end = len(submissions)
	}
	return submissions[start:end], total, nil
}

func (uc *bizDevUsecase) GetTarget(period string) (*domain.CompanyTarget, error) {
	return uc.TargetRepo.FindByPeriod(period)
}

func (uc *bizDevUsecase) SetTarget(target *domain.CompanyTarget) error {
	existing, err := uc.TargetRepo.FindByPeriod(target.Period)
	if err == nil && existing != nil {
		target.ID = existing.ID
		target.CreatedAt = existing.CreatedAt
	}
	target.UpdatedAt = time.Now()
	return uc.TargetRepo.Save(target)
}

func (uc *bizDevUsecase) GetAllTargets() ([]domain.CompanyTarget, error) {
	return uc.TargetRepo.FindAll()
}

func (uc *bizDevUsecase) DeleteTarget(id int64) error {
	return uc.TargetRepo.Delete(id)
}
