package repository

import (
	"ananahnu/internal/domain"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type operationalRepository struct {
	db *gorm.DB
}

func NewOperationalRepository(db *gorm.DB) domain.OperationalRepository {
	return &operationalRepository{db: db}
}

func (r *operationalRepository) GetStats() (*domain.OperationalStats, error) {
	stats := &domain.OperationalStats{
		PipelineStages:     make(map[string]int64),
		StatusDistribution: make(map[string]int64),
		TeamWorkload:       make([]domain.TeamWorkloadItem, 0),
		UrgentActions:      make([]domain.UrgentActionItem, 0),
		RecentActivities:   make([]domain.OperationalActivity, 0),
	}

	// 1. Count totals
	_ = r.db.Model(&domain.Submission{}).Count(&stats.TotalNewSubmissions)
	_ = r.db.Model(&domain.Submission{}).Where("status = ?", domain.StatusWaitingAssignment).Count(&stats.UnassignedCount)
	_ = r.db.Model(&domain.Submission{}).Where("status IN ?", []domain.SubmissionStatus{domain.StatusQCOfficer, domain.StatusQCReview}).Count(&stats.WaitingQCCount)
	_ = r.db.Model(&domain.Submission{}).Where("status = ?", domain.StatusDrafter).Count(&stats.WaitingHDOCount)
	_ = r.db.Model(&domain.Submission{}).Where("service_type = ? AND status = ?", "SELF_DECLARE", domain.StatusVervalPendamping).Count(&stats.WaitingSDCount)
	_ = r.db.Model(&domain.Submission{}).Where("audit_date IS NOT NULL").Count(&stats.ScheduledAuditCount)
	_ = r.db.Model(&domain.Submission{}).Where("status = ?", domain.StatusSHTerbit).Count(&stats.SHTerbitCount)
	_ = r.db.Model(&domain.Submission{}).Where("priority IN ?", []string{"HIGH", "URGENT", "CRITICAL"}).Count(&stats.HighPriorityCount)

	// Status Distribution
	type statusCount struct {
		Status domain.SubmissionStatus
		Count  int64
	}
	var sCounts []statusCount
	r.db.Model(&domain.Submission{}).Select("status, count(*) as count").Group("status").Scan(&sCounts)
	for _, sc := range sCounts {
		stats.StatusDistribution[string(sc.Status)] = sc.Count
	}

	// Pipeline Stages
	stats.PipelineStages["1_masuk"] = stats.UnassignedCount
	stats.PipelineStages["2_qc"] = stats.WaitingQCCount
	stats.PipelineStages["3_hdo"] = stats.WaitingHDOCount
	stats.PipelineStages["4_sd"] = stats.WaitingSDCount
	stats.PipelineStages["5_audit"] = stats.ScheduledAuditCount
	stats.PipelineStages["6_bpjph"] = stats.StatusDistribution[string(domain.StatusSubmittedBPJPH)]
	stats.PipelineStages["7_selesai"] = stats.SHTerbitCount

	// Team Workload
	var staffUsers []domain.User
	r.db.Preload("Role").Where("role_id IN (SELECT id FROM roles WHERE name IN ('QC_OFFICER', 'DRAFTER', 'VERIFIKATOR'))").Find(&staffUsers)
	for _, u := range staffUsers {
		var activeCount int64
		r.db.Model(&domain.Submission{}).Where("assigned_drafter_id = ? OR consultant_id = ?", u.ID, u.ID).Count(&activeCount)
		
		roleName := "Staf"
		if u.Role.Name != "" {
			roleName = u.Role.Name
		}
		status := "Tersedia"
		if activeCount >= 10 {
			status = "Penuh"
		} else if activeCount >= 5 {
			status = "Sibuk"
		}

		stats.TeamWorkload = append(stats.TeamWorkload, domain.TeamWorkloadItem{
			Role:        roleName,
			StaffName:   u.FullName,
			ActiveTasks: activeCount,
			Completed:   activeCount / 2,
			Capacity:    15,
			Status:      status,
		})
	}

	// Urgent Actions (overdue or critical)
	var urgentSubs []domain.Submission
	r.db.Preload("Client").Where("priority IN ('URGENT', 'CRITICAL') OR status = 'REVISION_ADVISOR'").Limit(5).Find(&urgentSubs)
	for _, s := range urgentSubs {
		issue := "Prioritas Kritis - Perlu Tindak Lanjut"
		if s.Status == domain.StatusRevisionAdvisor {
			issue = "Berkas Dikembalikan ke Advisor"
		}
		stats.UrgentActions = append(stats.UrgentActions, domain.UrgentActionItem{
			ID:           s.ID.String(),
			No:           fmt.Sprintf("SUB-%s", s.ID.String()[:8]),
			BusinessName: s.Client.BusinessName,
			Issue:        issue,
			Stage:        string(s.Status),
			Priority:     s.Priority,
			DaysOverdue:  2,
		})
	}

	// Recent Activities from Audit Logs
	var logs []domain.AuditLog
	r.db.Preload("User").Order("created_at desc").Limit(10).Find(&logs)
	for _, l := range logs {
		userName := "System"
		if l.User != nil && l.User.FullName != "" {
			userName = l.User.FullName
		}
		stats.RecentActivities = append(stats.RecentActivities, domain.OperationalActivity{
			ID:        fmt.Sprintf("%d", l.ID),
			Action:    l.Action,
			User:      userName,
			Target:    l.EntityType,
			Detail:    l.Notes,
			CreatedAt: l.CreatedAt,
		})
	}

	return stats, nil
}

func (r *operationalRepository) GetSubmissions(filter map[string]interface{}) ([]domain.Submission, int64, error) {
	var submissions []domain.Submission
	var total int64

	query := r.db.Model(&domain.Submission{}).
		Preload("Client").
		Preload("Consultant").
		Preload("AssignedDrafter").
		Preload("BusinessType").
		Preload("ProductCategory").
		Preload("FieldValues").
		Preload("FieldValues.FormField").
		Preload("SubmissionFiles").
		Preload("Invoices").
		Preload("Payments")

	if search, ok := filter["search"].(string); ok && search != "" {
		s := "%" + search + "%"
		query = query.Joins("LEFT JOIN clients ON clients.id = submissions.client_id").
			Where("clients.business_name ILIKE ? OR clients.client_name ILIKE ? OR submissions.tracking_number ILIKE ? OR submissions.sihal_number ILIKE ?", s, s, s, s)
	}

	if status, ok := filter["status"].(string); ok && status != "" && status != "Semua" {
		query = query.Where("submissions.status = ?", status)
	}

	if serviceType, ok := filter["service_type"].(string); ok && serviceType != "" && serviceType != "Semua" {
		query = query.Where("submissions.service_type = ?", serviceType)
	}

	if priority, ok := filter["priority"].(string); ok && priority != "" && priority != "Semua" {
		query = query.Where("submissions.priority = ?", priority)
	}

	if stage, ok := filter["stage"].(string); ok && stage != "" {
		switch stage {
		case "qc":
			query = query.Where("submissions.status IN ?", []domain.SubmissionStatus{domain.StatusWaitingAssignment, domain.StatusQCOfficer, domain.StatusQCReview})
		case "hdo":
			query = query.Where("submissions.status IN ?", []domain.SubmissionStatus{domain.StatusDrafter, domain.StatusRevisionDrafter})
		case "self_declare":
			query = query.Where("submissions.service_type = ?", "SELF_DECLARE")
		case "audit":
			query = query.Where("submissions.service_type = 'REGULER'")
		}
	}

	query.Count(&total)

	// Order & Pagination
	limit := 20
	offset := 0
	if l, ok := filter["limit"].(int); ok && l > 0 {
		limit = l
	}
	if p, ok := filter["page"].(int); ok && p > 0 {
		offset = (p - 1) * limit
	}

	if err := query.Order("submissions.created_at desc").Limit(limit).Offset(offset).Find(&submissions).Error; err != nil {
		return nil, 0, err
	}

	return submissions, total, nil
}

func (r *operationalRepository) AssignSubmission(id uuid.UUID, assigneeID uuid.UUID, targetRole string, priority string, deadline *time.Time, notes string) error {
	updates := map[string]interface{}{
		"assigned_drafter_id": assigneeID,
		"updated_at":          time.Now(),
	}
	if priority != "" {
		updates["priority"] = priority
	}
	if deadline != nil {
		updates["target_deadline"] = deadline
	}

	// Update status based on target role
	if targetRole == "QCO" || targetRole == "QC_OFFICER" {
		updates["status"] = domain.StatusQCOfficer
	} else if targetRole == "DRAFTER" || targetRole == "HDO" {
		updates["status"] = domain.StatusDrafter
	} else if targetRole == "VERIFIKATOR" {
		updates["status"] = domain.StatusVervalPendamping
	}

	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(updates).Error
}

func (r *operationalRepository) BulkAssign(ids []uuid.UUID, assigneeID *uuid.UUID, targetRole string, distMode string, priority string, deadline *time.Time, notes string) error {
	if len(ids) == 0 {
		return nil
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if assigneeID != nil {
		updates["assigned_drafter_id"] = *assigneeID
	}
	if priority != "" {
		updates["priority"] = priority
	}
	if deadline != nil {
		updates["target_deadline"] = deadline
	}

	if targetRole == "QCO" || targetRole == "QC_OFFICER" {
		updates["status"] = domain.StatusQCOfficer
	} else if targetRole == "DRAFTER" || targetRole == "HDO" {
		updates["status"] = domain.StatusDrafter
	} else if targetRole == "VERIFIKATOR" {
		updates["status"] = domain.StatusVervalPendamping
	}

	return r.db.Model(&domain.Submission{}).Where("id IN ?", ids).Updates(updates).Error
}

func (r *operationalRepository) ReturnToAdvisor(id uuid.UUID, note string, managerID uuid.UUID) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":            domain.StatusRevisionAdvisor,
		"reject_note":       note,
		"has_been_returned": true,
		"updated_at":        time.Now(),
	}).Error
}

func (r *operationalRepository) UpdatePriority(id uuid.UUID, priority string) error {
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Update("priority", priority).Error
}

func (r *operationalRepository) ScheduleAudit(id uuid.UUID, auditDate time.Time, lphName string, auditorName string, notes string) error {
	updates := map[string]interface{}{
		"audit_date":   auditDate,
		"lph_name":     lphName,
		"auditor_name": auditorName,
		"status":       domain.StatusReviewSJPHClient,
		"updated_at":   time.Now(),
	}
	return r.db.Model(&domain.Submission{}).Where("id = ?", id).Updates(updates).Error
}

func (r *operationalRepository) GetStaffList() ([]domain.User, error) {
	var users []domain.User
	err := r.db.Preload("Role").
		Where("role_id IN (SELECT id FROM roles WHERE name IN ('QC_OFFICER', 'DRAFTER', 'VERIFIKATOR', 'HALAL_ADVISOR', 'MANAGER'))").
		Order("full_name asc").
		Find(&users).Error
	return users, err
}

// LPH Partner Management
func (r *operationalRepository) GetLPHPartners() ([]domain.LPHPartner, error) {
	var list []domain.LPHPartner
	err := r.db.Order("name asc").Find(&list).Error
	return list, err
}

func (r *operationalRepository) CreateLPHPartner(lph *domain.LPHPartner) error {
	return r.db.Create(lph).Error
}

func (r *operationalRepository) UpdateLPHPartner(lph *domain.LPHPartner) error {
	return r.db.Save(lph).Error
}

func (r *operationalRepository) DeleteLPHPartner(id uuid.UUID) error {
	return r.db.Delete(&domain.LPHPartner{}, "id = ?", id).Error
}

// Auditor Partner Management
func (r *operationalRepository) GetAuditorPartners() ([]domain.AuditorPartner, error) {
	var list []domain.AuditorPartner
	err := r.db.Preload("LPH").Order("name asc").Find(&list).Error
	return list, err
}

func (r *operationalRepository) CreateAuditorPartner(auditor *domain.AuditorPartner) error {
	return r.db.Create(auditor).Error
}

func (r *operationalRepository) UpdateAuditorPartner(auditor *domain.AuditorPartner) error {
	return r.db.Save(auditor).Error
}

func (r *operationalRepository) DeleteAuditorPartner(id uuid.UUID) error {
	return r.db.Delete(&domain.AuditorPartner{}, "id = ?", id).Error
}

// Daily Quota
func (r *operationalRepository) GetDailyQuota(date string) ([]domain.DailyQuota, error) {
	var list []domain.DailyQuota
	err := r.db.Where("date = ?", date).Order("region asc").Find(&list).Error
	return list, err
}

func (r *operationalRepository) SaveDailyQuota(quotas []domain.DailyQuota) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, q := range quotas {
			var existing domain.DailyQuota
			if err := tx.Where("date = ? AND region = ?", q.Date, q.Region).First(&existing).Error; err == nil {
				tx.Model(&existing).Updates(map[string]interface{}{
					"used_today": q.UsedToday,
					"allocated":  q.Allocated,
					"prev_used":  q.PrevUsed,
					"notes":      q.Notes,
					"updated_by": q.UpdatedBy,
					"updated_at": time.Now(),
				})
			} else {
				tx.Create(&q)
			}
		}
		return nil
	})
}
