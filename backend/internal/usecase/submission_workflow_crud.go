package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

func (uc *submissionWorkflowUsecase) GetSubmissions(userID uuid.UUID, role string, filter map[string]interface{}) ([]domain.Submission, error) {
	// Role-based filtering logic
	switch role {
	case "HALAL_ADVISOR", "MARKETING":
		filter["facilitator_ids"] = []uuid.UUID{userID}
	case "HALAL_MANAGER":
		team, _ := uc.UserRepo.FindByLeaderID(userID)
		ids := []uuid.UUID{userID}
		for _, u := range team {
			ids = append(ids, u.ID)
		}
		filter["facilitator_ids"] = ids
	case "HALAL_DIRECTOR":
		var ids []uuid.UUID
		ids = append(ids, userID)
		managers, _ := uc.UserRepo.FindByLeaderID(userID)
		for _, m := range managers {
			ids = append(ids, m.ID)
			advisors, _ := uc.UserRepo.FindByLeaderID(m.ID)
			for _, a := range advisors {
				ids = append(ids, a.ID)
			}
		}
		filter["facilitator_ids"] = ids
	case "DRAFTER":
		filter["assigned_drafter_id"] = userID
	case "CLIENT":
		filter["client_user_id"] = userID
	}

	return uc.SubmissionRepo.FindAll(filter)
}

func (uc *submissionWorkflowUsecase) GetSubmission(id uuid.UUID) (*domain.Submission, error) {
	return uc.SubmissionRepo.FindByID(id)
}

func (uc *submissionWorkflowUsecase) GetHistory(id uuid.UUID) ([]domain.AuditLog, error) {
	return uc.AuditRepo.FindLogsByEntity("SUBMISSION", id.String())
}

func (uc *submissionWorkflowUsecase) TrackByNumber(trackingNumber string) (*domain.Submission, error) {
	return uc.SubmissionRepo.FindByTrackingNumber(trackingNumber)
}

func (uc *submissionWorkflowUsecase) checkVerification(userID uuid.UUID) error {
	user, err := uc.UserRepo.FindByID(userID)
	if err != nil {
		return err
	}

	if user.Role.Name == "HALAL_ADVISOR" {
		profile, err := uc.ConsultantRepo.FindByUserID(userID)
		if err != nil {
			return errors.New("Profil Advisor belum dibuat. Silakan lengkapi profil Anda terlebih dahulu.")
		}

		// Check Training Graduation
		trainings, err := uc.ParticipantRepo.FindByUser(userID)
		isGraduated := false
		if err == nil {
			for _, t := range trainings {
				if t.Status == "LULUS" {
					isGraduated = true
					break
				}
			}
		}

		if !profile.IsVerified && !isGraduated {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi admin DAN Anda belum dinyatakan lulus pelatihan.")
		}
		if !profile.IsVerified {
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi oleh admin. Silakan lengkapi dokumen di Profil Advisor.")
		}
		if !isGraduated {
			return errors.New("Akses Dibatasi: Anda belum dinyatakan lulus pelatihan. Silakan pastikan status kelulusan Anda di menu Pelatihan.")
		}
	}
	return nil
}

func (uc *submissionWorkflowUsecase) CreateDraft(clientID *uuid.UUID, businessName string, serviceType string, facilitatorID uuid.UUID) (*domain.Submission, error) {
	if err := uc.checkVerification(facilitatorID); err != nil {
		return nil, err
	}

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
			NIB:           "DRAFT-" + uuid.New().String()[:8],
		}
		if err := uc.ClientRepo.Create(newClient); err != nil {
			return nil, err
		}
		actualClientID = newClient.ID
	} else {
		return nil, errors.New("either client_id or business_name is required")
	}

	sub := &domain.Submission{
		ID:           uuid.New(),
		ClientID:     actualClientID,
		ServiceType:  serviceType,
		Status:       domain.StatusDraft,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := uc.SubmissionRepo.Create(sub); err != nil {
		return nil, err
	}

	uc.logChange(sub.ID, facilitatorID, "CREATE_DRAFT", "", domain.StatusDraft, "Initial draft created")
	return sub, nil
}

func (uc *submissionWorkflowUsecase) CreateFull(input CreateFullInput, userID uuid.UUID, userRole string) (*domain.Submission, error) {
	if err := uc.checkVerification(userID); err != nil {
		return nil, err
	}

	// 1. Create/Update Client
	client := &domain.Client{
		ID:            uuid.New(),
		NIB:           input.ClientData.NIB,
		NIK:           input.ClientData.NIK,
		BusinessName:  input.ClientData.BusinessName,
		ClientName:    input.ClientData.ClientName,
		Address:       input.ClientData.Address,
		ProductName:   input.ClientData.ProductName,
		ServiceType:   input.ClientData.ServiceType,
		ContactPerson: input.ClientData.ContactPerson,
		Phone:         input.ClientData.Phone,
		FacilitatorID: userID,
		CreatedBy:     userID,
	}

	if client.NIB == "" {
		client.NIB = "DRAFT-" + uuid.New().String()[:8]
	}

	if input.ID != uuid.Nil {
		client.ID = input.ID
	}

	if err := uc.ClientRepo.Create(client); err != nil {
		return nil, err
	}

	var consultantIDPtr *uuid.UUID
	if userRole != "CLIENT" {
		consultantIDPtr = &userID
	}

	dataSource := "ORGANIK"
	if userRole == "MARKETING" {
		dataSource = "MARKETING"
	}

	if userRole == "CLIENT" {
		forms, _, err := uc.TeleFormRepo.FindAll(map[string]interface{}{"client_user_id": userID}, 1, 1)
		if err == nil && len(forms) > 0 {
			dataSource = "TELEMARKETING"
		}
	}

	// 2. Create Submission
	sub := &domain.Submission{
		ID:             uuid.New(),
		ClientID:       client.ID,
		Status:         domain.StatusDraft,
		ServiceType:    input.ClientData.ServiceType,
		DataSource:     dataSource,
		ConsultantID:   consultantIDPtr,
		BusinessTypeID: input.ClientData.BusinessTypeID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := uc.SubmissionRepo.Create(sub); err != nil {
		return nil, fmt.Errorf("failed to create submission: %w", err)
	}

	if userRole == "CLIENT" {
		forms, _, err := uc.TeleFormRepo.FindAll(map[string]interface{}{"client_user_id": userID}, 1, 1)
		if err == nil && len(forms) > 0 {
			form := &forms[0]
			form.SubmissionID = &sub.ID
			form.Status = domain.TeleFormStatusDataInput
			form.UpdatedAt = time.Now()
			_ = uc.TeleFormRepo.Update(form)
		}
	}

	// 3. Save Field Values
	if len(input.FieldValues) > 0 {
		_ = uc.SubmitFieldValues(sub.ID, userID, input.FieldValues)
	}

	uc.logChange(sub.ID, userID, "CREATE_FULL", "", domain.StatusDraft, "Full submission record created")
	
	return uc.SubmissionRepo.FindByID(sub.ID)
}

func (uc *submissionWorkflowUsecase) Delete(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Only owner or admin can delete draft
	canDelete := false
	switch userRole {
	case "ADMIN", "DIRECTOR", "HALAL_DIRECTOR":
		canDelete = true
	case "HALAL_ADVISOR", "HALAL_MANAGER", "MARKETING":
		if sub.Status == domain.StatusDraft {
			client, _ := uc.ClientRepo.FindByID(sub.ClientID)
			if client != nil && client.FacilitatorID == userID {
				canDelete = true
			}
		}
	}

	if !canDelete {
		return errors.New("unauthorized: you cannot delete this submission in its current state")
	}

	return uc.SubmissionRepo.Delete(id)
}

func (uc *submissionWorkflowUsecase) IsAuthorized(userID uuid.UUID, role string, submissionID uuid.UUID) bool {
	if role != "CLIENT" {
		return true
	}

	sub, err := uc.SubmissionRepo.FindByID(submissionID)
	if err != nil {
		return false
	}
	if sub.Client.CreatedBy == userID {
		return true
	}
	// Check if there is a telemarketing form for this client linked to the submission
	forms, _, err := uc.TeleFormRepo.FindAll(map[string]interface{}{
		"client_user_id": userID,
		"submission_id":  submissionID,
	}, 1, 1)
	if err == nil && len(forms) > 0 {
		return true
	}
	return false
}
