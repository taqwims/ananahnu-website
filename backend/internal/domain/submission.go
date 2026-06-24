package domain

import (
	"time"

	"github.com/google/uuid"
)

type SubmissionStatus string

const (
	StatusDraft            SubmissionStatus = "DRAFT"
	StatusWaitingPayment   SubmissionStatus = "WAITING_PAYMENT"
	StatusVervalPendamping SubmissionStatus = "VERVAL_PENDAMPING"
	StatusQCOfficer        SubmissionStatus = "QC_OFFICER"
	StatusDrafter          SubmissionStatus = "DRAFTER"
	StatusQCReview         SubmissionStatus = "QC_REVIEW"
	StatusSidangFatwa      SubmissionStatus = "SIDANG_FATWA"
	StatusSHTerbit         SubmissionStatus = "SH_TERBIT"
	StatusRejected         SubmissionStatus = "REJECTED"
	StatusRevision         SubmissionStatus = "REVISION"
)

type Submission struct {
	ID                  uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	ClientID            uuid.UUID        `gorm:"type:uuid" json:"client_id"`
	Client              Client           `gorm:"foreignKey:ClientID" json:"client"`
	Status              SubmissionStatus `json:"status"`
	ServiceType         string           `json:"service_type"` // REGULER, SELF_DECLARE
	SelfDeclareType     string           `json:"self_declare_type,omitempty"` // MANDIRI, GRATIS
	DataSource          string           `json:"data_source"`  // ORGANIK, MARKETING
	CurrentAssigneeRole int              `json:"current_assignee_role"` // Role ID
	AssignedDrafterID   *uuid.UUID       `gorm:"type:uuid" json:"assigned_drafter_id,omitempty"`
	AssignedDrafter     *User            `gorm:"foreignKey:AssignedDrafterID" json:"assigned_drafter,omitempty"`
	ConsultantID        *uuid.UUID       `gorm:"type:uuid" json:"consultant_id,omitempty"`
	Consultant          *User            `gorm:"foreignKey:ConsultantID" json:"consultant,omitempty"`
	SalesSchemeID       *int64           `json:"sales_scheme_id,omitempty"`
	RegencyID           *int64           `json:"regency_id,omitempty"`
	DistrictID          *int64           `json:"district_id,omitempty"`
	BusinessTypeID      *int64           `json:"business_type_id,omitempty"`
	BusinessType        *BusinessType    `gorm:"foreignKey:BusinessTypeID" json:"business_type,omitempty"`
	ProvinceID          *int64           `json:"province_id,omitempty"`
	ProductCategoryID   *int64           `json:"product_category_id,omitempty"`
	BusinessScaleID     *int64           `json:"business_scale_id,omitempty"`
	ProductCount        int              `gorm:"default:1" json:"product_count"`
	BranchCount         int              `gorm:"default:1" json:"branch_count"`
	Mandays             int              `gorm:"default:1" json:"mandays"`
	RejectNote          string           `json:"reject_note,omitempty"`
	TrackingNumber      *string          `gorm:"uniqueIndex" json:"tracking_number,omitempty"`
	AuditDate           *time.Time       `json:"audit_date,omitempty"`
	AuditResult1URL     string           `gorm:"column:audit_result_1_url" json:"audit_result_1_url,omitempty"`
	AuditResult2URL     string           `gorm:"column:audit_result_2_url" json:"audit_result_2_url,omitempty"`
	SHURL               string           `json:"sh_url,omitempty"`
	Payments            []Payment             `gorm:"foreignKey:SubmissionID" json:"payments"`
	Invoice             *Invoice              `gorm:"foreignKey:SubmissionID" json:"invoice,omitempty"` // deprecated: use Invoices
	Invoices            []Invoice             `gorm:"foreignKey:SubmissionID" json:"invoices,omitempty"`
	Expenses            []Expense             `gorm:"foreignKey:SubmissionID" json:"expenses"`
	CostDetail          *SubmissionCostDetail `gorm:"foreignKey:SubmissionID" json:"cost_detail,omitempty"`
	FieldValues         []FormFieldValue      `gorm:"foreignKey:SubmissionID" json:"field_values,omitempty"`
	BPJPHPaymentStatus  string           `gorm:"default:'UNPAID'" json:"bpjph_payment_status"` // UNPAID, PAID
	BPJPHAmount         float64          `gorm:"default:0" json:"bpjph_amount"`
	BPJPHPaidAt         *time.Time       `json:"bpjph_paid_at,omitempty"`
	CreatedAt           time.Time        `json:"created_at"`
	UpdatedAt           time.Time        `json:"updated_at"`
}

type SubmissionFile struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	SubmissionID uuid.UUID `gorm:"type:uuid" json:"submission_id"`
	FileType     string    `json:"file_type"` // KTP, ProductPhoto, Document
	FileURL      string    `json:"file_url"`
	UploadedBy   uuid.UUID `gorm:"type:uuid" json:"uploaded_by"`
}

type SubmissionRepository interface {
	Create(submission *Submission) error
	FindByID(id uuid.UUID) (*Submission, error)
	FindAll(filter map[string]interface{}) ([]Submission, error)
	UpdateStatus(id uuid.UUID, status SubmissionStatus, assigneeRole int) error
	UpdateAssignee(id uuid.UUID, drafterID *uuid.UUID) error
	UpdateConsultant(id uuid.UUID, consultantID *uuid.UUID) error
	UpdateRejectNote(id uuid.UUID, note string) error
	UpdateSH(id uuid.UUID, shURL string) error
	UpdateAuditInfo(id uuid.UUID, auditDate *time.Time) error
	UpdateAuditResult(id uuid.UUID, url1, url2 string) error
	UpdateTrackingNumber(id uuid.UUID, trackingNumber string) error
	UpdateDataSource(id uuid.UUID, dataSource string) error
	UpdateBusinessType(id uuid.UUID, businessTypeID int64) error
	FindByTrackingNumber(trackingNumber string) (*Submission, error)
	Delete(id uuid.UUID) error
	UpdateBPJPHPayment(id uuid.UUID, status string, amount float64, paidAt *time.Time) error
	UpdateBPJPHPaymentBulk(ids []uuid.UUID, status string, amount float64, paidAt *time.Time) error
	Update(submission *Submission) error
}
