package usecase

import (
	"ananahnu/internal/domain"
	midtransPkg "ananahnu/pkg/midtrans"

	"github.com/google/uuid"
)

// --- Result Types ---

type MidtransPaymentResult struct {
	SnapToken string `json:"snap_token"`
	SnapURL   string `json:"snap_url"`
	OrderID   string `json:"order_id"`
}

// --- Interface ---

type PaymentUsecase interface {
	CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error
	CreateMidtransPayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*MidtransPaymentResult, error)
	HandleMidtransNotification(payload map[string]interface{}) error
	VerifyManualPayment(paymentID int64, approved bool, verifierID uuid.UUID) error
	GetPaymentsBySubmission(submissionID uuid.UUID) ([]domain.Payment, error)
	GetAllPayments(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error)
	SyncPaymentStatus(paymentID int64) error
	InitiateBulkPayment(invoiceIDs []int64, payerID uuid.UUID) (*domain.Payment, error)
	CleanupExpiredPayments() error
}

// --- Implementation ---

type PaymentUsecaseDeps struct {
	PaymentRepo    domain.PaymentRepository
	SubmissionRepo domain.SubmissionRepository
	AuditRepo      domain.AuditLogRepository
	Midtrans       midtransPkg.PaymentGateway
	InvoiceRepo    domain.InvoiceRepository
	BillingUC      BillingUsecase
	NotifUC        NotificationUsecase
	SettingRepo    domain.SystemSettingRepository
	WorkflowUC     SubmissionWorkflowUsecase
}

type paymentUsecase struct {
	PaymentUsecaseDeps
}

func NewPaymentUsecase(deps PaymentUsecaseDeps) PaymentUsecase {
	return &paymentUsecase{
		PaymentUsecaseDeps: deps,
	}
}
