package usecase

import (
	"ananahnu/internal/domain"
	"time"

	"github.com/google/uuid"
)

type SubmissionWorkflowUsecase interface {
	CreateDraft(clientID *uuid.UUID, businessName string, serviceType string, facilitatorID uuid.UUID) (*domain.Submission, error)
	CreateFull(input CreateFullInput, userID uuid.UUID, userRole string) (*domain.Submission, error)
	Submit(id uuid.UUID, userID uuid.UUID, userRole string) error
	Approve(id uuid.UUID, userID uuid.UUID, userRole string) error
	ApproveWithDrafter(id uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error
	BulkApproveWithDrafter(ids []uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error
	AssignConsultant(id uuid.UUID, userID uuid.UUID, userRole string, consultantID uuid.UUID) error
	Reject(id uuid.UUID, userID uuid.UUID, userRole string, note string) error
	GetSubmissions(userID uuid.UUID, role string, filter map[string]interface{}) ([]domain.Submission, error)
	GetSubmission(id uuid.UUID) (*domain.Submission, error)
	GetHistory(id uuid.UUID) ([]domain.AuditLog, error)
	IssueSH(id uuid.UUID, userID uuid.UUID, shURL string) error
	UpdateAuditInfo(id uuid.UUID, userID uuid.UUID, userRole string, auditDate *time.Time) error
	UpdateAuditResult(id uuid.UUID, userID uuid.UUID, userRole string, url1, url2 string) error
	UpdateBusinessType(id uuid.UUID, userID uuid.UUID, userRole string, businessTypeID int64) error
	TrackByNumber(trackingNumber string) (*domain.Submission, error)
	Delete(id uuid.UUID, userID uuid.UUID, userRole string) error
	HandlePaymentSuccess(id uuid.UUID, amount float64) error
	IsAuthorized(userID uuid.UUID, role string, submissionID uuid.UUID) bool
	UpdateClientInfoAndPricing(id uuid.UUID, input UpdateClientInfoAndPricingInput, userID uuid.UUID, userRole string) error
}

type CreateFullInput struct {
	ID         uuid.UUID `json:"id"` // Optional pre-generated ID
	ClientData struct {
		NIB           string `json:"nib"`
		NIK           string `json:"nik"`
		BusinessName  string `json:"business_name"`
		ClientName    string `json:"client_name"`
		Address       string `json:"address"`
		ProductName   string `json:"product_name"`
		ServiceType   string `json:"service_type"`
		ContactPerson string `json:"contact_person"`
		Phone          string `json:"phone"`
		BusinessTypeID *int64 `json:"business_type_id"`
	} `json:"client_data"`
	FieldValues []FieldValueInput `json:"field_values"`
}

type UpdateClientInfoAndPricingInput struct {
	// Client fields
	BusinessName  string `json:"business_name"`
	ClientName    string `json:"client_name"`
	NIB           string `json:"nib"`
	NIK           string `json:"nik"`
	ProductName   string `json:"product_name"`
	Address       string `json:"address"`
	ContactPerson string `json:"contact_person"`
	Phone         string `json:"phone"`

	// Pricing fields
	BusinessTypeID    *int64 `json:"business_type_id"`
	ProductCategoryID *int64 `json:"product_category_id"`
	BusinessScaleID   *int64 `json:"business_scale_id"`
	ProvinceID        *int64 `json:"province_id"`
	RegencyID         *int64 `json:"regency_id"`
	DistrictID        *int64 `json:"district_id"`
	ProductCount      int    `json:"product_count"`
	BranchCount       int    `json:"branch_count"`
	Mandays           int    `json:"mandays"`
	SalesSchemeID     *int64 `json:"sales_scheme_id"`
	DataSource        string `json:"data_source"`
	SelectedOptionalComponentIDs *[]int64 `json:"selected_optional_component_ids"`
}


type SubmissionWorkflowDeps struct {
	SubmissionRepo    domain.SubmissionRepository
	ClientRepo        domain.ClientRepository
	RoleRepo          domain.RoleRepository
	AuditRepo         domain.AuditLogRepository
	UserRepo          domain.UserRepository
	NotifUC           NotificationUsecase
	InvoiceRepo       domain.InvoiceRepository
	RateRepo          domain.CoordinatorRateRepository
	FieldValueRepo    domain.FormFieldValueRepository
	BillingConfigRepo domain.BillingConfigRepository
	ConsultantRepo    domain.ConsultantProfileRepository
	ParticipantRepo   domain.TrainingParticipantRepository
	SettingRepo       domain.SystemSettingRepository
	TeleFormRepo      domain.TeleFormRepository
}

type submissionWorkflowUsecase struct {
	SubmissionWorkflowDeps
}

func NewSubmissionWorkflowUsecase(deps SubmissionWorkflowDeps) SubmissionWorkflowUsecase {
	return &submissionWorkflowUsecase{
		SubmissionWorkflowDeps: deps,
	}
}
