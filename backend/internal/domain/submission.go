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
	CurrentAssigneeRole int              `json:"current_assignee_role"` // Role ID
	RegencyID           *int64           `json:"regency_id,omitempty"`
	DistrictID          *int64           `json:"district_id,omitempty"`
	Payments            []Payment        `gorm:"foreignKey:SubmissionID" json:"payments"`
	FieldValues         []FormFieldValue `gorm:"foreignKey:SubmissionID" json:"field_values,omitempty"`
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
}
