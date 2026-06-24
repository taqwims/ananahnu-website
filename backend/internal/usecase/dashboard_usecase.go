package usecase

import (
	"ananahnu/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
)

type DrafterPerformance struct {
	DrafterID   string `json:"drafter_id"`
	FullName    string `json:"full_name"`
	Email       string `json:"email"`
	Total       int    `json:"total"`
	Drafter     int    `json:"drafter"`      // Status DRAFTER
	QCReview    int    `json:"qc_review"`    // Status QC_REVIEW
	SidangFatwa int    `json:"sidang_fatwa"` // Status SIDANG_FATWA
	SHTerbit    int    `json:"sh_terbit"`    // Status SH_TERBIT
	Revision    int    `json:"revision"`     // Status REVISION
	Others      int    `json:"others"`       // Other statuses
}

type DailyReportItem struct {
	Date      string `json:"date"` // "2026-06-03"
	Assigned  int    `json:"assigned"`
	Completed int    `json:"completed"`
}

type MonthlyReportItem struct {
	Month     string `json:"month"` // "2026-06"
	Assigned  int    `json:"assigned"`
	Completed int    `json:"completed"`
}

type DraftManagerAnalytics struct {
	TotalDrafts        int                  `json:"total_drafts"`
	ActiveDrafts       int                  `json:"active_drafts"`
	CompletedDrafts    int                  `json:"completed_drafts"`
	RevisionDrafts     int                  `json:"revision_drafts"`
	DrafterPerformance []DrafterPerformance `json:"drafter_performance"`
	DailyReport        []DailyReportItem    `json:"daily_report"`
	MonthlyReport      []MonthlyReportItem  `json:"monthly_report"`
}

type DashboardUsecase interface {
	GetStats(userID uuid.UUID, role string) (map[string]interface{}, error)
	GetRecentActivities(userID uuid.UUID, role string, limit int) ([]domain.AuditLog, error)
	GetDraftManagerAnalytics() (*DraftManagerAnalytics, error)
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
	if role == "AUDIT_MANAGER" {
		filter["service_type"] = "REGULER"
	}

	// 1. Get total clients
	_, totalClients, _ := uc.ClientRepo.FindAll(filter, 1, 0)

	// 2. Get submission breakdown
	submissions, _ := uc.SubmissionRepo.FindAll(filter)

	shTerbit := 0
	sidangFatwa := 0
	pending := 0
	audited := 0
	notAudited := 0

	for _, s := range submissions {
		switch s.Status {
		case "SH_TERBIT":
			shTerbit++
		case "SIDANG_FATWA":
			sidangFatwa++
		default:
			pending++
		}

		if s.ServiceType == "REGULER" {
			if s.AuditResult1URL != "" {
				audited++
			} else {
				notAudited++
			}
		}
	}

	stats := map[string]interface{}{
		"total_clients": totalClients,
		"sh_terbit":     shTerbit,
		"sidang_fatwa":  sidangFatwa,
		"pending":       pending,
	}

	if role == "AUDIT_MANAGER" {
		stats["audited"] = audited
		stats["not_audited"] = notAudited
	}

	return stats, nil
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

func (uc *dashboardUsecase) GetDraftManagerAnalytics() (*DraftManagerAnalytics, error) {
	// 1. Get all drafters
	drafters, _, err := uc.UserRepo.FindAll(map[string]interface{}{"role_name": "DRAFTER"}, 1, 1000)
	if err != nil {
		return nil, err
	}

	// Create drafter map for quick access
	drafterMap := make(map[string]*DrafterPerformance)
	for _, d := range drafters {
		drafterMap[d.ID.String()] = &DrafterPerformance{
			DrafterID: d.ID.String(),
			FullName:  d.FullName,
			Email:     d.Email,
		}
	}

	// 2. Get all submissions (all types)
	submissions, err := uc.SubmissionRepo.FindAll(map[string]interface{}{})
	if err != nil {
		return nil, err
	}

	totalDrafts := 0
	activeDrafts := 0
	completedDrafts := 0
	revisionDrafts := 0

	for _, s := range submissions {
		if s.AssignedDrafterID == nil {
			continue
		}
		totalDrafts++

		switch s.Status {
		case domain.StatusDrafter:
			activeDrafts++
		case domain.StatusSHTerbit:
			completedDrafts++
		case domain.StatusRevision:
			revisionDrafts++
		}

		drafterID := s.AssignedDrafterID.String()
		perf, exists := drafterMap[drafterID]
		if !exists {
			fullName := "Unknown Drafter"
			email := ""
			if s.AssignedDrafter != nil {
				fullName = s.AssignedDrafter.FullName
				email = s.AssignedDrafter.Email
			}
			perf = &DrafterPerformance{
				DrafterID: drafterID,
				FullName:  fullName,
				Email:     email,
			}
			drafterMap[drafterID] = perf
		}

		perf.Total++
		switch s.Status {
		case domain.StatusDrafter:
			perf.Drafter++
		case domain.StatusQCReview:
			perf.QCReview++
		case domain.StatusSidangFatwa:
			perf.SidangFatwa++
		case domain.StatusSHTerbit:
			perf.SHTerbit++
		case domain.StatusRevision:
			perf.Revision++
		default:
			perf.Others++
		}
	}

	// Convert drafter map to slice
	drafterPerformanceList := make([]DrafterPerformance, 0, len(drafterMap))
	for _, p := range drafterMap {
		drafterPerformanceList = append(drafterPerformanceList, *p)
	}

	// 3. Get audit logs to build Daily and Monthly Reports (up to last 100,000 logs)
	logs, err := uc.AuditRepo.FindRecent(100000, map[string]interface{}{})
	if err != nil {
		return nil, err
	}

	// Daily report initialization (last 30 days)
	now := time.Now()
	dailyMap := make(map[string]*DailyReportItem)
	var dailyKeys []string
	for i := 29; i >= 0; i-- {
		t := now.AddDate(0, 0, -i)
		dateStr := t.Format("2006-01-02")
		dailyKeys = append(dailyKeys, dateStr)
		dailyMap[dateStr] = &DailyReportItem{Date: dateStr}
	}

	// Monthly report initialization (last 12 months)
	monthlyMap := make(map[string]*MonthlyReportItem)
	var monthlyKeys []string
	for i := 11; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		monthStr := t.Format("2006-01")
		monthlyKeys = append(monthlyKeys, monthStr)
		monthlyMap[monthStr] = &MonthlyReportItem{Month: monthStr}
	}

	for _, log := range logs {
		dateStr := log.CreatedAt.Format("2006-01-02")
		monthStr := log.CreatedAt.Format("2006-01")

		isAssigned := log.Action == "ASSIGN_DRAFTER"
		isCompleted := log.Action == "APPROVE" && strings.Contains(log.Notes, "Status change: DRAFTER ->")

		if isAssigned {
			if item, ok := dailyMap[dateStr]; ok {
				item.Assigned++
			}
			if item, ok := monthlyMap[monthStr]; ok {
				item.Assigned++
			}
		}
		if isCompleted {
			if item, ok := dailyMap[dateStr]; ok {
				item.Completed++
			}
			if item, ok := monthlyMap[monthStr]; ok {
				item.Completed++
			}
		}
	}

	// Convert daily report map to ordered slice
	dailyReport := make([]DailyReportItem, 0, len(dailyKeys))
	for _, key := range dailyKeys {
		dailyReport = append(dailyReport, *dailyMap[key])
	}

	// Convert monthly report map to ordered slice
	monthlyReport := make([]MonthlyReportItem, 0, len(monthlyKeys))
	for _, key := range monthlyKeys {
		monthlyReport = append(monthlyReport, *monthlyMap[key])
	}

	return &DraftManagerAnalytics{
		TotalDrafts:        totalDrafts,
		ActiveDrafts:       activeDrafts,
		CompletedDrafts:    completedDrafts,
		RevisionDrafts:     revisionDrafts,
		DrafterPerformance: drafterPerformanceList,
		DailyReport:        dailyReport,
		MonthlyReport:      monthlyReport,
	}, nil
}
