package usecase

import (
	"ananahnu/internal/domain"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"
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
			return errors.New("Akses Dibatasi: Akun Anda belum diverifikasi admin dan Anda belum dinyatakan lulus pelatihan.")
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

func (uc *submissionWorkflowUsecase) checkUnpaidInvoices(userID uuid.UUID, serviceType string) error {
	if serviceType != "SELF_DECLARE" && serviceType != "SELF_DECLARE_MANDIRI" {
		return nil
	}

	// Cek apakah ada tagihan SELF_DECLARE yang belum dibayar
	filter := map[string]interface{}{
		"payer_id": userID,
		"status":   "UNPAID",
	}
	invoices, _, err := uc.InvoiceRepo.FindAll(filter, 1, 100)
	if err != nil {
		return err
	}

	for _, inv := range invoices {
		if inv.ServiceType == "SELF_DECLARE" || inv.ServiceType == "SELF_DECLARE_MANDIRI" {
			return errors.New("Tidak dapat membuat pengajuan baru. Anda masih memiliki tagihan Self Declare yang belum dibayar. Silakan lunasi tagihan Anda di menu 'Tagihan Self Declare'.")
		}
	}
	return nil
}

func (uc *submissionWorkflowUsecase) CreateDraft(clientID *uuid.UUID, businessName string, serviceType string, facilitatorID uuid.UUID) (*domain.Submission, error) {
	if err := uc.checkVerification(facilitatorID); err != nil {
		return nil, err
	}
	if serviceType == "SELF_DECLARE" {
		if err := uc.checkFacilitationQuota(); err != nil {
			return nil, err
		}
	}
	if err := uc.checkUnpaidInvoices(facilitatorID, serviceType); err != nil {
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

	var defaultSalesSchemeID int64 = 1
	creator, err := uc.UserRepo.FindByID(facilitatorID)
	if err == nil && creator != nil {
		mapping, mapErr := uc.BillingConfigRepo.FindRoleSchemeMappingByRole(creator.Role.Name)
		if mapErr == nil && mapping != nil {
			defaultSalesSchemeID = mapping.SalesSchemeID
		}
	}

	sub := &domain.Submission{
		ID:            uuid.New(),
		ClientID:      actualClientID,
		ServiceType:   serviceType,
		Status:        domain.StatusDraft,
		SalesSchemeID: &defaultSalesSchemeID,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := uc.SubmissionRepo.Create(sub); err != nil {
		return nil, err
	}
	if sub.ServiceType == "SELF_DECLARE" {
		uc.incrementFacilitationQuotaUsed()
	}

	if sub.ServiceType == "REGULER" || sub.ServiceType == "SELF_DECLARE_MANDIRI" {
		_ = uc.RecalculateAndSaveRegularCost(sub, nil, nil, false)
	}

	uc.logChange(sub.ID, facilitatorID, "CREATE_DRAFT", "", domain.StatusDraft, "Initial draft created")
	return sub, nil
}

func (uc *submissionWorkflowUsecase) CreateFull(input CreateFullInput, userID uuid.UUID, userRole string) (*domain.Submission, error) {
	if userRole != "CLIENT" && userRole != "DIRECTOR" && userRole != "ADMIN" {
		return nil, errors.New("Akses Dibatasi: Pengajuan hanya dapat dilakukan oleh Pelaku Usaha (Client)")
	}

	if err := uc.checkVerification(userID); err != nil {
		return nil, err
	}
	if input.ClientData.ServiceType == "SELF_DECLARE" {
		if err := uc.checkFacilitationQuota(); err != nil {
			return nil, err
		}
	}
	if err := uc.checkUnpaidInvoices(userID, input.ClientData.ServiceType); err != nil {
		return nil, err
	}

	// 1. Create/Update Client
	var facilitatorID uuid.UUID
	var consultantIDPtr *uuid.UUID

	if input.ClientData.FacilitatorID != nil && *input.ClientData.FacilitatorID != uuid.Nil {
		facilitatorID = *input.ClientData.FacilitatorID
		consultantIDPtr = input.ClientData.FacilitatorID
	} else if userRole != "CLIENT" {
		facilitatorID = userID
		consultantIDPtr = &userID
	}

	userObj, _ := uc.UserRepo.FindByID(userID)

	clientName := input.ClientData.ClientName
	if clientName == "" && userObj != nil {
		clientName = userObj.FullName
	}

	businessName := input.ClientData.BusinessName
	if businessName == "" {
		if clientName != "" {
			businessName = "Usaha " + clientName
		} else {
			businessName = "Draf Pengajuan Baru"
		}
	}

	phone := input.ClientData.Phone
	if phone == "" && userObj != nil {
		phone = userObj.Phone
	}

	client := &domain.Client{
		ID:            uuid.New(),
		NIB:           input.ClientData.NIB,
		NIK:           input.ClientData.NIK,
		BusinessName:  businessName,
		ClientName:    clientName,
		Address:       input.ClientData.Address,
		ProductName:   input.ClientData.ProductName,
		ServiceType:   input.ClientData.ServiceType,
		ContactPerson: input.ClientData.ContactPerson,
		Phone:         phone,
		FacilitatorID: facilitatorID,
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

	var defaultSalesSchemeID int64 = 1
	{
		mapping, mapErr := uc.BillingConfigRepo.FindRoleSchemeMappingByRole(userRole)
		if mapErr == nil && mapping != nil {
			defaultSalesSchemeID = mapping.SalesSchemeID
		}
	}

	// 2. Create Submission
	sub := &domain.Submission{
		ID:                uuid.New(),
		ClientID:          client.ID,
		Status:            domain.StatusDraft,
		ServiceType:       input.ClientData.ServiceType,
		DataSource:        dataSource,
		ConsultantID:      consultantIDPtr,
		BusinessTypeID:    input.ClientData.BusinessTypeID,
		ProductCategoryID: input.ClientData.ProductCategoryID,
		BusinessScaleID:   input.ClientData.BusinessScaleID,
		ProvinceID:        input.ClientData.ProvinceID,
		RegencyID:         input.ClientData.RegencyID,
		DistrictID:        input.ClientData.DistrictID,
		ProductCount:      input.ClientData.ProductCount,
		BranchCount:       input.ClientData.BranchCount,
		SalesSchemeID:     &defaultSalesSchemeID,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if err := uc.SubmissionRepo.Create(sub); err != nil {
		return nil, fmt.Errorf("failed to create submission: %w", err)
	}
	if sub.ServiceType == "SELF_DECLARE" {
		uc.incrementFacilitationQuotaUsed()
	}

	// Recalculate cost if REGULER or SELF_DECLARE_MANDIRI
	if sub.ServiceType == "REGULER" || sub.ServiceType == "SELF_DECLARE_MANDIRI" {
		hasExplicit := len(input.SelectedOptionalIDs) > 0
		if err := uc.RecalculateAndSaveRegularCost(sub, input.SelectedOptionalIDs, input.OptionalQuantities, hasExplicit); err != nil {
			log.Printf("[CreateFull] failed to calculate regular cost: %v", err)
		}
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

// UpdateClientInfoAndPricing updates client details and pricing fields, then auto-recalculates cost.
func (uc *submissionWorkflowUsecase) UpdateClientInfoAndPricing(id uuid.UUID, input UpdateClientInfoAndPricingInput, userID uuid.UUID, userRole string) error {
	// 1. Fetch Submission (with Client preloaded)
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("submission not found: %w", err)
	}

	// 2. Authorization check
	if userRole == "CLIENT" {
		if !uc.IsAuthorized(userID, userRole, id) {
			return errors.New("unauthorized")
		}
		if sub.Status != domain.StatusDraft && sub.Status != domain.StatusRevision {
			return errors.New("cannot edit client details when submission is not in draft or revision state")
		}
	}

	// 3. Update Client fields
	client, err := uc.ClientRepo.FindByID(sub.ClientID)
	if err != nil {
		return fmt.Errorf("client not found: %w", err)
	}

	client.BusinessName = input.BusinessName
	client.ClientName = input.ClientName
	client.NIB = input.NIB
	client.NIBFileURL = input.NIBFileURL
	client.NIK = input.NIK
	client.ProductName = input.ProductName
	client.Address = input.Address
	client.ContactPerson = input.ContactPerson
	client.Phone = input.Phone
	client.UpdatedAt = time.Now()

	if err := uc.ClientRepo.Update(client); err != nil {
		return fmt.Errorf("failed to update client: %w", err)
	}

	// 4. Update Submission fields
	sub.BusinessTypeID = input.BusinessTypeID
	sub.ProductCategoryID = input.ProductCategoryID
	sub.BusinessScaleID = input.BusinessScaleID
	sub.ProvinceID = input.ProvinceID
	sub.RegencyID = input.RegencyID
	sub.DistrictID = input.DistrictID
	sub.ProductCount = input.ProductCount
	sub.BranchCount = input.BranchCount
	sub.SalesSchemeID = input.SalesSchemeID
	if input.DataSource != "" {
		sub.DataSource = input.DataSource
	}
	sub.UpdatedAt = time.Now()

	if err := uc.SubmissionRepo.Update(sub); err != nil {
		return fmt.Errorf("failed to update submission: %w", err)
	}

	// 5. Trigger automatic pricing calculation or save explicit cost
	if input.TotalAmount != nil && input.CostBreakdownData != nil && *input.TotalAmount > 0 {
		costDetail := &domain.SubmissionCostDetail{
			SubmissionID:      sub.ID,
			ProductCategoryID: sub.ProductCategoryID,
			BusinessTypeID:    sub.BusinessTypeID,
			BusinessScaleID:   sub.BusinessScaleID,
			ProvinceID:        sub.ProvinceID,
			RegencyID:         sub.RegencyID,
			DistrictID:        sub.DistrictID,
			ProductCount:      sub.ProductCount,
			BranchCount:       sub.BranchCount,
			TotalAmount:       *input.TotalAmount,
			CostBreakdownData: *input.CostBreakdownData,
		}
		if err := uc.BillingConfigRepo.SaveSubmissionCostDetail(costDetail); err != nil {
			return fmt.Errorf("failed to save cost detail: %w", err)
		}
		// Sync or create invoice
		invoice, err := uc.InvoiceRepo.FindBySubmissionID(sub.ID)
		if err == nil && invoice != nil {
			if invoice.Type == domain.InvoiceTypeDP {
				invoice.Amount = *input.TotalAmount * 0.70
			} else {
				invoice.Amount = *input.TotalAmount
			}
			invoice.PricingSource = "COST_DETAIL"
			_ = uc.InvoiceRepo.Update(invoice)
		}
	} else {
		var selectedIDs []int64
		hasExplicit := false
		if input.SelectedOptionalComponentIDs != nil {
			selectedIDs = *input.SelectedOptionalComponentIDs
			hasExplicit = true
		}
		if err := uc.RecalculateAndSaveRegularCost(sub, selectedIDs, input.OptionalQuantities, hasExplicit); err != nil {
			return fmt.Errorf("failed to calculate and sync pricing: %w", err)
		}
	}

	uc.logChange(sub.ID, userID, "UPDATE_CLIENT_INFO_PRICING", "", sub.Status, "Client info and pricing details updated")

	return nil
}

// RecalculateAndSaveRegularCost recalculates regular pricing dynamically and saves to Cost Detail & Invoice
func (uc *submissionWorkflowUsecase) RecalculateAndSaveRegularCost(sub *domain.Submission, selectedOptionalComponentIDs []int64, optionalQuantities map[int64]int, hasExplicitSelection bool) error {
	if sub.ServiceType == "SELF_DECLARE" {
		breakdown := []map[string]interface{}{
			{
				"name":        "Program Self Declare (Fasilitasi / Gratis)",
				"category":    "SELF_DECLARE",
				"unit_cost":   0.0,
				"total":       0.0,
				"is_optional": false,
			},
		}
		jsonBreakdown, _ := json.Marshal(breakdown)
		costDetail := &domain.SubmissionCostDetail{
			SubmissionID:      sub.ID,
			ProductCategoryID: sub.ProductCategoryID,
			BusinessTypeID:    sub.BusinessTypeID,
			BusinessScaleID:   sub.BusinessScaleID,
			ProvinceID:        sub.ProvinceID,
			RegencyID:         sub.RegencyID,
			DistrictID:        sub.DistrictID,
			ProductCount:      sub.ProductCount,
			BranchCount:       sub.BranchCount,
			TotalAmount:       0,
			CostBreakdownData: string(jsonBreakdown),
		}
		_ = uc.BillingConfigRepo.SaveSubmissionCostDetail(costDetail)
		return nil
	}

	if sub.ServiceType != "REGULER" && sub.ServiceType != "SELF_DECLARE_MANDIRI" {
		return nil
	}

	if sub.SalesSchemeID == nil && sub.ServiceType == "REGULER" {
		var defaultSalesSchemeID int64 = 1
		sub.SalesSchemeID = &defaultSalesSchemeID
	}

	// Check if required fields are present for REGULER
	if sub.ServiceType == "REGULER" && (sub.BusinessTypeID == nil || sub.BusinessScaleID == nil || sub.ProvinceID == nil) {
		// Pricing fields not fully filled, skip calculation (not an error, just incomplete client info)
		return nil
	}

	// Fetch sales scheme prices if SalesSchemeID is set (only relevant for REGULER)
	var scheme *domain.SalesSchemePrice
	if sub.ServiceType == "REGULER" && sub.SalesSchemeID != nil && sub.BusinessTypeID != nil && sub.BusinessScaleID != nil {
		ds := sub.DataSource
		if ds == "TELEMARKETING" || ds == "" {
			ds = "ORGANIK"
		}

		schemes, err := uc.BillingConfigRepo.FindAllSalesSchemePrices(map[string]interface{}{
			"sales_scheme_id":   *sub.SalesSchemeID,
			"business_type_id":  *sub.BusinessTypeID,
			"business_scale_id": *sub.BusinessScaleID,
			"data_source":       ds,
			"is_active":         true,
		})
		if err == nil && len(schemes) > 0 {
			// Sort schemes by specificity: non-null fields first
			sort.Slice(schemes, func(i, j int) bool {
				scoreI := 0
				if schemes[i].ProductCategoryID != nil {
					scoreI += 100
				}
				if schemes[i].BusinessScaleID != nil {
					scoreI += 10
				}
				if schemes[i].BusinessTypeID != nil {
					scoreI += 1
				}

				scoreJ := 0
				if schemes[j].ProductCategoryID != nil {
					scoreJ += 100
				}
				if schemes[j].BusinessScaleID != nil {
					scoreJ += 10
				}
				if schemes[j].BusinessTypeID != nil {
					scoreJ += 1
				}

				return scoreI > scoreJ // Descending order of specificity
			})
			scheme = &schemes[0]
		}
	}

	// Fetch active billing components filtered by service_type
	components, err := uc.BillingConfigRepo.FindAllBillingComponents(map[string]interface{}{
		"is_active":    true,
		"service_type": sub.ServiceType,
	})
	if err != nil {
		return fmt.Errorf("failed to fetch billing components: %w", err)
	}

	var existingBreakdown []map[string]interface{}
	existingDetail, err := uc.BillingConfigRepo.GetSubmissionCostDetail(sub.ID)
	if err == nil && existingDetail != nil && existingDetail.CostBreakdownData != "" {
		_ = json.Unmarshal([]byte(existingDetail.CostBreakdownData), &existingBreakdown)
	}

	var total float64
	var breakdown []map[string]interface{}

	isCompServiceTypeMatch := func(comp domain.BillingComponent) bool {
		compSt := strings.TrimSpace(comp.ServiceType)
		if sub.ServiceType == "REGULER" {
			return compSt == "REGULER" || compSt == "BOTH" || compSt == "ALL" || compSt == ""
		}
		if sub.ServiceType == "SELF_DECLARE_MANDIRI" {
			if compSt != "SELF_DECLARE_MANDIRI" && compSt != "BOTH" && compSt != "ALL" {
				return false
			}
			cat := strings.ToUpper(comp.Category)
			if cat == "LPH" || cat == "MUI" {
				return false
			}
			return true
		}
		return false
	}

	// Find the best matching PENDAMPINGAN component
	var bestPendampingan *domain.BillingComponent
	bestScore := -1

	for _, comp := range components {
		if strings.ToUpper(comp.Category) != "PENDAMPINGAN" {
			continue
		}
		if !isCompServiceTypeMatch(comp) {
			continue
		}
		// Match filters
		if comp.ProvinceID != nil && sub.ProvinceID != nil && *comp.ProvinceID != *sub.ProvinceID {
			continue
		}
		if comp.RegencyID != nil && sub.RegencyID != nil && *comp.RegencyID != *sub.RegencyID {
			continue
		}
		if comp.BusinessTypeID != nil && sub.BusinessTypeID != nil && *comp.BusinessTypeID != *sub.BusinessTypeID {
			continue
		}
		if comp.BusinessScaleID != nil && sub.BusinessScaleID != nil && *comp.BusinessScaleID != *sub.BusinessScaleID {
			continue
		}
		if comp.SalesSchemeID != nil && sub.SalesSchemeID != nil && *comp.SalesSchemeID != *sub.SalesSchemeID {
			continue
		}

		// Score specificity
		score := 0
		if comp.DistrictID != nil {
			score += 1000
		}
		if comp.RegencyID != nil {
			score += 100
		}
		if comp.ProvinceID != nil {
			score += 10
		}
		if comp.SalesSchemeID != nil {
			score += 8
		}
		if comp.BusinessScaleID != nil {
			score += 5
		}
		if comp.ProductCategoryID != nil {
			score += 2
		}
		if comp.BusinessTypeID != nil {
			score += 1
		}

		if score > bestScore {
			bestScore = score
			bestPendampingan = &comp
		}
	}

	var price float64
	var pendampinganName string = "Jasa Pendampingan"
	var pendampinganCategory string = "PENDAMPINGAN"
	var pendDiscount float64

	if bestPendampingan != nil {
		price = bestPendampingan.BaseAmount
		pendampinganName = bestPendampingan.Name
		pendampinganCategory = strings.ToUpper(bestPendampingan.Category)
		if bestPendampingan.DiscountPercent > 0 {
			pendDiscount = bestPendampingan.DiscountPercent
		}
	} else if sub.ServiceType == "REGULER" && scheme != nil {
		price = scheme.BasePrice
		if scheme.SalesScheme.Name != "" {
			pendampinganName = scheme.SalesScheme.Name
		}
	} else if sub.ServiceType == "SELF_DECLARE_MANDIRI" {
		price = 230000.0
		if setting, err := uc.SettingRepo.GetSetting("SD_MANDIRI_COST"); err == nil && setting != nil {
			if val, parseErr := strconv.ParseFloat(setting.Value, 64); parseErr == nil && val > 0 {
				price = val
			}
		}
		pendampinganName = "Biaya Self Declare Mandiri"
	}

	if pendDiscount == 0 && scheme != nil && scheme.DiscountPercent > 0 {
		pendDiscount = scheme.DiscountPercent
	}

	if price > 0 {
		total += price
		breakdown = append(breakdown, map[string]interface{}{
			"name":        pendampinganName,
			"category":    pendampinganCategory,
			"unit_cost":   price,
			"total":       price,
			"is_optional": false,
		})

		if pendDiscount > 0 {
			discountAmount := price * (pendDiscount / 100.0)
			total -= discountAmount
			breakdown = append(breakdown, map[string]interface{}{
				"name":        fmt.Sprintf("Diskon %s (%.0f%%)", pendampinganName, pendDiscount),
				"category":    "DISKON",
				"unit_cost":   -discountAmount,
				"total":       -discountAmount,
				"is_optional": false,
			})
		}
	}

	// Calculate other components with best specificity scoring per category
	type scoredComp struct {
		comp  domain.BillingComponent
		score int
	}
	mandatoryCategoryMap := make(map[string]scoredComp)
	var finalComponents []domain.BillingComponent

	for _, comp := range components {
		if strings.ToUpper(comp.Category) == "PENDAMPINGAN" {
			continue
		}
		if !isCompServiceTypeMatch(comp) {
			continue
		}

		if comp.ProvinceID != nil && (sub.ProvinceID == nil || *comp.ProvinceID != *sub.ProvinceID) {
			continue
		}
		if comp.RegencyID != nil && (sub.RegencyID == nil || *comp.RegencyID != *sub.RegencyID) {
			continue
		}
		if comp.DistrictID != nil && (sub.DistrictID == nil || *comp.DistrictID != *sub.DistrictID) {
			continue
		}
		if comp.BusinessTypeID != nil && (sub.BusinessTypeID == nil || *comp.BusinessTypeID != *sub.BusinessTypeID) {
			continue
		}
		if comp.ProductCategoryID != nil && (sub.ProductCategoryID == nil || *comp.ProductCategoryID != *sub.ProductCategoryID) {
			continue
		}
		if comp.BusinessScaleID != nil && (sub.BusinessScaleID == nil || *comp.BusinessScaleID != *sub.BusinessScaleID) {
			continue
		}
		if comp.SalesSchemeID != nil && (sub.SalesSchemeID == nil || *comp.SalesSchemeID != *sub.SalesSchemeID) {
			continue
		}

		// If optional component, only include if explicitly passed or previously present in the breakdown
		if !comp.IsMandatory {
			isSelected := false
			if hasExplicitSelection {
				for _, id := range selectedOptionalComponentIDs {
					if id == comp.ID {
						isSelected = true
						break
					}
				}
			} else {
				isSelected = isComponentInBreakdown(existingBreakdown, comp.Name)
			}

			if isSelected {
				finalComponents = append(finalComponents, comp)
			}
		} else {
			score := 0
			if comp.DistrictID != nil {
				score += 1000
			}
			if comp.RegencyID != nil {
				score += 100
			}
			if comp.ProvinceID != nil {
				score += 10
			}
			if comp.SalesSchemeID != nil {
				score += 8
			}
			if comp.BusinessScaleID != nil {
				score += 5
			}
			if comp.ProductCategoryID != nil {
				score += 2
			}
			if comp.BusinessTypeID != nil {
				score += 1
			}

			cat := strings.ToUpper(comp.Category)
			existing, exists := mandatoryCategoryMap[cat]
			if !exists || score > existing.score {
				mandatoryCategoryMap[cat] = scoredComp{comp: comp, score: score}
			}
		}
	}

	for _, sc := range mandatoryCategoryMap {
		finalComponents = append(finalComponents, sc.comp)
	}

	// Sort finalComponents for deterministic output order (by Category, then Name)
	sort.Slice(finalComponents, func(i, j int) bool {
		if finalComponents[i].Category != finalComponents[j].Category {
			return finalComponents[i].Category < finalComponents[j].Category
		}
		return finalComponents[i].Name < finalComponents[j].Name
	})

	for _, comp := range finalComponents {
		amount := comp.BaseAmount
		multiplier := 1
		multiplierLabel := ""

		if !comp.IsMandatory {
			if optQty, ok := optionalQuantities[comp.ID]; ok && optQty > 0 {
				multiplier = optQty
			} else {
				prevMult := getMultiplierFromBreakdown(existingBreakdown, comp.Name)
				if prevMult > 0 {
					multiplier = prevMult
				}
			}
			if multiplier > 1 {
				multiplierLabel = fmt.Sprintf(" (%d Kuantitas)", multiplier)
			}
			amount = amount * float64(multiplier)
		} else {
			if comp.Type == "PER_CABANG" && sub.BranchCount > 1 {
				amount = amount * float64(sub.BranchCount)
				multiplier = sub.BranchCount
				multiplierLabel = fmt.Sprintf(" (%d Cabang)", sub.BranchCount)
			}
			if comp.Type == "PER_PRODUK" && sub.ProductCount > 0 {
				amount = amount * float64(sub.ProductCount)
				multiplier = sub.ProductCount
				multiplierLabel = fmt.Sprintf(" (%d Produk)", sub.ProductCount)
			}
			if comp.Type == "PER_MANDAY" {
				// All PER_MANDAY components use per-component multiplier from breakdown
				prevMult := getMultiplierFromBreakdown(existingBreakdown, comp.Name)
				if prevMult > 0 {
					multiplier = prevMult
				}
				multiplierLabel = fmt.Sprintf(" (%d Kuantitas)", multiplier)
				amount = amount * float64(multiplier)
			}
		}

		discountAmount := 0.0
		if comp.DiscountPercent > 0 {
			discountAmount = amount * (comp.DiscountPercent / 100.0)
			amount -= discountAmount
		}

		total += amount

		nameTag := ""
		if comp.DistrictID != nil {
			nameTag = " [Khusus Kecamatan]"
		} else if comp.RegencyID != nil {
			nameTag = " [Khusus Kabupaten]"
		} else if comp.ProvinceID != nil {
			nameTag = " [Khusus Provinsi]"
		} else if comp.BusinessTypeID != nil || comp.ProductCategoryID != nil || comp.BusinessScaleID != nil {
			nameTag = " [Khusus Kriteria]"
		}

		breakdown = append(breakdown, map[string]interface{}{
			"name":        comp.Name + nameTag + multiplierLabel,
			"category":    comp.Category,
			"unit_cost":   comp.BaseAmount,
			"multiplier":  multiplier,
			"is_optional": !comp.IsMandatory,
			"total":       amount + discountAmount,
		})

		if discountAmount > 0 {
			var unitDisc float64
			if multiplier > 0 {
				unitDisc = -(discountAmount / float64(multiplier))
			} else {
				unitDisc = -discountAmount
			}
			breakdown = append(breakdown, map[string]interface{}{
				"name":       fmt.Sprintf("Diskon %s (%.0f%%)", comp.Name, comp.DiscountPercent),
				"category":   "DISKON",
				"unit_cost":  unitDisc,
				"multiplier": multiplier,
				"total":      -discountAmount,
			})
		}
	}

	// Partnership discount
	if scheme != nil && strings.ToUpper(scheme.SalesScheme.Name) == "PARTNERSHIP" {
		for _, item := range breakdown {
			if cat, ok := item["category"].(string); ok && cat == pendampinganCategory {
				if cost, ok := item["total"].(float64); ok {
					discountAmount := cost * 0.1
					breakdown = append(breakdown, map[string]interface{}{
						"name":      "Diskon Partnership (10%)",
						"category":  "DISKON",
						"unit_cost": -discountAmount,
						"total":     -discountAmount,
					})
					total -= discountAmount
					break
				}
			}
		}
	}

	// Marshal breakdown
	jsonBreakdown, err := json.Marshal(breakdown)
	if err != nil {
		return fmt.Errorf("failed to marshal breakdown: %w", err)
	}

	// Save/update cost detail
	costDetail := &domain.SubmissionCostDetail{
		SubmissionID:      sub.ID,
		ProductCategoryID: sub.ProductCategoryID,
		BusinessTypeID:    sub.BusinessTypeID,
		BusinessScaleID:   sub.BusinessScaleID,
		ProvinceID:        sub.ProvinceID,
		RegencyID:         sub.RegencyID,
		DistrictID:        sub.DistrictID,
		ProductCount:      sub.ProductCount,
		BranchCount:       sub.BranchCount,
		TotalAmount:       total,
		CostBreakdownData: string(jsonBreakdown),
	}

	if err := uc.BillingConfigRepo.SaveSubmissionCostDetail(costDetail); err != nil {
		return fmt.Errorf("failed to save cost detail: %w", err)
	}

	// Sync or create invoice
	invoice, err := uc.InvoiceRepo.FindBySubmissionID(sub.ID)
	if err == nil && invoice != nil {
		if sub.ServiceType == "SELF_DECLARE_MANDIRI" {
			invoice.Amount = total
			invoice.Type = domain.InvoiceTypeFull
		} else if invoice.Type == domain.InvoiceTypeDP {
			invoice.Amount = total * 0.70
		} else {
			invoice.Amount = total
		}
		invoice.PricingSource = "COST_DETAIL"
		return uc.InvoiceRepo.Update(invoice)
	}

	if sub.Status != domain.StatusDraft && sub.Status != domain.StatusRevision {
		invType := domain.InvoiceTypeDP
		invAmount := total * 0.70
		notes := "Down Payment 70% Layanan Reguler (Auto-sync from Client Info)"
		if sub.ServiceType == "SELF_DECLARE_MANDIRI" {
			invType = domain.InvoiceTypeFull
			invAmount = total
			notes = "Pembayaran Self Declare Mandiri (Auto-sync from Client Info)"
		}
		newInvoice := &domain.Invoice{
			SubmissionID:  sub.ID,
			ServiceType:   sub.ServiceType,
			Type:          invType,
			Amount:        invAmount,
			Status:        domain.InvoiceStatusUnpaid,
			PricingSource: "COST_DETAIL",
			Notes:         notes,
		}
		return uc.InvoiceRepo.Create(newInvoice)
	}

	return nil
}

func isComponentInBreakdown(breakdown []map[string]interface{}, name string) bool {
	for _, item := range breakdown {
		if itemName, ok := item["name"].(string); ok {
			if strings.HasPrefix(itemName, name) {
				return true
			}
		}
	}
	return false
}

func getMultiplierFromBreakdown(breakdown []map[string]interface{}, name string) int {
	for _, item := range breakdown {
		if itemName, ok := item["name"].(string); ok {
			if strings.HasPrefix(itemName, name) {
				if multVal, ok := item["multiplier"]; ok {
					switch v := multVal.(type) {
					case float64:
						return int(v)
					case int:
						return v
					case int64:
						return int(v)
					}
				}
			}
		}
	}
	return 1
}

func (uc *submissionWorkflowUsecase) checkFacilitationQuota() error {
	limitStr := "1000"
	usedStr := "0"

	limitSetting, err := uc.SettingRepo.GetSetting("facilitation_quota_limit")
	if err == nil && limitSetting != nil {
		limitStr = limitSetting.Value
	}
	usedSetting, err := uc.SettingRepo.GetSetting("facilitation_quota_used")
	if err == nil && usedSetting != nil {
		usedStr = usedSetting.Value
	}

	limit, _ := strconv.Atoi(limitStr)
	used, _ := strconv.Atoi(usedStr)

	if limit-used <= 0 {
		return errors.New("tidak ada fasilitasi pembiayaan. Silahkan ajukan melalui skema self declare mandiri")
	}
	return nil
}

func (uc *submissionWorkflowUsecase) incrementFacilitationQuotaUsed() {
	usedStr := "0"
	usedSetting, err := uc.SettingRepo.GetSetting("facilitation_quota_used")
	if err == nil && usedSetting != nil {
		usedStr = usedSetting.Value
	}
	used, _ := strconv.Atoi(usedStr)
	used++

	_ = uc.SettingRepo.UpdateSetting(&domain.SystemSetting{
		Key:   "facilitation_quota_used",
		Value: strconv.Itoa(used),
	})
}
