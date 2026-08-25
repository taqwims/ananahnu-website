package domain

import (
	"time"

	"github.com/google/uuid"
)

type LPHPartner struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name              string    `gorm:"not null" json:"name"`
	Code              string    `gorm:"uniqueIndex;not null" json:"code"`
	Region            string    `json:"region"`
	Phone             string    `json:"phone"`
	Email             string    `json:"email"`
	Status            string    `gorm:"default:'Aktif'" json:"status"` // Aktif, Nonaktif
	ActiveAuditors    int       `gorm:"default:0" json:"active_auditors"`
	MonthlyCapacity   int       `gorm:"default:50" json:"monthly_capacity"`
	ActiveAssignments int       `gorm:"default:0" json:"active_assignments"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type AuditorPartner struct {
	ID              uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name            string      `gorm:"not null" json:"name"`
	Code            string      `gorm:"uniqueIndex;not null" json:"code"`
	LPHID           *uuid.UUID  `gorm:"type:uuid" json:"lph_id,omitempty"`
	LPH             *LPHPartner `gorm:"foreignKey:LPHID" json:"lph,omitempty"`
	LPHName         string      `json:"lph_name"`
	Phone           string      `json:"phone"`
	Email           string      `json:"email"`
	Status          string      `gorm:"default:'Aktif'" json:"status"` // Aktif, Nonaktif
	ActiveAudits    int         `gorm:"default:0" json:"active_audits"`
	MonthlyCapacity int         `gorm:"default:15" json:"monthly_capacity"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

type DailyQuota struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Date      string    `gorm:"index;not null" json:"date"` // YYYY-MM-DD
	Region    string    `gorm:"not null" json:"region"`
	Allocated int       `gorm:"default:0" json:"allocated"`
	UsedToday int       `gorm:"default:0" json:"used_today"`
	PrevUsed  int       `gorm:"default:0" json:"prev_used"`
	Notes     string    `json:"notes,omitempty"`
	UpdatedBy string    `json:"updated_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type OperationalStats struct {
	TotalNewSubmissions int64                  `json:"total_new_submissions"`
	UnassignedCount     int64                  `json:"unassigned_count"`
	WaitingQCCount      int64                  `json:"waiting_qc_count"`
	WaitingHDOCount     int64                  `json:"waiting_hdo_count"`
	WaitingSDCount      int64                  `json:"waiting_sd_count"`
	ScheduledAuditCount int64                  `json:"scheduled_audit_count"`
	SHTerbitCount       int64                  `json:"sh_terbit_count"`
	SLABreachedCount    int64                  `json:"sla_breached_count"`
	HighPriorityCount   int64                  `json:"high_priority_count"`
	PipelineStages      map[string]int64       `json:"pipeline_stages"`
	StatusDistribution  map[string]int64       `json:"status_distribution"`
	TeamWorkload        []TeamWorkloadItem     `json:"team_workload"`
	UrgentActions       []UrgentActionItem     `json:"urgent_actions"`
	RecentActivities    []OperationalActivity  `json:"recent_activities"`
}

type TeamWorkloadItem struct {
	Role        string `json:"role"`
	StaffName   string `json:"staff_name"`
	ActiveTasks int64  `json:"active_tasks"`
	Completed   int64  `json:"completed"`
	Capacity    int64  `json:"capacity"`
	Status      string `json:"status"`
}

type UrgentActionItem struct {
	ID           string `json:"id"`
	No           string `json:"no"`
	BusinessName string `json:"business_name"`
	Issue        string `json:"issue"`
	Stage        string `json:"stage"`
	Priority     string `json:"priority"`
	DaysOverdue  int    `json:"days_overdue"`
}

type OperationalActivity struct {
	ID        string    `json:"id"`
	Action    string    `json:"action"`
	User      string    `json:"user"`
	Target    string    `json:"target"`
	Detail    string    `json:"detail"`
	CreatedAt time.Time `json:"created_at"`
}

type AssignSubmissionInput struct {
	AssigneeID     string `json:"assignee_id"`
	TargetRole     string `json:"target_role"` // QCO, DRAFTER, VERIFIKATOR, AUDITOR
	Priority       string `json:"priority"`
	TargetDeadline string `json:"target_deadline"`
	Notes          string `json:"notes"`
	NotifyStaff    bool   `json:"notify_staff"`
}

type BulkAssignInput struct {
	SubmissionIDs  []string `json:"submission_ids"`
	AssigneeID     string   `json:"assignee_id"`
	TargetRole     string   `json:"target_role"`
	DistMode       string   `json:"dist_mode"` // BAGI_RATA, ROUND_ROBIN, SINGLE
	Priority       string   `json:"priority"`
	TargetDeadline string   `json:"target_deadline"`
	Notes          string   `json:"notes"`
}

type ReturnAdvisorInput struct {
	Note string `json:"note"`
}

type UpdatePriorityInput struct {
	Priority string `json:"priority"` // NORMAL, HIGH, URGENT, CRITICAL
}

type OperationalReportData struct {
	TotalSubmissions    int64                    `json:"total_submissions"`
	SHTerbitCount       int64                    `json:"sh_terbit_count"`
	AvgSLADays          float64                  `json:"avg_sla_days"`
	RejectedCount       int64                    `json:"rejected_count"`
	RejectionRate       float64                  `json:"rejection_rate"`
	GrowthPercentage    float64                  `json:"growth_percentage"`
	TrendData           []ReportTrendItem        `json:"trend_data"`
	ServiceDistribution []ReportDistributionItem `json:"service_distribution"`
	StatusBreakdown     []ReportStatusItem       `json:"status_breakdown"`
	TeamPerformance     []TeamPerformanceItem    `json:"team_performance"`
}

type ReportTrendItem struct {
	Date           string `json:"date"`
	PengajuanMasuk int64  `json:"Pengajuan Masuk"`
	SHTerbit       int64  `json:"SH Terbit"`
	Ditolak        int64  `json:"Ditolak"`
}

type ReportDistributionItem struct {
	Name       string `json:"name"`
	Value      int64  `json:"value"`
	Percentage string `json:"percentage"`
	Color      string `json:"color"`
}

type ReportStatusItem struct {
	Label      string `json:"label"`
	Count      int64  `json:"count"`
	Percentage string `json:"percentage"`
	Color      string `json:"color"`
}

type TeamPerformanceItem struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Initial  string `json:"initial"`
	In       int64  `json:"in"`
	Sh       int64  `json:"sh"`
	Process  int64  `json:"process"`
	Rejected int64  `json:"rejected"`
	SLA      string `json:"sla"`
}

type ScheduleAuditInput struct {
	SubmissionID string `json:"submission_id"`
	AuditDate    string `json:"audit_date"`
	LPHName      string `json:"lph_name"`
	AuditorName  string `json:"auditor_name"`
	Notes        string `json:"notes"`
}

type OperationalRepository interface {
	GetStats() (*OperationalStats, error)
	GetSubmissions(filter map[string]interface{}) ([]Submission, int64, error)
	AssignSubmission(id uuid.UUID, assigneeID uuid.UUID, targetRole string, priority string, deadline *time.Time, notes string) error
	BulkAssign(ids []uuid.UUID, assigneeID *uuid.UUID, targetRole string, distMode string, priority string, deadline *time.Time, notes string) error
	ReturnToAdvisor(id uuid.UUID, note string, managerID uuid.UUID) error
	UpdatePriority(id uuid.UUID, priority string) error
	ScheduleAudit(id uuid.UUID, auditDate time.Time, lphName string, auditorName string, notes string) error
	GetStaffList() ([]User, error)
	
	// LPH & Auditor Management
	GetLPHPartners() ([]LPHPartner, error)
	CreateLPHPartner(lph *LPHPartner) error
	UpdateLPHPartner(lph *LPHPartner) error
	DeleteLPHPartner(id uuid.UUID) error
	GetAuditorPartners() ([]AuditorPartner, error)
	CreateAuditorPartner(auditor *AuditorPartner) error
	UpdateAuditorPartner(auditor *AuditorPartner) error
	DeleteAuditorPartner(id uuid.UUID) error

	// Quota
	GetDailyQuota(date string) ([]DailyQuota, error)
	SaveDailyQuota(quotas []DailyQuota) error

	// Geography
	GetProvinces() ([]Province, error)

	// Reports
	GetReportsSummary(period string) (*OperationalReportData, error)
}

type SendReminderInput struct {
	SubmissionID  string `json:"submission_id"`
	RecipientType string `json:"recipient_type"` // ADVISOR, CLIENT, QCO, AUDITOR, DRAFTER
	RecipientName string `json:"recipient_name"`
	Phone         string `json:"phone"`
	TemplateType  string `json:"template_type"` // REVISI_BERKAS, TENGGAT_SLA, KONFIRMASI_AUDIT, KELENGKAPAN_DOKUMEN, CUSTOM
	Message       string `json:"message"`
	Channel       string `json:"channel"` // WHATSAPP, IN_APP, ALL
}

type OperationalUsecase interface {
	GetDashboardStats() (*OperationalStats, error)
	GetSubmissions(filter map[string]interface{}) ([]Submission, int64, error)
	AssignSubmission(id uuid.UUID, input AssignSubmissionInput, managerID uuid.UUID) error
	BulkAssignSubmissions(input BulkAssignInput, managerID uuid.UUID) error
	ReturnToAdvisor(id uuid.UUID, note string, managerID uuid.UUID) error
	UpdatePriority(id uuid.UUID, priority string, managerID uuid.UUID) error
	ScheduleAudit(input ScheduleAuditInput, managerID uuid.UUID) error
	SendReminder(input SendReminderInput, managerID uuid.UUID) error
	GetStaffList() ([]User, error)
	
	GetLPHPartners() ([]LPHPartner, error)
	CreateLPHPartner(lph *LPHPartner) error
	UpdateLPHPartner(lph *LPHPartner) error
	DeleteLPHPartner(id uuid.UUID) error
	GetAuditorPartners() ([]AuditorPartner, error)
	CreateAuditorPartner(auditor *AuditorPartner) error
	UpdateAuditorPartner(auditor *AuditorPartner) error
	DeleteAuditorPartner(id uuid.UUID) error

	// Geography
	GetProvinces() ([]Province, error)

	GetDailyQuota(date string) ([]DailyQuota, error)
	SaveDailyQuota(quotas []DailyQuota, updaterName string) error
	GetReportsSummary(period string) (*OperationalReportData, error)
	TestWhatsApp(target, message string) (string, error)
}

