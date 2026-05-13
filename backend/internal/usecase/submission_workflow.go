package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"log"
	"strings"
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
	TrackByNumber(trackingNumber string) (*domain.Submission, error)
	Delete(id uuid.UUID, userID uuid.UUID, userRole string) error
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
		Phone         string `json:"phone"`
	} `json:"client_data"`
	FieldValues []FieldValueInput `json:"field_values"`
}

type submissionWorkflowUsecase struct {
	submissionRepo    domain.SubmissionRepository
	clientRepo        domain.ClientRepository
	roleRepo          domain.RoleRepository
	auditRepo         domain.AuditLogRepository
	userRepo          domain.UserRepository
	notifUC           NotificationUsecase
	invoiceRepo       domain.InvoiceRepository
	rateRepo          domain.CoordinatorRateRepository
	fieldValueRepo    domain.FormFieldValueRepository
	billingConfigRepo domain.BillingConfigRepository
	consultantRepo    domain.ConsultantProfileRepository
	participantRepo   domain.TrainingParticipantRepository
}

func NewSubmissionWorkflowUsecase(s domain.SubmissionRepository, c domain.ClientRepository, r domain.RoleRepository, a domain.AuditLogRepository, u domain.UserRepository, n NotificationUsecase, i domain.InvoiceRepository, rate domain.CoordinatorRateRepository, fv domain.FormFieldValueRepository, bc domain.BillingConfigRepository, con domain.ConsultantProfileRepository, p domain.TrainingParticipantRepository) SubmissionWorkflowUsecase {
	return &submissionWorkflowUsecase{
		submissionRepo:    s,
		clientRepo:        c,
		roleRepo:          r,
		auditRepo:         a,
		userRepo:          u,
		notifUC:           n,
		invoiceRepo:       i,
		rateRepo:          rate,
		fieldValueRepo:    fv,
		billingConfigRepo: bc,
		consultantRepo:    con,
		participantRepo:   p,
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

func (uc *submissionWorkflowUsecase) checkVerification(userID uuid.UUID) error {
	user, err := uc.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	// Only check verification for consultants
	if user.Role.Name == "HALAL_KONSULTAN" {
		// 1. Check Profile Verification
		profile, err := uc.consultantRepo.FindByUserID(userID)
		if err != nil || profile == nil || !profile.IsVerified {
			return errors.New("akun Anda belum terverifikasi. Silakan lengkapi profil dan tunggu verifikasi data oleh admin")
		}

		// 2. Check Training Graduation
		trainings, err := uc.participantRepo.FindByUser(userID)
		isGraduated := false
		if err == nil {
			log.Printf("[DEBUG] User %s has %d training records", userID, len(trainings))
			for _, t := range trainings {
				log.Printf("[DEBUG] Training %d: Status=%s", t.TrainingID, t.Status)
				if t.Status == "LULUS" {
					isGraduated = true
					break
				}
			}
		} else {
			log.Printf("[DEBUG] Error fetching trainings for user %s: %v", userID, err)
		}

		log.Printf("[DEBUG] Consultant check result for user %s: ProfileVerified=%v, IsGraduated=%v", userID, profile.IsVerified, isGraduated)

		if !profile.IsVerified && !isGraduated {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi admin DAN Anda belum dinyatakan lulus pelatihan.")
		}
		if !profile.IsVerified {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi oleh admin. Silakan lengkapi dokumen di Profil Konsultan.")
		}
		if !isGraduated {
			return errors.New("Akses Dibatasi: Anda belum dinyatakan lulus pelatihan. Silakan pastikan status kelulusan Anda di menu Pelatihan.")
		}
	}
	return nil
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

	if err := uc.checkVerification(facilitatorID); err != nil {
		return nil, err
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

	// Generate tracking number if not exists
	if sub.TrackingNumber == "" {
		now := time.Now()
		randomPart := strings.ToUpper(uuid.New().String()[:4])
		trackingNo := fmt.Sprintf("AN-%s-%s", now.Format("0601"), randomPart)
		uc.submissionRepo.UpdateTrackingNumber(id, trackingNo)
	}

	err = uc.submissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "SUBMIT", sub.Status, nextStatus, "")

		// IF SELF_DECLARE_MANDIRI -> Create immediate invoice of 230,000
		switch sub.ServiceType {
		case "SELF_DECLARE_MANDIRI":
			log.Printf("[INVOICE] Creating immediate invoice for SELF_DECLARE_MANDIRI: %s", id)
			// SELF_DECLARE_MANDIRI is paid by client, not consultant.
			uc.invoiceRepo.Create(&domain.Invoice{
				SubmissionID: id,
				PayerID:      nil, 
				ServiceType:  "SELF_DECLARE_MANDIRI",
				Amount:       230000,
				Status:       domain.InvoiceStatusUnpaid,
				Notes:        "Pembayaran Awal SELF_DECLARE_MANDIRI",
			})
		case "REGULER":
			log.Printf("[INVOICE] Creating full payment invoice for REGULER: %s", id)
			
			// REGULER: Use the cost detail calculation that was filled out by Pendamping
			costDetail, _ := uc.billingConfigRepo.GetSubmissionCostDetail(id)
			var amount float64
			if costDetail != nil && costDetail.TotalAmount > 0 {
				amount = costDetail.TotalAmount
			}

			// Always create invoice for REGULER if it doesn't exist yet, 
			// even if amount is 0 (it will be updated by the calculator later)
			uc.invoiceRepo.Create(&domain.Invoice{
				SubmissionID:  id,
				PayerID:       nil,
				ServiceType:   "REGULER",
				Amount:        amount,
				Status:        domain.InvoiceStatusUnpaid,
				PricingSource: "COST_DETAIL",
				Notes:         "Full Payment Layanan Reguler",
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
		nextStatus = domain.StatusQCOfficer
	case domain.StatusQCOfficer:
		requiredRole = "QC_OFFICER"
		nextStatus = domain.StatusDrafter // QC distribute to Drafter
	case domain.StatusDrafter:
		requiredRole = "DRAFTER"
		nextStatus = domain.StatusQCReview // Drafter returns to QC when done
	case domain.StatusQCReview:
		requiredRole = "QC_OFFICER"
		nextStatus = domain.StatusSidangFatwa // QC push to Fatwa
	case domain.StatusSidangFatwa:
		// requiredRole = "FATWA"
		// nextStatus = domain.StatusSHTerbit
		return errors.New("terbit SH harus menyertakan file sertifikat. Gunakan fitur 'Terbitkan SH'")
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
			log.Printf("[INVOICE] Triggering management fee invoice for SELF_DECLARE: %s (SH_TERBIT)", id)
			uc.generateSHTerbitInvoice(id, sub)
		}
	}
	return err
}

// generateSHTerbitInvoice creates the invoice when SH is issued.
// Pricing resolution chain:
// 1. REGULER → use SubmissionCostDetail.TotalAmount (drafter's calculation)
// 2. SELF_DECLARE → SalesSchemePrice → CoordinatorRate → Default
func (uc *submissionWorkflowUsecase) generateSHTerbitInvoice(submissionID uuid.UUID, sub *domain.Submission) {
	client, _ := uc.clientRepo.FindByID(sub.ClientID)
	if client == nil {
		log.Printf("[INVOICE] Client not found for submission %s", submissionID)
		return
	}

	serviceType := sub.ServiceType
	if serviceType == "" {
		serviceType = client.ServiceType
	}

	// SELF_DECLARE: Multi-tier pricing resolution for Management Fee
	amount, pricingSource, salesSchemeID, discountApplied, resolvedPayerID := uc.resolveSelfDeclarePrice(sub, client)

	// Use resolved payer if found, else fallback to facilitator
	finalPayerID := resolvedPayerID
	if finalPayerID == nil && client.FacilitatorID != uuid.Nil {
		pid := client.FacilitatorID
		finalPayerID = &pid
	}

	// Create Invoice
	invoice := &domain.Invoice{
		SubmissionID:    submissionID,
		PayerID:         finalPayerID,
		ServiceType:     serviceType,
		Amount:          amount,
		Status:          domain.InvoiceStatusUnpaid,
		PricingSource:   pricingSource,
		SalesSchemeID:   salesSchemeID,
		DiscountApplied: discountApplied,
		Notes:           "Tagihan SH Terbit untuk " + client.BusinessName + " [" + pricingSource + "]",
	}

	if err := uc.invoiceRepo.Create(invoice); err != nil {
		log.Printf("[INVOICE] FAILED to create invoice: %v", err)
	} else {
		log.Printf("[INVOICE] Created invoice #%d: Rp %.0f (%s) for %s", invoice.ID, amount, pricingSource, client.BusinessName)
	}
}

// resolveSelfDeclarePrice resolves the price for Self Declare using a 3-tier chain:
// Tier 1: SalesSchemePrice (configured in master biaya, matches scheme + data_source + product + business type)
// Tier 2: CoordinatorRate (per-coordinator custom rate)
// Tier 3: Default fallback (Rp 100.000)
func (uc *submissionWorkflowUsecase) resolveSelfDeclarePrice(sub *domain.Submission, client *domain.Client) (float64, string, *int64, float64, *uuid.UUID) {
	var amount float64
	var source string
	var schemeID *int64
	var discount float64

	// --- Tier 1: SalesSchemePrice ---
	if sub.SalesSchemeID != nil {
		filter := map[string]interface{}{
			"sales_scheme_id": *sub.SalesSchemeID,
		}
		if sub.DataSource != "" {
			filter["data_source"] = sub.DataSource
		}

		schemePrices, err := uc.billingConfigRepo.FindAllSalesSchemePrices(filter)
		if err == nil && len(schemePrices) > 0 {
			// Find best match
			var bestMatch *domain.SalesSchemePrice
			bestScore := -1

			costDetail, _ := uc.billingConfigRepo.GetSubmissionCostDetail(sub.ID)

			for i := range schemePrices {
				sp := &schemePrices[i]
				if !sp.IsActive {
					continue
				}

				score := 0
				if sp.ProductCategoryID != nil && costDetail != nil && costDetail.ProductCategoryID != nil {
					if *sp.ProductCategoryID == *costDetail.ProductCategoryID {
						score += 10
					} else {
						continue
					}
				}
				if sp.BusinessScaleID != nil && costDetail != nil && costDetail.BusinessScaleID != nil {
					if *sp.BusinessScaleID == *costDetail.BusinessScaleID {
						score += 5
					} else {
						continue
					}
				}
				if sp.BusinessTypeID != nil && costDetail != nil && costDetail.BusinessTypeID != nil {
					if *sp.BusinessTypeID == *costDetail.BusinessTypeID {
						score += 2
					} else {
						continue
					}
				}

				if score > bestScore {
					bestScore = score
					bestMatch = sp
				}
			}

			if bestMatch != nil {
				amount = bestMatch.BasePrice
				if bestMatch.DiscountPercent > 0 {
					amount = amount * (1 - bestMatch.DiscountPercent/100)
					discount = bestMatch.DiscountPercent
				}
				schemeID = &bestMatch.ID
				source = "SCHEME_PRICE"
				log.Printf("[INVOICE] Using SalesSchemePrice #%d: Rp %.0f (discount %.0f%%)", bestMatch.ID, amount, discount)
				return amount, source, schemeID, discount, nil
			}
		}
	}

	// --- Tier 2: CoordinatorRate ---
	if client.FacilitatorID != uuid.Nil {
		var coordinatorID uuid.UUID
		facilitator, _ := uc.userRepo.FindByID(client.FacilitatorID)
		if facilitator != nil {
			if facilitator.Role.Name == "KOORDINATOR" {
				coordinatorID = facilitator.ID
			} else if facilitator.LeaderID != nil {
				coordinatorID = *facilitator.LeaderID
			}
		}

		if coordinatorID != uuid.Nil {
			rate, _ := uc.rateRepo.FindByCoordinatorID(coordinatorID)
			if rate != nil {
				amount = rate.RatePerSH
				source = "COORDINATOR_RATE"
				log.Printf("[INVOICE] Using CoordinatorRate for %s: Rp %.0f", coordinatorID, amount)
				return amount, source, nil, 0, &coordinatorID
			}
		}
	}

	// --- Tier 3: Default ---
	amount = 100000
	source = "DEFAULT"
	log.Printf("[INVOICE] Using DEFAULT price: Rp %.0f", amount)
	return amount, source, nil, 0, nil
}

// ApproveWithDrafter is used by QC to explicitly assign a drafter during QC_OFFICER → DRAFTER transition.
func (uc *submissionWorkflowUsecase) ApproveWithDrafter(id uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusQCOfficer {
		return errors.New("assign drafter only available when status is QC_OFFICER")
	}

	// Save drafter assignment
	if err := uc.submissionRepo.UpdateAssignee(id, &drafterID); err != nil {
		return fmt.Errorf("failed to assign drafter: %w", err)
	}

	// Transition to DRAFTER
	if err := uc.submissionRepo.UpdateStatus(id, domain.StatusDrafter, 0); err != nil {
		return err
	}

	drafter, _ := uc.userRepo.FindByID(drafterID)
	drafterName := drafterID.String()
	if drafter != nil {
		drafterName = drafter.FullName
	}

	uc.logChange(id, userID, "ASSIGN_DRAFTER", sub.Status, domain.StatusDrafter, "Assigned to drafter: "+drafterName)

	// Notify the drafter
	uc.notifUC.CreateNotification(drafterID, "Pengajuan Baru", "Anda ditugaskan untuk mengerjakan pengajuan "+sub.Client.BusinessName, id)

	log.Printf("[WORKFLOW] QC %s assigned submission %s to drafter %s", userID, id, drafterID)

	return nil
}

// BulkApproveWithDrafter allows QC to distribute multiple submissions to a single drafter at once.
func (uc *submissionWorkflowUsecase) BulkApproveWithDrafter(ids []uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error {
	// Restrict selection to QC or Admin roles
	if userRole != "QC_OFFICER" && userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "ADMIN_KEUANGAN" {
		return errors.New("unauthorized: only QC_OFFICER can distribute submissions to drafters")
	}

	var errs []string
	for _, id := range ids {
		if err := uc.ApproveWithDrafter(id, userID, userRole, drafterID); err != nil {
			errs = append(errs, fmt.Sprintf("ID %s: %v", id, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("some distributions failed: %s", strings.Join(errs, "; "))
	}

	return nil
}

// AssignConsultant is used to assign a consultant to a submission, particularly for marketing data.
func (uc *submissionWorkflowUsecase) AssignConsultant(id uuid.UUID, userID uuid.UUID, userRole string, consultantID uuid.UUID) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Only specific roles can assign consultants
	if userRole != "MARKETING" && userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "KOORDINATOR" {
		return errors.New("unauthorized to assign consultant")
	}

	if err := uc.submissionRepo.UpdateConsultant(id, &consultantID); err != nil {
		return fmt.Errorf("failed to assign consultant: %w", err)
	}

	consultant, _ := uc.userRepo.FindByID(consultantID)
	consultantName := consultantID.String()
	if consultant != nil {
		consultantName = consultant.FullName
	}

	uc.logChange(id, userID, "ASSIGN_CONSULTANT", sub.Status, sub.Status, "Assigned to consultant: "+consultantName)

	// Notify the consultant
	uc.notifUC.CreateNotification(consultantID, "Penugasan Konsultan", "Anda ditunjuk sebagai konsultan untuk pengajuan "+sub.Client.BusinessName, id)

	log.Printf("[WORKFLOW] %s assigned submission %s to consultant %s", userRole, id, consultantID)

	return nil
}

func (uc *submissionWorkflowUsecase) Reject(id uuid.UUID, userID uuid.UUID, userRole string, note string) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	var nextStatus domain.SubmissionStatus

	switch sub.Status {
	case domain.StatusQCOfficer:
		nextStatus = domain.StatusVervalPendamping // QC returns to Koordinator
	case domain.StatusDrafter:
		nextStatus = domain.StatusQCOfficer // Drafter returns to QC
	case domain.StatusQCReview:
		nextStatus = domain.StatusDrafter // QC returns to Drafter if data not complete
	case domain.StatusSidangFatwa:
		nextStatus = domain.StatusDrafter // If Fatwa rejected -> return to Drafter
	default:
		// Default fallback
		nextStatus = domain.StatusRevision
	}

	err = uc.submissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "REJECT", sub.Status, nextStatus, note)

		// Store reject note on submission
		_ = uc.submissionRepo.UpdateRejectNote(id, note)

		// Notify assigned drafter if returning to drafter
		if (nextStatus == domain.StatusDrafter) && sub.AssignedDrafterID != nil {
			uc.notifUC.CreateNotification(*sub.AssignedDrafterID, "Pengajuan Dikembalikan",
				"Pengajuan "+sub.Client.BusinessName+" dikembalikan: "+note, id)
		}
	}
	return err
}

func (uc *submissionWorkflowUsecase) GetSubmissions(userID uuid.UUID, role string, filter map[string]interface{}) ([]domain.Submission, error) {
	// Apply Role-based visibility
	switch role {
	case "HALAL_KONSULTAN":
		filter["facilitator_ids"] = []uuid.UUID{userID}
	case "MARKETING":
		// Marketing sees submissions they created (facilitator_id = their ID)
		filter["facilitator_ids"] = []uuid.UUID{userID}
	case "KOORDINATOR":
		// Get team members
		team, err := uc.userRepo.FindByLeaderID(userID)
		if err == nil {
			ids := []uuid.UUID{userID}
			for _, member := range team {
				ids = append(ids, member.ID)
			}
			filter["facilitator_ids"] = ids
		}
	case "DRAFTER":
		// Drafter only sees submissions assigned to them
		filter["assigned_drafter_id"] = userID
	}

	return uc.submissionRepo.FindAll(filter)
}

func (uc *submissionWorkflowUsecase) GetSubmission(id uuid.UUID) (*domain.Submission, error) {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Lazy generate tracking number for existing non-draft submissions
	if sub.TrackingNumber == "" && sub.Status != domain.StatusDraft {
		now := time.Now()
		randomPart := strings.ToUpper(uuid.New().String()[:4])
		trackingNo := fmt.Sprintf("AN-%s-%s", now.Format("0601"), randomPart)
		uc.submissionRepo.UpdateTrackingNumber(id, trackingNo)
		sub.TrackingNumber = trackingNo
	}

	return sub, nil
}

func (uc *submissionWorkflowUsecase) GetHistory(id uuid.UUID) ([]domain.AuditLog, error) {
	return uc.auditRepo.FindLogsByEntity("SUBMISSION", id.String())
}
func (uc *submissionWorkflowUsecase) CreateFull(input CreateFullInput, userID uuid.UUID, userRole string) (*domain.Submission, error) {
	if err := uc.checkVerification(userID); err != nil {
		return nil, err
	}

	// 1. Create or Find Client

	client := &domain.Client{
		NIB:           input.ClientData.NIB,
		NIK:           input.ClientData.NIK,
		BusinessName:  input.ClientData.BusinessName,
		ClientName:    input.ClientData.ClientName,
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
	// Auto-set DataSource based on creator role
	dataSource := "ORGANIK"
	if userRole == "MARKETING" {
		dataSource = "MARKETING"
	}

	sub := &domain.Submission{
		ID:          input.ID,
		ClientID:    client.ID,
		Status:      domain.StatusDraft,
		ServiceType: input.ClientData.ServiceType,
		DataSource:  dataSource,
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
func (uc *submissionWorkflowUsecase) IssueSH(id uuid.UUID, userID uuid.UUID, shURL string) error {
	if shURL == "" {
		return errors.New("file Sertifikat Halal wajib diunggah")
	}

	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusSidangFatwa {
		return errors.New("SH hanya dapat diterbitkan setelah Sidang Fatwa selesai")
	}

	// Validate NIB before issuing SH
	client, _ := uc.clientRepo.FindByID(sub.ClientID)
	if client == nil || client.NIB == "" || strings.HasPrefix(client.NIB, "DRAFT-") {
		return errors.New("NIB belum diisi. Data NIB wajib dilengkapi sebelum SH dapat diterbitkan")
	}

	// 1. Save SH URL
	if err := uc.submissionRepo.UpdateSH(id, shURL); err != nil {
		return err
	}

	// 2. Update Status to SH_TERBIT
	nextStatus := domain.StatusSHTerbit
	if err := uc.submissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
		return err
	}

	uc.logChange(id, userID, "ISSUE_SH", sub.Status, nextStatus, "SH issued with file: "+shURL)

	// 3. Trigger Invoice (Management Fee) if applicable
	serviceType := sub.ServiceType
	if serviceType == "" {
		serviceType = client.ServiceType
	}
	if serviceType == "SELF_DECLARE" {
		uc.generateSHTerbitInvoice(id, sub)
	}

	return nil
}

func (uc *submissionWorkflowUsecase) TrackByNumber(trackingNumber string) (*domain.Submission, error) {
	return uc.submissionRepo.FindByTrackingNumber(trackingNumber)
}

func (uc *submissionWorkflowUsecase) Delete(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.submissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Permission check
	canDelete := false
	switch userRole {
	case "ADMIN", "DIRECTOR":
		canDelete = true
	case "HALAL_KONSULTAN", "KOORDINATOR", "MARKETING":
		// Only if DRAFT
		if sub.Status == domain.StatusDraft {
			// Check if facilitator
			client, _ := uc.clientRepo.FindByID(sub.ClientID)
			if client != nil && client.FacilitatorID == userID {
				canDelete = true
			}
		}
	}

	if !canDelete {
		return errors.New("unauthorized: you cannot delete this submission in its current state")
	}

	return uc.submissionRepo.Delete(id)
}
