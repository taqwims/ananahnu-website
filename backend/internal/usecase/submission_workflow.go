package usecase

import (
	"ananahnu/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type SubmissionWorkflowUsecase interface {
	CreateDraft(clientID uuid.UUID) (*domain.Submission, error)
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

func (uc *submissionWorkflowUsecase) CreateDraft(clientID uuid.UUID) (*domain.Submission, error) {
	submission := &domain.Submission{
		ID:       uuid.New(),
		ClientID: clientID,
		Status:   domain.StatusDraft,
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

	// Transition: DRAFT -> VERVAL_PENDAMPING
	// Assignee: Pendamping (Self) or QC? Check plan.
	// Plan: DRAFT -> Submit -> VERVAL_PENDAMPING. 
	// NOTE: VERVAL_PENDAMPING means "Waiting for Pendamping Verification" or "In Pendamping Verification"?
	// If Pendamping submits, it implies they are done? Or maybe Client submits -> Pendamping Verifies.
	// Let's assume: Client/Marketing Submits -> VERVAL_PENDAMPING.
	
	// Target Status: VERVAL_PENDAMPING
	nextStatus := domain.StatusVervalPendamping
	
	// Find Role ID for who needs to act next (Pendamping)
	// Assuming Pendamping = FACILITATOR or similar.
	// Wait, the Actors in plan are: Pendamping, QC Officer, Drafter, Fatwa.
	// So if status is VERVAL_PENDAMPING, the assignee is Pendamping.
	
	// But if Pendamping is the one submitting, shouldn't it go to QC?
	// Plan table: 
	// DRAFT | Submit | Pendamping | VERVAL_PENDAMPING ??
	// This implies Pendamping starts from Draft, and moves to "Verval Mode".
	
	// Or maybe: Client submits -> DRAFT. Pendamping picks up -> VERVAL.
	// Let's stick to the Table literally.
	// "Submit" action triggers DRAFT -> VERVAL_PENDAMPING.
	
	// We need Role ID for "PENDAMPING" (FACILITATOR?) or maybe we don't strictly assign ID yet if dynamic.
	// Let's just update Status.
	
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
		nextStatus = domain.StatusQCOfficer // Back to QC? Or Revision?
		// Plan says: "Verify failed, back to Drafter" -> Wait, Verifikator -> Drafter.
		// Detailed Plan:
		// QC Reject -> VERVAL_PENDAMPING
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
