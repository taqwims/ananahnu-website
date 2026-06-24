package domain

import (
	"time"

	"github.com/google/uuid"
)

// ── TeleForm Status Constants ──────────────────────────────────────────

type TeleFormStatus string

const (
	TeleFormStatusPending              TeleFormStatus = "PENDING"
	TeleFormStatusTeleconferenceQueued TeleFormStatus = "TELECONFERENCE_QUEUED"
	TeleFormStatusMeetingScheduled     TeleFormStatus = "MEETING_SCHEDULED"
	TeleFormStatusMeetingCompleted     TeleFormStatus = "MEETING_COMPLETED"
	TeleFormStatusAccountCreated       TeleFormStatus = "ACCOUNT_CREATED"
	TeleFormStatusDataInput            TeleFormStatus = "DATA_INPUT"
	TeleFormStatusAgreementSigned      TeleFormStatus = "AGREEMENT_SIGNED"
	TeleFormStatusInvoiceSent          TeleFormStatus = "INVOICE_SENT"
	TeleFormStatusPaid                 TeleFormStatus = "PAID"
	TeleFormStatusExpired              TeleFormStatus = "EXPIRED"
	TeleFormStatusDeleted              TeleFormStatus = "DELETED"
)

// RouteType determines the flow after form submission
type TeleRouteType string

const (
	TeleRouteTeleconference TeleRouteType = "TELECONFERENCE"
	TeleRouteSelfDeclare    TeleRouteType = "SELF_DECLARE"
)

// ConsultationMethod determines how the consultation will be conducted
type TeleConsultationMethod string

const (
	TeleConsultationOnlineMeet TeleConsultationMethod = "ONLINE_MEET"
	TeleConsultationChat       TeleConsultationMethod = "CHAT"
)

// SelfDeclareType determines the sub-type of self-declare (set by telemarketer)
type TeleSelfDeclareType string

const (
	TeleSelfDeclareMandiri TeleSelfDeclareType = "MANDIRI" // Bayar
	TeleSelfDeclareGratis  TeleSelfDeclareType = "GRATIS"  // Subsidi/Gratis
)

// ── TeleForm ───────────────────────────────────────────────────────────

// TeleForm stores initial data from the public shareable form.
type TeleForm struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name          string         `gorm:"not null" json:"name"`
	Phone         string         `gorm:"not null" json:"phone"`
	Email         string         `gorm:"not null" json:"email"`
	BusinessType  string         `json:"business_type"`          // Jenis usaha (free text)
	BusinessScale string         `json:"business_scale"`         // mikro_kecil, menengah, besar
	UsesMeat      bool           `json:"uses_meat"`              // Apakah menggunakan bahan daging?
	ProvinceID    int64          `json:"province_id"`
	Province      Province       `gorm:"foreignKey:ProvinceID" json:"province,omitempty"`
	IsCatering         bool           `json:"is_catering"`                // Catering/Restoran/SPPG?
	IsAMDK             bool           `json:"is_amdk"`                    // Depot Air Minum/AMDK?
	BranchCount        int            `gorm:"default:1" json:"branch_count"`              // Jumlah cabang
	ConsultationMethod string         `json:"consultation_method"`        // ONLINE_MEET, CHAT
	AgreedTerms        bool           `gorm:"default:false" json:"agreed_terms"`
	Address            string         `json:"address"`

	// Routing result (computed on submit)
	RouteType       TeleRouteType `json:"route_type"`
	SelfDeclareType string        `json:"self_declare_type"` // MANDIRI, GRATIS (set by telemarketer for SELF_DECLARE)
	Status          TeleFormStatus `gorm:"default:'PENDING'" json:"status"`

	// Telemarketer assignment (auto for TELECONFERENCE, null for SELF_DECLARE)
	TelemarketerID *uuid.UUID `gorm:"type:uuid" json:"telemarketer_id,omitempty"`
	Telemarketer   *User      `gorm:"foreignKey:TelemarketerID" json:"telemarketer,omitempty"`

	// Link to generated client account
	ClientUserID *uuid.UUID `gorm:"type:uuid" json:"client_user_id,omitempty"`
	ClientUser   *User      `gorm:"foreignKey:ClientUserID" json:"client_user,omitempty"`

	// Tracking
	SharedByID *uuid.UUID `gorm:"type:uuid" json:"shared_by_id,omitempty"` // Telemarketer yang share link
	SharedBy   *User      `gorm:"foreignKey:SharedByID" json:"shared_by,omitempty"`
	IPAddress  string     `json:"ip_address"`

	// Link to submission after account + data input
	SubmissionID *uuid.UUID  `gorm:"type:uuid" json:"submission_id,omitempty"`
	Submission   *Submission `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ── TeleMeeting ────────────────────────────────────────────────────────

type TeleMeetingStatus string

const (
	TeleMeetingStatusScheduled TeleMeetingStatus = "SCHEDULED"
	TeleMeetingStatusCompleted TeleMeetingStatus = "COMPLETED"
	TeleMeetingStatusCancelled TeleMeetingStatus = "CANCELLED"
	TeleMeetingStatusNoShow    TeleMeetingStatus = "NO_SHOW"
)

// TeleMeeting stores meeting/teleconference scheduling data.
type TeleMeeting struct {
	ID             uuid.UUID         `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TeleFormID     uuid.UUID         `gorm:"type:uuid;not null" json:"tele_form_id"`
	TeleForm       TeleForm          `gorm:"foreignKey:TeleFormID" json:"tele_form,omitempty"`
	TelemarketerID uuid.UUID         `gorm:"type:uuid;not null" json:"telemarketer_id"`
	Telemarketer   User              `gorm:"foreignKey:TelemarketerID" json:"telemarketer,omitempty"`
	ScheduledAt    time.Time         `gorm:"not null" json:"scheduled_at"`
	Duration       int               `gorm:"default:30" json:"duration"`     // minutes
	MeetingType    string            `gorm:"not null" json:"meeting_type"`   // ZOOM, WHATSAPP, GMEET
	MeetingLink    string            `json:"meeting_link"`
	Notes          string            `json:"notes"`
	Status         TeleMeetingStatus `gorm:"default:'SCHEDULED'" json:"status"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
}

// ── TeleAgreement ──────────────────────────────────────────────────────

// TeleAgreement stores the electronic service agreement data.
type TeleAgreement struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TeleFormID      uuid.UUID `gorm:"type:uuid;not null" json:"tele_form_id"`
	TeleForm        TeleForm  `gorm:"foreignKey:TeleFormID" json:"tele_form,omitempty"`
	AgreementNumber string    `gorm:"unique;not null" json:"agreement_number"` // HC-{AUTO_NUMBER}
	ClientUserID    uuid.UUID `gorm:"type:uuid;not null" json:"client_user_id"`
	ClientUser      User      `gorm:"foreignKey:ClientUserID" json:"client_user,omitempty"`

	// Frozen perjanjian data
	BusinessName string  `json:"business_name"`
	PICName      string  `json:"pic_name"`
	Address      string  `json:"address"`
	Email        string  `json:"email"`
	Phone        string  `json:"phone"`
	ServiceValue float64 `json:"service_value"`
	DPPercent    float64 `json:"dp_percent"`

	// Three mandatory consents
	DataAccuracyConsent bool `json:"data_accuracy_consent"`
	AgreementConsent    bool `json:"agreement_consent"`
	RegulatorConsent    bool `json:"regulator_consent"`

	// Metadata
	IPAddress string    `json:"ip_address"`
	SignedAt  time.Time `json:"signed_at"`
	PDFURL    string    `json:"pdf_url"`

	// Digital Signature
	VerificationToken string `gorm:"unique;not null" json:"verification_token"`
	SignatureHash     string `json:"signature_hash"`

	CreatedAt time.Time `json:"created_at"`
}

// ── Repository Interfaces ──────────────────────────────────────────────

type TeleFormRepository interface {
	Create(form *TeleForm) error
	FindByID(id uuid.UUID) (*TeleForm, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]TeleForm, int64, error)
	FindByTelemarketerID(telemarketerID uuid.UUID, page, limit int) ([]TeleForm, int64, error)
	FindBySharedByID(sharedByID uuid.UUID, page, limit int) ([]TeleForm, int64, error)
	Update(form *TeleForm) error
	Delete(id uuid.UUID) error
	FindExpiredUnpaid(cutoffDate time.Time) ([]TeleForm, error)
	CountByStatus(filter map[string]interface{}) (map[string]int64, error)
}

type TeleMeetingRepository interface {
	Create(meeting *TeleMeeting) error
	FindByID(id uuid.UUID) (*TeleMeeting, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]TeleMeeting, int64, error)
	FindByTelemarketerID(telemarketerID uuid.UUID, page, limit int) ([]TeleMeeting, int64, error)
	Update(meeting *TeleMeeting) error
	Delete(id uuid.UUID) error
}

type TeleAgreementRepository interface {
	Create(agreement *TeleAgreement) error
	FindByID(id uuid.UUID) (*TeleAgreement, error)
	FindByTeleFormID(teleFormID uuid.UUID) (*TeleAgreement, error)
	GetNextAgreementNumber() (string, error)
}
