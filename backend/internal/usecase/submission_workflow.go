package usecase

import (
	"ananahnu/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type SubmissionWorkflowUsecase interface {
	CreateDraft(clientID uuid.UUID, serviceType string) (*domain.Submission, error)
	Submit(id uuid.UUID, userID uuid.UUID, userRole string) error
	Approve(id uuid.UUID, userID uuid.UUID, userRole string) error
	Reject(id uuid.UUID, userID uuid.UUID, userRole string, note string) error
	GetSubmissions(filter map[string]interface{}) ([]domain.Submission, error)
	GetSubmission(id uuid.UUID) (*domain.Submission, error)
}

type submissionWorkflowUsecase struct {
	submissionRepo domain.SubmissionRepository
	roleRepo       domain.RoleRepository
	auditRepo      domain.AuditLogRepository
}

func NewSubmissionWorkflowUsecase(s domain.SubmissionRepository, r domain.RoleRepository, a domain.AuditLogRepository) SubmissionWorkflowUsecase {
	return &submissionWorkflowUsecase{
		submissionRepo: s,
		roleRepo:       r,
		auditRepo:      a,
	}
}

func (uc *submissionWorkflowUsecase) logChange(id uuid.UUID, userID uuid.UUID, action string, oldStatus, newStatus domain.SubmissionStatus, note string) {
	// Simple helper to log async or sync
	// In production, maybe run in goroutine
	uc.auditRepo.Create(&domain.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: "SUBMISSION",
		EntityID:   id.String(),
		// Payload: json... (skip for brevity)
		Notes:      "Status change: " + string(oldStatus) + " -> " + string(newStatus) + ". " + note,
	})
}

func (uc *submissionWorkflowUsecase) CreateDraft(clientID uuid.UUID, serviceType string) (*domain.Submission, error) {
	submission := &domain.Submission{
		ID:          uuid.New(),
		ClientID:    clientID,
		Status:      domain.StatusDraft,
		ServiceType: serviceType,
	}
	// Default Assignee: Pendamping (who creates it) or Client? 
	// For now let's say Pendamping creates it.
	
	if err := uc.submissionRepo.Create(submission); err != nil {
		return nil, err
	}
	return submission, nil
}

func (uc *submissionWorkflowUsecase) Submit(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusDraft && sub.Status != domain.StatusRevision {
		return errors.New("submission is not in DRAFT or REVISION state")
	}

	// Transition: DRAFT -> WAITING_PAYMENT
	// Payment must be completed before moving to VERVAL_PENDAMPING.
	// The payment usecase (HandleMidtransNotification or VerifyManualPayment)
	// will transition the submission to VERVAL_PENDAMPING upon successful payment.
	nextStatus := domain.StatusWaitingPayment

	err = uc.submissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "SUBMIT", sub.Status, nextStatus, "")
	}
	return err
}

func (uc *submissionWorkflowUsecase) Approve(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	// State Machine Dictionary
	// CurrentStatus -> RequiredRole -> NextStatus
	// VERVAL_PENDAMPING -> Pendamping -> QC_OFFICER
	// QC_OFFICER -> QC_OFFICER -> DRAFTER
	// DRAFTER -> DRAFTER -> SIDANG_FATWA
	// SIDANG_FATWA -> FATWA -> SH_TERBIT

	var nextStatus domain.SubmissionStatus
	var requiredRole string

	switch sub.Status {
	case domain.StatusVervalPendamping:
		requiredRole = "HALAL_KONSULTAN"
		nextStatus = domain.StatusQCOfficer
	case domain.StatusQCOfficer:
		requiredRole = "QC_OFFICER"
		nextStatus = domain.StatusDrafter
	case domain.StatusDrafter:
		requiredRole = "DRAFTER"
		nextStatus = domain.StatusSidangFatwa
	case domain.StatusSidangFatwa:
		requiredRole = "FATWA" // or VERIFIKATOR? Plan says Fatwa.
		nextStatus = domain.StatusSHTerbit
	default:
		return errors.New("no approval action available for current status")
	}

	// Verify Role (Simplified string check for now)
	// In real app, check permissions.
	// if userRole != requiredRole { return Forbidden }
	_ = requiredRole

	err = uc.submissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "APPROVE", sub.Status, nextStatus, "")
	}
	return err
}

func (uc *submissionWorkflowUsecase) Reject(id uuid.UUID, userID uuid.UUID, userRole string, note string) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	var nextStatus domain.SubmissionStatus

	switch sub.Status {
	case domain.StatusQCOfficer:
		nextStatus = domain.StatusVervalPendamping // Back to Pendamping
	case domain.StatusDrafter:
		nextStatus = domain.StatusVervalPendamping // Drafter sends back to Pendamping for fixes
	default:
		// Default fallback
		nextStatus = domain.StatusRevision
	}

	err = uc.submissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "REJECT", sub.Status, nextStatus, note)
	}
	return err
}

func (uc *submissionWorkflowUsecase) GetSubmissions(filter map[string]interface{}) ([]domain.Submission, error) {
	return uc.submissionRepo.FindAll(filter)
}

func (uc *submissionWorkflowUsecase) GetSubmission(id uuid.UUID) (*domain.Submission, error) {
	return uc.submissionRepo.FindByID(id)
}
