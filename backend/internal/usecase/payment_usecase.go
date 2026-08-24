package usecase

import (
	"ananahnu/internal/domain"
	mayarPkg "ananahnu/pkg/mayar"
	midtransPkg "ananahnu/pkg/midtrans"

	"github.com/google/uuid"
)

// --- Result Types ---

type MidtransPaymentResult struct {
	SnapToken string `json:"snap_token"`
	SnapURL   string `json:"snap_url"`
	OrderID   string `json:"order_id"`
}

type MayarPaymentResult struct {
	InvoiceID     string `json:"invoice_id"`
	TransactionID string `json:"transaction_id"`
	PaymentURL    string `json:"payment_url"`
	OrderID       string `json:"order_id"`
}

type OnlinePaymentResult struct {
	Gateway       string `json:"gateway"` // "MIDTRANS" or "MAYAR"
	SnapToken     string `json:"snap_token,omitempty"`
	SnapURL       string `json:"snap_url,omitempty"`
	PaymentURL    string `json:"payment_url,omitempty"`
	OrderID       string `json:"order_id"`
	InvoiceID     string `json:"invoice_id,omitempty"`
	TransactionID string `json:"transaction_id,omitempty"`
}

// --- Interface ---

type PaymentUsecase interface {
	CreateManualPayment(submissionID uuid.UUID, amount float64, proofURL string) error
	CreateOnlinePayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*OnlinePaymentResult, error)
	CreateMidtransPayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*MidtransPaymentResult, error)
	CreateMayarPayment(submissionID uuid.UUID, amount float64, email, customerName, phone string) (*MayarPaymentResult, error)
	HandleMidtransNotification(payload map[string]interface{}) error
	HandleMayarNotification(payload map[string]interface{}) error
	VerifyManualPayment(paymentID int64, approved bool, verifierID uuid.UUID) error
	GetPaymentsBySubmission(submissionID uuid.UUID) ([]domain.Payment, error)
	GetAllPayments(filter map[string]interface{}, page, limit int) ([]domain.Payment, int64, error)
	SyncPaymentStatus(paymentID int64) error
	CancelPayment(paymentID int64) error
	InitiateBulkPayment(invoiceIDs []int64, payerID uuid.UUID) (*domain.Payment, error)
	CleanupExpiredPayments() error
	GetActivePaymentGateway() string
}

// --- Implementation ---

type PaymentUsecaseDeps struct {
	PaymentRepo    domain.PaymentRepository
	SubmissionRepo domain.SubmissionRepository
	AuditRepo      domain.AuditLogRepository
	Midtrans       midtransPkg.PaymentGateway
	Mayar          mayarPkg.PaymentGateway
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

