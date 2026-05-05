package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
)

type SubmissionWorkflowUsecase interface {
	CreateDraft(clientID *uuid.UUID, businessName string, serviceType string, facilitatorID uuid.UUID) (*domain.Submission, error)
	CreateFull(input CreateFullInput, userID uuid.UUID) (*domain.Submission, error)
	Submit(id uuid.UUID, userID uuid.UUID, userRole string) error
	Approve(id uuid.UUID, userID uuid.UUID, userRole string) error
	Reject(id uuid.UUID, userID uuid.UUID, userRole string, note string) error
	GetSubmissions(userID uuid.UUID, role string, filter map[string]interface{}) ([]domain.Submission, error)
	GetSubmission(id uuid.UUID) (*domain.Submission, error)
	GetHistory(id uuid.UUID) ([]domain.AuditLog, error)
}

type CreateFullInput struct {
	ID         uuid.UUID `json:"id"` // Optional pre-generated ID
	ClientData struct {
		NIB           string `json:"nib"`
		NIK           string `json:"nik"`
		BusinessName  string `json:"business_name"`
		Address       string `json:"address"`
		ProductName   string `json:"product_name"`
		ServiceType   string `json:"service_type"`
		ContactPerson string `json:"contact_person"`
		Phone         string `json:"phone"`
	} `json:"client_data"`
	FieldValues []FieldValueInput `json:"field_values"`
}

type submissionWorkflowUsecase struct {
	submissionRepo domain.SubmissionRepository
	clientRepo     domain.ClientRepository
	roleRepo       domain.RoleRepository
	auditRepo      domain.AuditLogRepository
	userRepo       domain.UserRepository
	notifUC        NotificationUsecase
	invoiceRepo    domain.InvoiceRepository
	rateRepo       domain.CoordinatorRateRepository
	fieldValueRepo domain.FormFieldValueRepository
}

func NewSubmissionWorkflowUsecase(s domain.SubmissionRepository, c domain.ClientRepository, r domain.RoleRepository, a domain.AuditLogRepository, u domain.UserRepository, n NotificationUsecase, i domain.InvoiceRepository, rate domain.CoordinatorRateRepository, fv domain.FormFieldValueRepository) SubmissionWorkflowUsecase {
	return &submissionWorkflowUsecase{
		submissionRepo: s,
		clientRepo:     c,
		roleRepo:       r,
		auditRepo:      a,
		userRepo:       u,
		notifUC:        n,
		invoiceRepo:    i,
		rateRepo:       rate,
		fieldValueRepo: fv,
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

func (uc *submissionWorkflowUsecase) CreateDraft(clientID *uuid.UUID, businessName string, serviceType string, facilitatorID uuid.UUID) (*domain.Submission, error) {
	var actualClientID uuid.UUID
	if clientID != nil && *clientID != uuid.Nil {
		actualClientID = *clientID
	} else if businessName != "" {
		// Create a stub client
		newClient := &domain.Client{
			ID:            uuid.New(),
			BusinessName:  businessName,
			ServiceType:   serviceType,
			FacilitatorID: facilitatorID,
			CreatedBy:     facilitatorID,
			NIB:           "DRAFT-" + uuid.New().String()[:8], // Unique placeholder
		}
		if err := uc.clientRepo.Create(newClient); err != nil {
			return nil, err
		}
		actualClientID = newClient.ID
	} else {
		return nil, errors.New("either client_id or business_name is required")
	}

	submission := &domain.Submission{
		ID:          uuid.New(),
		ClientID:    actualClientID,
		Status:      domain.StatusDraft,
		ServiceType: serviceType,
	}

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

	// Transition: DRAFT -> WAITING_PAYMENT or VERVAL_PENDAMPING
	// If SELF_DECLARE, usually it goes straight to verification or has post-issuance billing.
	// If REGULER or SELF_DECLARE_MANDIRI, it must go to WAITING_PAYMENT first.
	nextStatus := domain.StatusWaitingPayment
	if sub.ServiceType == "SELF_DECLARE" {
		nextStatus = domain.StatusVervalPendamping
	}

	err = uc.submissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "SUBMIT", sub.Status, nextStatus, "")

		// IF SELF_DECLARE_MANDIRI -> Create immediate invoice of 230,000
		if sub.ServiceType == "SELF_DECLARE_MANDIRI" {
			log.Printf("[INVOICE] Creating immediate invoice for SELF_DECLARE_MANDIRI: %s", id)
			
			// Find Payer (the consultant/facilitator)
			payerID := userID // The one who submits is usually the consultant
			
			uc.invoiceRepo.Create(&domain.Invoice{
				SubmissionID: id,
				PayerID:      &payerID,
				ServiceType:  "SELF_DECLARE_MANDIRI",
				Amount:       230000,
				Status:       domain.InvoiceStatusUnpaid,
				Notes:        "Pembayaran Awal SELF_DECLARE_MANDIRI",
			})
		}
		
		// Notify Finance if status is WAITING_PAYMENT
		if nextStatus == domain.StatusWaitingPayment {
			// Find finance users
			users, _, _ := uc.userRepo.FindAll(map[string]interface{}{}, 1, 100)
			for _, u := range users {
				if u.Role.Name == "FINANCE" || u.Role.Name == "ADMIN_KEUANGAN" {
					uc.notifUC.CreateNotification(u.ID, "Tagihan Baru", "Pengajuan baru " + sub.Client.BusinessName + " menunggu pembayaran.", id)
				}
			}
		}
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
		nextStatus = domain.StatusDrafter
	case domain.StatusDrafter:
		requiredRole = "DRAFTER"
		nextStatus = domain.StatusQCOfficer
	case domain.StatusQCOfficer:
		requiredRole = "QC_OFFICER"
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

		// IF SH_TERBIT and SELF_DECLARE -> Trigger Invoice to Coordinator
		serviceType := sub.ServiceType
		if serviceType == "" {
			client, _ := uc.clientRepo.FindByID(sub.ClientID)
			if client != nil {
				serviceType = client.ServiceType
			}
		}

		if nextStatus == domain.StatusSHTerbit && serviceType == "SELF_DECLARE" {
			log.Printf("[INVOICE] Triggering invoice for submission %s (SH_TERBIT)", id)
			
			// Find Facilitator (The Consultant to be billed)
			client, _ := uc.clientRepo.FindByID(sub.ClientID)
			if client != nil && client.FacilitatorID != uuid.Nil {
				facilitatorID := client.FacilitatorID
				log.Printf("[INVOICE] Billing Facilitator/Consultant %s", facilitatorID)

				// Determine Amount
				// We still use coordinator rate if they have one, OR a default/config rate.
				// For now, let's look for a rate associated with the coordinator of this consultant.
				
				var coordinatorID uuid.UUID
				facilitator, _ := uc.userRepo.FindByID(facilitatorID)
				if facilitator != nil {
					if facilitator.Role.Name == "KOORDINATOR" {
						coordinatorID = facilitator.ID
					} else if facilitator.LeaderID != nil {
						coordinatorID = *facilitator.LeaderID
					}
				}

				amount := 100000.0 // Default
				if coordinatorID != uuid.Nil {
					rate, _ := uc.rateRepo.FindByCoordinatorID(coordinatorID)
					if rate != nil {
						amount = rate.RatePerSH
						log.Printf("[INVOICE] Using Team/Coordinator Rate: Rp %.2f", amount)
					}
				}

				// Create Invoice
				err := uc.invoiceRepo.Create(&domain.Invoice{
					SubmissionID: id,
					PayerID:      &facilitatorID, // Primary payer is the consultant
					ServiceType:  "SELF_DECLARE",
					Amount:       amount,
					Status:       domain.InvoiceStatusUnpaid,
					Notes:        "Tagihan SH Terbit untuk " + client.BusinessName,
				})
				if err != nil {
					log.Printf("[INVOICE] FAILED to create invoice: %v", err)
				} else {
					log.Printf("[INVOICE] Successfully created invoice for consultant %s", facilitatorID)
				}
			} else {
				log.Printf("[INVOICE] Client %s has NO FacilitatorID or not found", sub.ClientID)
			}
		}
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
		nextStatus = domain.StatusDrafter // QC returns to Drafter
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

func (uc *submissionWorkflowUsecase) GetSubmissions(userID uuid.UUID, role string, filter map[string]interface{}) ([]domain.Submission, error) {
	// Apply Role-based visibility
	if role == "HALAL_KONSULTAN" {
		filter["facilitator_ids"] = []uuid.UUID{userID}
	} else if role == "KOORDINATOR" {
		// Get team members
		team, err := uc.userRepo.FindByLeaderID(userID)
		if err != nil {
			return nil, err
		}
		
		ids := []uuid.UUID{userID}
		for _, member := range team {
			ids = append(ids, member.ID)
		}
		filter["facilitator_ids"] = ids
	}

	return uc.submissionRepo.FindAll(filter)
}

func (uc *submissionWorkflowUsecase) GetSubmission(id uuid.UUID) (*domain.Submission, error) {
	return uc.submissionRepo.FindByID(id)
}

func (uc *submissionWorkflowUsecase) GetHistory(id uuid.UUID) ([]domain.AuditLog, error) {
	return uc.auditRepo.FindLogsByEntity("SUBMISSION", id.String())
}
func (uc *submissionWorkflowUsecase) CreateFull(input CreateFullInput, userID uuid.UUID) (*domain.Submission, error) {
	// 1. Create or Find Client
	client := &domain.Client{
		NIB:           input.ClientData.NIB,
		NIK:           input.ClientData.NIK,
		BusinessName:  input.ClientData.BusinessName,
		Address:       input.ClientData.Address,
		ProductName:   input.ClientData.ProductName,
		ServiceType:   input.ClientData.ServiceType,
		FacilitatorID: userID,
		ContactPerson: input.ClientData.ContactPerson,
		Phone:         input.ClientData.Phone,
		CreatedBy:     userID,
	}

	// Try to find client by NIB first to avoid duplicates
	if client.NIB != "" {
		existing, _ := uc.clientRepo.FindByNIB(client.NIB)
		if existing != nil {
			client = existing
		} else {
			if err := uc.clientRepo.Create(client); err != nil {
				return nil, fmt.Errorf("failed to create client: %w", err)
			}
		}
	} else {
		if err := uc.clientRepo.Create(client); err != nil {
			return nil, fmt.Errorf("failed to create client: %w", err)
		}
	}

	// 2. Create Submission
	sub := &domain.Submission{
		ID:          input.ID,
		ClientID:    client.ID,
		Status:      domain.StatusDraft,
		ServiceType: input.ClientData.ServiceType,
	}
	if sub.ID == uuid.Nil {
		sub.ID = uuid.New()
	}

	if err := uc.submissionRepo.Create(sub); err != nil {
		return nil, fmt.Errorf("failed to create submission: %w", err)
	}

	// 3. Save Field Values
	var values []domain.FormFieldValue
	for _, fv := range input.FieldValues {
		values = append(values, domain.FormFieldValue{
			SubmissionID: sub.ID,
			FormFieldID:  fv.FormFieldID,
			TextValue:    fv.TextValue,
			FileURL:      fv.FileURL,
			LinkValue:    fv.LinkValue,
			UploadedBy:   userID,
		})
	}

	if len(values) > 0 {
		if err := uc.fieldValueRepo.CreateBulk(values); err != nil {
			return nil, fmt.Errorf("failed to save field values: %w", err)
		}
	}

	uc.logChange(sub.ID, userID, "CREATE_FULL", "", domain.StatusDraft, "Created from bulk form")

	return sub, nil
}
