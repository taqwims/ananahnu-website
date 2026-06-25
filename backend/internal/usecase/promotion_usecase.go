package usecase

import (
	"ananahnu/internal/domain"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// EligibilityStats berisi data real untuk ditampilkan di progress bar frontend
type EligibilityStats struct {
	TeamSize         int     `json:"team_size"`
	ManagerCount     int     `json:"manager_count"` // khusus HALAL_MANAGER
	Omset3Months     float64 `json:"omset_3_months"`
	RequireTeam      int     `json:"require_team"`
	RequireOmset     float64 `json:"require_omset"`
	IsEligible       bool    `json:"is_eligible"`
	TargetRole       string  `json:"target_role"`
	HasActiveRequest bool    `json:"has_active_request"`
	TrainingPassed   bool    `json:"training_passed"` // apakah sudah lulus pelatihan (syarat HALAL_ADVISOR)
}

type PromotionUsecase interface {
	SubmitPromotionRequest(userID uuid.UUID, certificateURL string) (*domain.PromotionRequest, error)
	VerifyPromotionRequest(id int64) error
	CompletePromotionAssessment(id int64, passed bool) error
	GetPromotionRequests(filter map[string]interface{}) ([]domain.PromotionRequest, error)
	GetEligibilityStats(userID uuid.UUID) (*EligibilityStats, error)
}

type promotionUsecase struct {
	promotionRepo   domain.PromotionRepository
	userRepo        domain.UserRepository
	commissionRepo  domain.CommissionRepository
	roleRepo        domain.RoleRepository
	participantRepo domain.TrainingParticipantRepository
}

type PromotionUsecaseDeps struct {
	PromotionRepo   domain.PromotionRepository
	UserRepo        domain.UserRepository
	CommissionRepo  domain.CommissionRepository
	RoleRepo        domain.RoleRepository
	ParticipantRepo domain.TrainingParticipantRepository
}

func NewPromotionUsecase(deps PromotionUsecaseDeps) PromotionUsecase {
	return &promotionUsecase{
		promotionRepo:   deps.PromotionRepo,
		userRepo:        deps.UserRepo,
		commissionRepo:  deps.CommissionRepo,
		roleRepo:        deps.RoleRepo,
		participantRepo: deps.ParticipantRepo,
	}
}

func (uc *promotionUsecase) SubmitPromotionRequest(userID uuid.UUID, certificateURL string) (*domain.PromotionRequest, error) {
	user, err := uc.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	roleName := user.Role.Name

	// Guard: cek apakah sudah ada request aktif (PENDING atau IN_TRAINING)
	existing, _ := uc.promotionRepo.FindAll(map[string]interface{}{"user_id": userID})
	for _, r := range existing {
		if r.Status == domain.PromotionStatusPending || r.Status == domain.PromotionStatusTraining {
			return nil, fmt.Errorf("Anda sudah memiliki pengajuan promosi yang sedang diproses")
		}
	}

	// Guard: HALAL_ADVISOR wajib sudah lulus pelatihan
	if roleName == "HALAL_ADVISOR" {
		trainings, _ := uc.participantRepo.FindByUser(userID)
		isGraduated := false
		for _, t := range trainings {
			if t.Status == "LULUS" {
				isGraduated = true
				break
			}
		}
		if !isGraduated {
			return nil, fmt.Errorf("Anda belum dinyatakan lulus pelatihan. Selesaikan pelatihan terlebih dahulu sebelum mengajukan promosi.")
		}
	}

	// Hitung ukuran tim:
	// - HALAL_ADVISOR: hitung dari referral tree (referred_by_id)
	// - HALAL_MANAGER: hitung dari leader tree (leader_id)
	var teamSize int
	var downlines []domain.User

	if roleName == "HALAL_ADVISOR" {
		referrals, _ := uc.userRepo.FindByReferredByID(userID)
		teamSize = len(referrals)
	} else {
		downlines, _ = uc.userRepo.FindByLeaderID(userID)
		teamSize = len(downlines)
	}

	// Hitung omset 3 bulan terakhir
	now := time.Now()
	firstOfCurrentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	months := []string{
		firstOfCurrentMonth.Format("2006-01"),
		firstOfCurrentMonth.AddDate(0, -1, 0).Format("2006-01"),
		firstOfCurrentMonth.AddDate(0, -2, 0).Format("2006-01"),
	}

	var totalOmset float64
	commissions, _, _ := uc.commissionRepo.FindAll(map[string]interface{}{"user_or_referrer_id": userID}, 1, 10000)

	for _, c := range commissions {
		validPeriod := false
		for _, m := range months {
			if c.Period == m {
				validPeriod = true
				break
			}
		}
		if validPeriod {
			if roleName == "HALAL_ADVISOR" && c.Type == domain.CommissionTypeDirectSales {
				totalOmset += c.BaseOmset
			} else if roleName == "HALAL_MANAGER" && (c.Type == domain.CommissionTypeStructural || c.Type == domain.CommissionTypeDirectSales) {
				totalOmset += c.BaseOmset
			}
		}
	}

	targetRole := ""
	reqSnapshot := fmt.Sprintf(`{"team_size": %d, "omset_3_months": %.2f}`, teamSize, totalOmset)

	switch roleName {
	case "HALAL_ADVISOR":
		if totalOmset < 30000000 {
			return nil, fmt.Errorf("omset 3 bulan minimal Rp 30.000.000, saat ini: Rp %.2f", totalOmset)
		}
		targetRole = "HALAL_MANAGER"
	case "HALAL_MANAGER":
		managerCount := 0
		for _, downline := range downlines {
			if downline.Role.Name == "HALAL_MANAGER" {
				managerCount++
			}
		}
		reqSnapshot = fmt.Sprintf(`{"team_size": %d, "manager_count": %d, "omset_3_months": %.2f}`, teamSize, managerCount, totalOmset)
		if managerCount < 3 {
			return nil, fmt.Errorf("minimal 3 Halal Manager di tim, saat ini: %d", managerCount)
		}
		if totalOmset < 150000000 {
			return nil, fmt.Errorf("omset grup 3 bulan minimal Rp 150.000.000, saat ini: Rp %.2f", totalOmset)
		}
		targetRole = "HALAL_DIRECTOR"
	default:
		return nil, fmt.Errorf("role %s tidak dapat mengajukan promosi", roleName)
	}

	req := &domain.PromotionRequest{
		UserID:               userID,
		TargetRole:           targetRole,
		Status:               domain.PromotionStatusPending,
		CertificateURL:       certificateURL,
		RequirementsSnapshot: reqSnapshot,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if err := uc.promotionRepo.Create(req); err != nil {
		return nil, err
	}

	return req, nil
}

// GetEligibilityStats mengembalikan data real untuk progress bar di frontend.
// Tidak membuat request — hanya menghitung dan mengembalikan stats.
// Selalu return stats (tidak pernah error kecuali user tidak ditemukan atau role tidak valid).
func (uc *promotionUsecase) GetEligibilityStats(userID uuid.UUID) (*EligibilityStats, error) {
	user, err := uc.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	roleName := user.Role.Name
	if roleName != "HALAL_ADVISOR" && roleName != "HALAL_MANAGER" {
		return nil, fmt.Errorf("role %s tidak memiliki jalur promosi", roleName)
	}

	// Hitung ukuran tim sesuai role:
	// - HALAL_ADVISOR: dari referral tree (referred_by_id)
	// - HALAL_MANAGER: dari leader tree (leader_id)
	var teamSize int
	var downlines []domain.User

	if roleName == "HALAL_ADVISOR" {
		referrals, _ := uc.userRepo.FindByReferredByID(userID)
		teamSize = len(referrals)
	} else {
		downlines, _ = uc.userRepo.FindByLeaderID(userID)
		teamSize = len(downlines)
	}

	managerCount := 0
	for _, d := range downlines {
		if d.Role.Name == "HALAL_MANAGER" {
			managerCount++
		}
	}

	// Cek status lulus pelatihan (hanya relevan untuk HALAL_ADVISOR)
	trainingPassed := false
	if roleName == "HALAL_ADVISOR" {
		trainings, _ := uc.participantRepo.FindByUser(userID)
		for _, t := range trainings {
			if t.Status == "LULUS" {
				trainingPassed = true
				break
			}
		}
	} else {
		trainingPassed = true // HALAL_MANAGER tidak perlu cek pelatihan lagi
	}

	now := time.Now()
	firstOfCurrentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	months := []string{
		firstOfCurrentMonth.Format("2006-01"),
		firstOfCurrentMonth.AddDate(0, -1, 0).Format("2006-01"),
		firstOfCurrentMonth.AddDate(0, -2, 0).Format("2006-01"),
	}

	var totalOmset float64
	commissions, _, _ := uc.commissionRepo.FindAll(map[string]interface{}{"user_or_referrer_id": userID}, 1, 10000)
	for _, c := range commissions {
		validPeriod := false
		for _, m := range months {
			if c.Period == m {
				validPeriod = true
				break
			}
		}
		if !validPeriod {
			continue
		}
		if roleName == "HALAL_ADVISOR" && c.Type == domain.CommissionTypeDirectSales {
			totalOmset += c.BaseOmset
		} else if roleName == "HALAL_MANAGER" && (c.Type == domain.CommissionTypeStructural || c.Type == domain.CommissionTypeDirectSales) {
			totalOmset += c.BaseOmset
		}
	}

	// Cek apakah ada request aktif
	hasActive := false
	existing, _ := uc.promotionRepo.FindAll(map[string]interface{}{"user_id": userID})
	for _, r := range existing {
		if r.Status == domain.PromotionStatusPending || r.Status == domain.PromotionStatusTraining {
			hasActive = true
			break
		}
	}

	stats := &EligibilityStats{
		TeamSize:         teamSize,
		ManagerCount:     managerCount,
		Omset3Months:     totalOmset,
		HasActiveRequest: hasActive,
		TrainingPassed:   trainingPassed,
	}

	if roleName == "HALAL_ADVISOR" {
		stats.RequireTeam = 0
		stats.RequireOmset = 30000000
		stats.TargetRole = "HALAL_MANAGER"
		stats.IsEligible = totalOmset >= 30000000 && trainingPassed
	} else {
		stats.RequireTeam = 3 // jumlah HALAL_MANAGER di tim
		stats.RequireOmset = 150000000
		stats.TargetRole = "HALAL_DIRECTOR"
		stats.IsEligible = managerCount >= 3 && totalOmset >= 150000000
	}

	return stats, nil
}

func (uc *promotionUsecase) VerifyPromotionRequest(id int64) error {
	req, err := uc.promotionRepo.FindByID(id)
	if err != nil {
		return err
	}
	if req.Status != domain.PromotionStatusPending {
		return fmt.Errorf("invalid status transition")
	}
	req.Status = domain.PromotionStatusTraining
	req.UpdatedAt = time.Now()
	return uc.promotionRepo.Update(req)
}

func (uc *promotionUsecase) CompletePromotionAssessment(id int64, passed bool) error {
	req, err := uc.promotionRepo.FindByID(id)
	if err != nil {
		return err
	}
	if req.Status != domain.PromotionStatusTraining {
		return fmt.Errorf("invalid status transition")
	}

	if passed {
		req.Status = domain.PromotionStatusPassed
		
		// Update user role
		roles, _ := uc.roleRepo.FindAll()
		var targetRoleID int
		for _, r := range roles {
			if r.Name == req.TargetRole {
				targetRoleID = r.ID
				break
			}
		}
		
		if targetRoleID != 0 {
			user, _ := uc.userRepo.FindByID(req.UserID)
			if user != nil {
				user.RoleID = targetRoleID
				uc.userRepo.Update(user)

				// When HALAL_ADVISOR promoted to HALAL_MANAGER:
				// Generate 1% REFERRAL commission to the Halal Manager who recruited them
				if req.TargetRole == "HALAL_MANAGER" && user.LeaderID != nil {
					period := time.Now().Format("2006-01")
					// Calculate base from the advisor's total direct sales omset
					commissions, _, _ := uc.commissionRepo.FindAll(map[string]interface{}{
						"user_id": user.ID,
						"type":    domain.CommissionTypeDirectSales,
					}, 1, 10000)

					var totalOmset float64
					for _, c := range commissions {
						totalOmset += c.BaseOmset
					}

					if totalOmset > 0 {
						_ = uc.commissionRepo.UpsertStructural(&domain.Commission{
							ID:         uuid.New(),
							Type:       domain.CommissionTypeReferral,
							ReferrerID: user.LeaderID,
							ReferredID: &user.ID,
							Period:     period,
							BaseOmset:  totalOmset,
							Amount:     totalOmset * 0.01, // 1% referral
							Status:     domain.CommissionStatusPending,
						})
					}
				}
			}
		}
	} else {
		req.Status = domain.PromotionStatusRejected
	}
	
	req.UpdatedAt = time.Now()
	return uc.promotionRepo.Update(req)
}

func (uc *promotionUsecase) GetPromotionRequests(filter map[string]interface{}) ([]domain.PromotionRequest, error) {
	return uc.promotionRepo.FindAll(filter)
}
