package domain

import (
	"time"

	"github.com/google/uuid"
)

// SPH represents a Surat Pengajuan Halal document with auto-numbering.
// Format penomoran: {sequence}/hc-sph/{bulan_romawi}/{tahun}
type SPH struct {
	ID             int64      `gorm:"primaryKey" json:"id"`
	SubmissionID   uuid.UUID  `gorm:"type:uuid;index" json:"submission_id"`
	Submission     Submission `gorm:"foreignKey:SubmissionID" json:"submission,omitempty"`
	SPHNumber      string     `gorm:"unique;not null" json:"sph_number"`
	SequenceNumber int        `json:"sequence_number"`
	Month          int        `json:"month"`
	Year           int        `json:"year"`
	TotalAmount    float64    `json:"total_amount"`
	CostBreakdown  string     `gorm:"type:jsonb" json:"cost_breakdown"` // Detail biaya dari master
	Status         string     `gorm:"default:'DRAFT'" json:"status"`    // DRAFT, ISSUED, APPROVED
	IssuedAt       *time.Time `json:"issued_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type SPHRepository interface {
	Create(sph *SPH) error
	FindByID(id int64) (*SPH, error)
	FindBySubmissionID(submissionID uuid.UUID) (*SPH, error)
	FindAll(filter map[string]interface{}, page, limit int) ([]SPH, int64, error)
	GetNextSequence(month, year int) (int, error)
	Update(sph *SPH) error
}

// CompanyTarget stores optional monthly/yearly targets set by Director/Super Admin.
type CompanyTarget struct {
	ID              int64     `gorm:"primaryKey" json:"id"`
	Period          string    `gorm:"not null;uniqueIndex" json:"period"` // "2026-06" or "2026"
	TargetSH        *int      `json:"target_sh,omitempty"`
	TargetRevenue   *float64  `json:"target_revenue,omitempty"`
	TargetClients   *int      `json:"target_clients,omitempty"`
	TargetReguler   *int      `json:"target_reguler,omitempty"`
	TargetSelfDeclare *int    `json:"target_self_declare,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CompanyTargetRepository interface {
	FindByPeriod(period string) (*CompanyTarget, error)
	FindAll() ([]CompanyTarget, error)
	Save(target *CompanyTarget) error
	Delete(id int64) error
}
