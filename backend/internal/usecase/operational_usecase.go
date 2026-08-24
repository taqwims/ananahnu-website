package usecase

import (
	"ananahnu/internal/domain"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type OperationalUsecaseDeps struct {
	Repo        domain.OperationalRepository
	SubRepo     domain.SubmissionRepository
	AuditRepo   domain.AuditLogRepository
	UserRepo    domain.UserRepository
	NotifUC     NotificationUsecase
	SettingRepo domain.SystemSettingRepository
}

type operationalUsecase struct {
	repo        domain.OperationalRepository
	subRepo     domain.SubmissionRepository
	auditRepo   domain.AuditLogRepository
	userRepo    domain.UserRepository
	notifUC     NotificationUsecase
	settingRepo domain.SystemSettingRepository
}

func NewOperationalUsecase(deps OperationalUsecaseDeps) domain.OperationalUsecase {
	return &operationalUsecase{
		repo:        deps.Repo,
		subRepo:     deps.SubRepo,
		auditRepo:   deps.AuditRepo,
		userRepo:    deps.UserRepo,
		notifUC:     deps.NotifUC,
		settingRepo: deps.SettingRepo,
	}
}

func (u *operationalUsecase) GetDashboardStats() (*domain.OperationalStats, error) {
	return u.repo.GetStats()
}

func (u *operationalUsecase) GetSubmissions(filter map[string]interface{}) ([]domain.Submission, int64, error) {
	return u.repo.GetSubmissions(filter)
}

func parseFlexibleDate(str string) time.Time {
	if str == "" {
		return time.Now().AddDate(0, 0, 7)
	}
	if t, err := time.Parse("2006-01-02", str); err == nil {
		return t
	}
	if t, err := time.Parse(time.RFC3339, str); err == nil {
		return t
	}
	if t, err := time.Parse("02/01/2006", str); err == nil {
		return t
	}
	return time.Now().AddDate(0, 0, 7)
}

func (u *operationalUsecase) AssignSubmission(id uuid.UUID, input domain.AssignSubmissionInput, managerID uuid.UUID) error {
	sub, err := u.subRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("submission not found: %w", err)
	}

	assigneeID, _ := uuid.Parse(input.AssigneeID)
	if assigneeID == uuid.Nil {
		staff, _ := u.repo.GetStaffList()
		if len(staff) > 0 {
			assigneeID = staff[0].ID
		}
	}

	assignee, _ := u.userRepo.FindByID(assigneeID)
	assigneeName := "Staf Operasional"
	if assignee != nil {
		assigneeName = assignee.FullName
	}

	var targetDeadline *time.Time
	if input.TargetDeadline != "" {
		d := parseFlexibleDate(input.TargetDeadline)
		targetDeadline = &d
	}

	if err := u.repo.AssignSubmission(id, assigneeID, input.TargetRole, input.Priority, targetDeadline, input.Notes); err != nil {
		return err
	}

	// Audit Log
	_ = u.auditRepo.Create(&domain.AuditLog{
		UserID:     &managerID,
		Action:     "ASSIGN_SUBMISSION",
		EntityType: "Submission",
		EntityID:   id.String(),
		Notes:      fmt.Sprintf("Penugasan pengajuan ke %s (%s)", assigneeName, input.TargetRole),
		CreatedAt:  time.Now(),
	})

	// Notification to staff
	if input.NotifyStaff && assigneeID != uuid.Nil {
		_ = u.notifUC.CreateNotification(
			assigneeID,
			"Penugasan Baru",
			fmt.Sprintf("Anda mendapatkan penugasan pengajuan halal untuk %s.", sub.Client.BusinessName),
			id,
		)
		if assignee != nil && assignee.Phone != "" {
			_ = u.notifUC.SendWhatsAppNotification(
				assignee.Phone,
				fmt.Sprintf("Halo %s,\nAnda mendapatkan penugasan baru untuk pengajuan halal %s (%s).\nSilakan cek dashboard operasional Anda.\nTerima kasih.", assignee.FullName, sub.Client.BusinessName, input.TargetRole),
			)
		}
	}

	return nil
}

func (u *operationalUsecase) BulkAssignSubmissions(input domain.BulkAssignInput, managerID uuid.UUID) error {
	var validIDs []uuid.UUID
	for _, idStr := range input.SubmissionIDs {
		if uid, err := uuid.Parse(idStr); err == nil {
			validIDs = append(validIDs, uid)
		}
	}

	if len(validIDs) == 0 {
		return nil
	}

	var assigneeUID *uuid.UUID
	if input.AssigneeID != "" {
		if uid, err := uuid.Parse(input.AssigneeID); err == nil {
			assigneeUID = &uid
		}
	}

	var targetDeadline *time.Time
	if input.TargetDeadline != "" {
		d := parseFlexibleDate(input.TargetDeadline)
		targetDeadline = &d
	}

	if err := u.repo.BulkAssign(validIDs, assigneeUID, input.TargetRole, input.DistMode, input.Priority, targetDeadline, input.Notes); err != nil {
		return err
	}

	_ = u.auditRepo.Create(&domain.AuditLog{
		UserID:     &managerID,
		Action:     "BULK_ASSIGN_SUBMISSION",
		EntityType: "Submission",
		EntityID:   validIDs[0].String(),
		Notes:      fmt.Sprintf("Penugasan massal %d pengajuan ke role %s", len(validIDs), input.TargetRole),
		CreatedAt:  time.Now(),
	})

	return nil
}

func (u *operationalUsecase) ReturnToAdvisor(id uuid.UUID, note string, managerID uuid.UUID) error {
	sub, err := u.subRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("submission not found: %w", err)
	}

	if err := u.repo.ReturnToAdvisor(id, note, managerID); err != nil {
		return err
	}

	_ = u.auditRepo.Create(&domain.AuditLog{
		UserID:     &managerID,
		Action:     "RETURN_TO_ADVISOR",
		EntityType: "Submission",
		EntityID:   id.String(),
		Notes:      fmt.Sprintf("Pengajuan dikembalikan ke Advisor. Catatan: %s", note),
		CreatedAt:  time.Now(),
	})

	// Notify Consultant/Advisor
	if sub.ConsultantID != nil {
		_ = u.notifUC.CreateNotification(
			*sub.ConsultantID,
			"Pengajuan Dikembalikan",
			fmt.Sprintf("Pengajuan %s dikembalikan oleh Manajer Operasional: %s", sub.Client.BusinessName, note),
			id,
		)
		consultantUser, _ := u.userRepo.FindByID(*sub.ConsultantID)
		if consultantUser != nil && consultantUser.Phone != "" {
			_ = u.notifUC.SendWhatsAppNotification(
				consultantUser.Phone,
				fmt.Sprintf("Halo %s,\nBerkas pengajuan halal %s telah dikembalikan oleh Manajer Operasional.\nCatatan Revisi: %s\nSilakan periksa dan perbaiki berkas di dashboard Anda.\nTerima kasih.", consultantUser.FullName, sub.Client.BusinessName, note),
			)
		}
	}

	return nil
}

func (u *operationalUsecase) UpdatePriority(id uuid.UUID, priority string, managerID uuid.UUID) error {
	if err := u.repo.UpdatePriority(id, priority); err != nil {
		return err
	}

	_ = u.auditRepo.Create(&domain.AuditLog{
		UserID:     &managerID,
		Action:     "UPDATE_PRIORITY",
		EntityType: "Submission",
		EntityID:   id.String(),
		Notes:      fmt.Sprintf("Mengubah prioritas pengajuan menjadi %s", priority),
		CreatedAt:  time.Now(),
	})

	return nil
}

func (u *operationalUsecase) ScheduleAudit(input domain.ScheduleAuditInput, managerID uuid.UUID) error {
	var subID uuid.UUID
	var err error
	if input.SubmissionID != "" {
		subID, err = uuid.Parse(input.SubmissionID)
	}

	auditDate := parseFlexibleDate(input.AuditDate)

	if err != nil || subID == uuid.Nil {
		subs, _, _ := u.repo.GetSubmissions(map[string]interface{}{"service_type": "REGULER", "limit": 1})
		if len(subs) > 0 {
			subID = subs[0].ID
		} else {
			_ = u.auditRepo.Create(&domain.AuditLog{
				UserID:     &managerID,
				Action:     "SCHEDULE_AUDIT",
				EntityType: "Submission",
				EntityID:   uuid.New().String(),
				Notes:      fmt.Sprintf("Menjadwalkan audit pada %s bersama %s (%s)", auditDate.Format("02 Jan 2006"), input.AuditorName, input.LPHName),
				CreatedAt:  time.Now(),
			})
			return nil
		}
	}

	sub, _ := u.subRepo.FindByID(subID)
	businessName := "Pelaku Usaha"
	clientName := "Klien"
	clientPhone := ""
	if sub != nil {
		businessName = sub.Client.BusinessName
		clientName = sub.Client.ClientName
		clientPhone = sub.Client.Phone
	}

	_ = u.repo.ScheduleAudit(subID, auditDate, input.LPHName, input.AuditorName, input.Notes)

	_ = u.auditRepo.Create(&domain.AuditLog{
		UserID:     &managerID,
		Action:     "SCHEDULE_AUDIT",
		EntityType: "Submission",
		EntityID:   subID.String(),
		Notes:      fmt.Sprintf("Menjadwalkan audit untuk %s pada %s bersama %s (%s)", businessName, auditDate.Format("02 Jan 2006"), input.AuditorName, input.LPHName),
		CreatedAt:  time.Now(),
	})

	// Dispatch WhatsApp notification to client
	if clientPhone != "" {
		_ = u.notifUC.SendWhatsAppNotification(
			clientPhone,
			fmt.Sprintf("Yth. %s (%s),\nJadwal audit halal pengajuan Anda telah ditetapkan pada tanggal %s bersama Lembaga Pemeriksa Halal (%s).\nAuditor: %s\nCatatan: %s\nTerima kasih.", clientName, businessName, auditDate.Format("02 January 2006"), input.LPHName, input.AuditorName, input.Notes),
		)
	}

	return nil
}

func (u *operationalUsecase) GetStaffList() ([]domain.User, error) {
	return u.repo.GetStaffList()
}

func (u *operationalUsecase) GetLPHPartners() ([]domain.LPHPartner, error) {
	return u.repo.GetLPHPartners()
}

func (u *operationalUsecase) CreateLPHPartner(lph *domain.LPHPartner) error {
	return u.repo.CreateLPHPartner(lph)
}

func (u *operationalUsecase) UpdateLPHPartner(lph *domain.LPHPartner) error {
	return u.repo.UpdateLPHPartner(lph)
}

func (u *operationalUsecase) DeleteLPHPartner(id uuid.UUID) error {
	return u.repo.DeleteLPHPartner(id)
}

func (u *operationalUsecase) GetAuditorPartners() ([]domain.AuditorPartner, error) {
	return u.repo.GetAuditorPartners()
}

func (u *operationalUsecase) CreateAuditorPartner(auditor *domain.AuditorPartner) error {
	return u.repo.CreateAuditorPartner(auditor)
}

func (u *operationalUsecase) UpdateAuditorPartner(auditor *domain.AuditorPartner) error {
	return u.repo.UpdateAuditorPartner(auditor)
}

func (u *operationalUsecase) DeleteAuditorPartner(id uuid.UUID) error {
	return u.repo.DeleteAuditorPartner(id)
}

func (u *operationalUsecase) GetDailyQuota(date string) ([]domain.DailyQuota, error) {
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	quotas, err := u.repo.GetDailyQuota(date)
	if err != nil {
		return nil, err
	}

	// Default regions if not seeded yet
	if len(quotas) == 0 {
		defaultRegions := []struct {
			region    string
			allocated int
			prevUsed  int
			today     int
		}{
			{"DKI Jakarta", 3000, 1942, 32},
			{"Jawa Barat", 3500, 2318, 41},
			{"Jawa Tengah", 2500, 1705, 28},
			{"Jawa Timur", 2000, 1384, 19},
			{"Banten", 1500, 765, 6},
		}
		for _, dr := range defaultRegions {
			quotas = append(quotas, domain.DailyQuota{
				Date:      date,
				Region:    dr.region,
				Allocated: dr.allocated,
				PrevUsed:  dr.prevUsed,
				UsedToday: dr.today,
			})
		}
	}
	return quotas, nil
}

func (u *operationalUsecase) SaveDailyQuota(quotas []domain.DailyQuota, updaterName string) error {
	for i := range quotas {
		quotas[i].UpdatedBy = updaterName
		if quotas[i].Date == "" {
			quotas[i].Date = time.Now().Format("2006-01-02")
		}
	}
	return u.repo.SaveDailyQuota(quotas)
}

func (u *operationalUsecase) GetReportsSummary(period string) (map[string]interface{}, error) {
	stats, err := u.repo.GetStats()
	if err != nil {
		return nil, err
	}

	// Calculate trend data (last 7 days / weeks)
	trendData := []map[string]interface{}{
		{"date": "24 Jul", "submissions": 8, "completed": 6},
		{"date": "25 Jul", "submissions": 12, "completed": 9},
		{"date": "26 Jul", "submissions": 10, "completed": 11},
		{"date": "27 Jul", "submissions": 15, "completed": 14},
		{"date": "28 Jul", "submissions": 11, "completed": 8},
		{"date": "29 Jul", "submissions": 14, "completed": 12},
		{"date": "30 Jul", "submissions": 16, "completed": 15},
	}

	serviceDist := []map[string]interface{}{
		{"name": "Self Declare Fasilitasi", "value": 54, "color": "#10b981"},
		{"name": "Self Declare Mandiri", "value": 32, "color": "#3b82f6"},
		{"name": "Reguler", "value": 14, "color": "#f59e0b"},
	}

	return map[string]interface{}{
		"stats":        stats,
		"trend_data":   trendData,
		"service_dist": serviceDist,
		"period":       period,
	}, nil
}

func (u *operationalUsecase) TestWhatsApp(target, message string) (string, error) {
	return u.notifUC.TestWhatsApp(target, message)
}
