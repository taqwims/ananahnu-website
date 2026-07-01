package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/utils"
	"ananahnu/pkg/whatsapp"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ── Interface ──────────────────────────────────────────────────────────

type TelemarketingUsecase interface {
	// Public form
	SubmitPublicForm(input TeleFormInput) (*domain.TeleForm, error)
	GetFormByID(id uuid.UUID) (*domain.TeleForm, error)
	GetAllForms(filter map[string]interface{}, page, limit int) ([]domain.TeleForm, int64, error)
	GetMyForms(userID uuid.UUID, role string, filter map[string]interface{}, page, limit int) ([]domain.TeleForm, int64, error)
	UpdateFormStatus(id uuid.UUID, status domain.TeleFormStatus) error
	SetSelfDeclareType(id uuid.UUID, selfDeclareType string) error

	// Meetings
	ScheduleMeeting(input TeleMeetingInput) (*domain.TeleMeeting, error)
	GetAllMeetings(filter map[string]interface{}, page, limit int) ([]domain.TeleMeeting, int64, error)
	GetMyMeetings(userID uuid.UUID, role string, page, limit int) ([]domain.TeleMeeting, int64, error)
	UpdateMeeting(id uuid.UUID, input TeleMeetingUpdateInput) error
	DeleteMeeting(id uuid.UUID) error

	// Account generation
	GenerateClientAccount(formID uuid.UUID, telemarketerID uuid.UUID) (*GeneratedAccountResult, error)

	// Agreement
	CreateAgreement(input TeleAgreementInput) (*domain.TeleAgreement, error)
	GetAgreementByFormID(formID uuid.UUID) (*domain.TeleAgreement, error)
	VerifyAgreement(agreementID uuid.UUID, token string) (*VerificationResult, error)

	// Reguler Estimation Calculator
	CalculateReguler(input CalculateRegulerInput) (*RegulerEstimation, error)

	// Analytics
	GetAnalytics(filter map[string]interface{}) (*TeleAnalytics, error)
	GetDashboard(userID uuid.UUID, role string) (*TeleDashboard, error)

	// Pricing (public)
	GetPendampinganPricing() ([]PendampinganPrice, error)

	// Cleanup
	CleanupExpiredAccounts() error
}

// ── Input / Output DTOs ────────────────────────────────────────────────

type TeleFormInput struct {
	Name               string `json:"name" binding:"required"`
	Phone              string `json:"phone" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	BusinessType       string `json:"business_type" binding:"required"`
	BusinessScale      string `json:"business_scale" binding:"required"` // mikro_kecil, menengah, besar
	UsesMeat           bool   `json:"uses_meat"`
	ProvinceID         int64  `json:"province_id" binding:"required"`
	IsCatering         bool   `json:"is_catering"`
	IsAMDK             bool   `json:"is_amdk"`
	BranchCount        int    `json:"branch_count"`         // Jumlah cabang
	ConsultationMethod string `json:"consultation_method"` // ONLINE_MEET, CHAT
	AgreedTerms        bool   `json:"agreed_terms" binding:"required"`
	SharedByID         string `json:"shared_by_id"` // Optional: telemarketer referral
	Address            string `json:"address"`
	IPAddress          string `json:"-"`            // Set by handler
}

type TeleMeetingInput struct {
	TeleFormID     string `json:"tele_form_id" binding:"required"`
	TelemarketerID string `json:"-"` // Set from auth context
	ScheduledAt    string `json:"scheduled_at" binding:"required"`
	Duration       int    `json:"duration"`
	MeetingType    string `json:"meeting_type" binding:"required"` // ZOOM, WHATSAPP, GMEET
	MeetingLink    string `json:"meeting_link"`
	Notes          string `json:"notes"`
}

type TeleMeetingUpdateInput struct {
	ScheduledAt string `json:"scheduled_at"`
	Duration    int    `json:"duration"`
	MeetingType string `json:"meeting_type"`
	MeetingLink string `json:"meeting_link"`
	Notes       string `json:"notes"`
	Status      string `json:"status"` // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
}

type TeleAgreementInput struct {
	TeleFormID          string  `json:"tele_form_id" binding:"required"`
	BusinessName        string  `json:"business_name" binding:"required"`
	PICName             string  `json:"pic_name" binding:"required"`
	Address             string  `json:"address" binding:"required"`
	Email               string  `json:"email" binding:"required"`
	Phone               string  `json:"phone" binding:"required"`
	ServiceValue        float64 `json:"service_value" binding:"required"`
	DPPercent           float64 `json:"dp_percent" binding:"required"`
	DataAccuracyConsent bool    `json:"data_accuracy_consent" binding:"required"`
	AgreementConsent    bool    `json:"agreement_consent" binding:"required"`
	RegulatorConsent    bool    `json:"regulator_consent" binding:"required"`
	IPAddress           string  `json:"-"` // Set by handler
}

type GeneratedAccountResult struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	UserID   string `json:"user_id"`
}

type TeleAnalytics struct {
	TotalForms           int64              `json:"total_forms"`
	TotalTeleconference  int64              `json:"total_teleconference"`
	TotalSelfDeclare     int64              `json:"total_self_declare"`
	TotalAccountCreated  int64              `json:"total_account_created"`
	TotalAgreementSigned int64              `json:"total_agreement_signed"`
	TotalInvoiceSent     int64              `json:"total_invoice_sent"`
	TotalPaid            int64              `json:"total_paid"`
	TotalExpired         int64              `json:"total_expired"`
	ConversionRate       float64            `json:"conversion_rate"`       // Form → Paid %
	FunnelData           []TeleFunnelStep   `json:"funnel_data"`
	MonthlyTrend         []TeleMonthlyData  `json:"monthly_trend"`
}

type TeleFunnelStep struct {
	Step  string `json:"step"`
	Count int64  `json:"count"`
}

type TeleMonthlyData struct {
	Month         string `json:"month"` // "2026-01"
	FormsReceived int64  `json:"forms_received"`
	AccountsCreated int64 `json:"accounts_created"`
	Paid          int64  `json:"paid"`
}

type TeleDashboard struct {
	TotalAssigned      int64             `json:"total_assigned"`
	PendingForms       int64             `json:"pending_forms"`
	ScheduledMeetings  int64             `json:"scheduled_meetings"`
	ActiveClients      int64             `json:"active_clients"`
	TodayMeetings      []domain.TeleMeeting `json:"today_meetings"`
	RecentForms        []domain.TeleForm    `json:"recent_forms"`
	StatusCounts       map[string]int64     `json:"status_counts"`
}

// ── Estimation Calculator DTO ──────────────────────────────────────────

type CalculateRegulerInput struct {
	BusinessTypeID  int64  `json:"business_type_id" binding:"required"`
	BusinessScaleID int64  `json:"business_scale_id" binding:"required"`
	ProvinceID      int64  `json:"province_id" binding:"required"`
	RegencyID       *int64 `json:"regency_id"`
	ProductCount    int    `json:"product_count"`
	BranchCount     int    `json:"branch_count"`
	SalesSchemeID   int64  `json:"sales_scheme_id" binding:"required"`
	DataSource      string `json:"data_source"` // ORGANIK or MARKETING
}

type BreakdownItem struct {
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

type SchemePriceInfo struct {
	BasePrice       float64 `json:"base_price"`
	DiscountPercent float64 `json:"discount_percent"`
	Description     string  `json:"description"`
}

type RegulerEstimation struct {
	TotalAmount  float64           `json:"total_amount"`
	DPAmount     float64           `json:"dp_amount"`
	DPPercent    float64           `json:"dp_percent"`
	FinalAmount  float64           `json:"final_amount"`
	FinalPercent float64           `json:"final_percent"`
	Breakdown    []BreakdownItem   `json:"breakdown"`
	SchemePrice  SchemePriceInfo   `json:"scheme_price"`
}

type VerificationResult struct {
	Status        string    `json:"status"` // VALID, TAMPERED, INVALID
	AgreementNum  string    `json:"agreement_number"`
	BusinessName  string    `json:"business_name"`
	PICName       string    `json:"pic_name"`
	SignedAt      time.Time `json:"signed_at"`
}

// ── Pricing DTO ────────────────────────────────────────────────────────

type PendampinganPrice struct {
	ScaleName  string  `json:"scale_name"`
	ScaleValue string  `json:"scale_value"` // e.g. mikro_kecil, menengah, besar (mapped)
	Amount     float64 `json:"amount"`
}

// ── Dependencies ───────────────────────────────────────────────────────

type TelemarketingUsecaseDeps struct {
	FormRepo          domain.TeleFormRepository
	MeetingRepo       domain.TeleMeetingRepository
	AgreementRepo     domain.TeleAgreementRepository
	UserRepo          domain.UserRepository
	RoleRepo          domain.RoleRepository
	NotifUC           NotificationUsecase
	WASender          whatsapp.WhatsAppSender
	ClientRepo        domain.ClientRepository
	SubmissionRepo    domain.SubmissionRepository
	BillingConfigRepo domain.BillingConfigRepository
}

type telemarketingUsecase struct {
	TelemarketingUsecaseDeps
}

func NewTelemarketingUsecase(deps TelemarketingUsecaseDeps) TelemarketingUsecase {
	return &telemarketingUsecase{TelemarketingUsecaseDeps: deps}
}

// ── Public Form ────────────────────────────────────────────────────────

func (uc *telemarketingUsecase) SubmitPublicForm(input TeleFormInput) (*domain.TeleForm, error) {
	if !input.AgreedTerms {
		return nil, errors.New("harus menyetujui syarat dan ketentuan")
	}

	// Determine route type based on business criteria
	routeType := uc.determineRouteType(input)

	// Default branch count to 1 if not specified
	branchCount := input.BranchCount
	if branchCount < 1 {
		branchCount = 1
	}

	form := &domain.TeleForm{
		ID:                 uuid.New(),
		Name:               input.Name,
		Phone:              input.Phone,
		Email:              input.Email,
		BusinessType:       input.BusinessType,
		BusinessScale:      input.BusinessScale,
		UsesMeat:           input.UsesMeat,
		ProvinceID:         input.ProvinceID,
		IsCatering:         input.IsCatering,
		IsAMDK:             input.IsAMDK,
		BranchCount:        branchCount,
		ConsultationMethod: input.ConsultationMethod,
		AgreedTerms:        input.AgreedTerms,
		Address:            input.Address,
		RouteType:          routeType,
		IPAddress:          input.IPAddress,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	// Parse shared_by_id if provided
	if input.SharedByID != "" {
		sharedByUUID, err := uuid.Parse(input.SharedByID)
		if err == nil {
			form.SharedByID = &sharedByUUID
		}
	}

	// All forms go to telemarketing first — assign telemarketer
	form.Status = domain.TeleFormStatusPending
	telemarketer, err := uc.assignTelemarketer(form)
	if err != nil {
		log.Printf("Warning: could not auto-assign telemarketer: %v", err)
		// Don't fail — form still submitted, just unassigned
	} else {
		form.TelemarketerID = &telemarketer.ID
	}

	if err := uc.FormRepo.Create(form); err != nil {
		return nil, err
	}

	// Send WhatsApp notification
	msg := fmt.Sprintf("Halo %s,\n\nTerima kasih telah mendaftar di HalalCore.\nPengajuan Anda dengan kategori *%s* telah kami terima.\n\nTim telemarketing kami akan segera menghubungi Anda melalui %s untuk menindaklanjuti konsultasi atau verifikasi data.\n\nSalam,\nHalalCore",
		form.Name,
		routeType,
		form.ConsultationMethod,
	)
	_ = uc.WASender.Send(form.Phone, msg)

	return form, nil
}

// determineRouteType applies business rules to determine TELECONFERENCE or SELF_DECLARE.
// Rule:
// - If scale is not mikro/kecil (i.e. Menengah or Besar) -> TELECONFERENCE
// - If scale is mikro/kecil, and any of (uses_meat || is_catering || is_amdk) is checked -> TELECONFERENCE
// - Otherwise -> SELF_DECLARE
func (uc *telemarketingUsecase) determineRouteType(input TeleFormInput) domain.TeleRouteType {
	hasSpecialFlag := input.UsesMeat || input.IsCatering || input.IsAMDK
	isMicroOrUmkm := input.BusinessScale == "mikro_kecil"

	if !isMicroOrUmkm || hasSpecialFlag {
		return domain.TeleRouteTeleconference
	}
	return domain.TeleRouteSelfDeclare
}

// assignTelemarketer finds a telemarketer with the fewest active assignments (round-robin).
func (uc *telemarketingUsecase) assignTelemarketer(form *domain.TeleForm) (*domain.User, error) {
	// If SharedByID is a telemarketer, auto-assign to them
	if form.SharedByID != nil {
		sharer, err := uc.UserRepo.FindByID(*form.SharedByID)
		if err == nil && sharer.Role.Name == "TELEMARKETER" {
			return sharer, nil
		}
	}

	// Find all telemarketer users
	teleRole, err := uc.RoleRepo.FindByName("TELEMARKETER")
	if err != nil {
		return nil, fmt.Errorf("role TELEMARKETER not found: %w", err)
	}

	users, _, err := uc.UserRepo.FindAll(map[string]interface{}{"role_id": teleRole.ID}, 1, 1000)
	if err != nil || len(users) == 0 {
		return nil, errors.New("no telemarketer available")
	}

	// Simple round-robin: pick user with fewest assigned forms
	var bestUser *domain.User
	bestCount := int64(999999)

	for i := range users {
		_, count, _ := uc.FormRepo.FindByTelemarketerID(users[i].ID, 1, 0)
		if count < bestCount {
			bestCount = count
			bestUser = &users[i]
		}
	}

	if bestUser == nil {
		return &users[0], nil
	}
	return bestUser, nil
}

func (uc *telemarketingUsecase) GetFormByID(id uuid.UUID) (*domain.TeleForm, error) {
	return uc.FormRepo.FindByID(id)
}

func (uc *telemarketingUsecase) GetAllForms(filter map[string]interface{}, page, limit int) ([]domain.TeleForm, int64, error) {
	return uc.FormRepo.FindAll(filter, page, limit)
}

func (uc *telemarketingUsecase) GetMyForms(userID uuid.UUID, role string, filter map[string]interface{}, page, limit int) ([]domain.TeleForm, int64, error) {
	if filter == nil {
		filter = map[string]interface{}{}
	}
	if role == "TELEMARKETER" {
		filter["telemarketer_id"] = userID
	}
	return uc.FormRepo.FindAll(filter, page, limit)
}

func (uc *telemarketingUsecase) UpdateFormStatus(id uuid.UUID, status domain.TeleFormStatus) error {
	form, err := uc.FormRepo.FindByID(id)
	if err != nil {
		return err
	}
	form.Status = status
	form.UpdatedAt = time.Now()
	return uc.FormRepo.Update(form)
}

func (uc *telemarketingUsecase) SetSelfDeclareType(id uuid.UUID, selfDeclareType string) error {
	form, err := uc.FormRepo.FindByID(id)
	if err != nil {
		return err
	}
	if form.RouteType != domain.TeleRouteSelfDeclare {
		return errors.New("hanya form self-declare yang dapat diset tipe")
	}
	if selfDeclareType != string(domain.TeleSelfDeclareMandiri) && selfDeclareType != string(domain.TeleSelfDeclareGratis) {
		return errors.New("tipe self-declare tidak valid, gunakan MANDIRI atau GRATIS")
	}
	form.SelfDeclareType = selfDeclareType
	form.UpdatedAt = time.Now()
	return uc.FormRepo.Update(form)
}

// ── Meetings ───────────────────────────────────────────────────────────

func (uc *telemarketingUsecase) ScheduleMeeting(input TeleMeetingInput) (*domain.TeleMeeting, error) {
	formID, err := uuid.Parse(input.TeleFormID)
	if err != nil {
		return nil, errors.New("invalid tele_form_id")
	}

	telemarketerID, err := uuid.Parse(input.TelemarketerID)
	if err != nil {
		return nil, errors.New("invalid telemarketer_id")
	}

	scheduledAt, err := time.Parse(time.RFC3339, input.ScheduledAt)
	if err != nil {
		return nil, errors.New("invalid scheduled_at format, use RFC3339")
	}

	duration := input.Duration
	if duration == 0 {
		duration = 30
	}

	meeting := &domain.TeleMeeting{
		ID:             uuid.New(),
		TeleFormID:     formID,
		TelemarketerID: telemarketerID,
		ScheduledAt:    scheduledAt,
		Duration:       duration,
		MeetingType:    input.MeetingType,
		MeetingLink:    input.MeetingLink,
		Notes:          input.Notes,
		Status:         domain.TeleMeetingStatusScheduled,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := uc.MeetingRepo.Create(meeting); err != nil {
		return nil, err
	}

	// Update form status
	_ = uc.UpdateFormStatus(formID, domain.TeleFormStatusMeetingScheduled)

	// Send WhatsApp notification to client
	form, err := uc.FormRepo.FindByID(formID)
	if err == nil && uc.NotifUC != nil {
		msg := fmt.Sprintf(
			"Halo %s,\n\nMeeting konsultasi HalalCore Anda telah dijadwalkan:\n📅 %s\n⏰ %d menit\n🔗 %s\n\nTerima kasih.",
			form.Name,
			scheduledAt.Format("02 Jan 2006 15:04 WIB"),
			duration,
			input.MeetingLink,
		)
		_ = uc.NotifUC.SendWhatsAppNotification(form.Phone, msg)
	}

	return meeting, nil
}

func (uc *telemarketingUsecase) GetAllMeetings(filter map[string]interface{}, page, limit int) ([]domain.TeleMeeting, int64, error) {
	return uc.MeetingRepo.FindAll(filter, page, limit)
}

func (uc *telemarketingUsecase) GetMyMeetings(userID uuid.UUID, role string, page, limit int) ([]domain.TeleMeeting, int64, error) {
	if role == "TELEMARKETER" {
		return uc.MeetingRepo.FindByTelemarketerID(userID, page, limit)
	}
	return uc.MeetingRepo.FindAll(map[string]interface{}{}, page, limit)
}

func (uc *telemarketingUsecase) UpdateMeeting(id uuid.UUID, input TeleMeetingUpdateInput) error {
	meeting, err := uc.MeetingRepo.FindByID(id)
	if err != nil {
		return err
	}

	if input.ScheduledAt != "" {
		t, err := time.Parse(time.RFC3339, input.ScheduledAt)
		if err == nil {
			meeting.ScheduledAt = t
		}
	}
	if input.Duration > 0 {
		meeting.Duration = input.Duration
	}
	if input.MeetingType != "" {
		meeting.MeetingType = input.MeetingType
	}
	if input.MeetingLink != "" {
		meeting.MeetingLink = input.MeetingLink
	}
	if input.Notes != "" {
		meeting.Notes = input.Notes
	}
	if input.Status != "" {
		meeting.Status = domain.TeleMeetingStatus(input.Status)

		// If meeting completed, update form status
		if meeting.Status == domain.TeleMeetingStatusCompleted {
			_ = uc.UpdateFormStatus(meeting.TeleFormID, domain.TeleFormStatusMeetingCompleted)
		}
	}

	meeting.UpdatedAt = time.Now()
	return uc.MeetingRepo.Update(meeting)
}

func (uc *telemarketingUsecase) DeleteMeeting(id uuid.UUID) error {
	meeting, err := uc.MeetingRepo.FindByID(id)
	if err != nil {
		return err
	}
	// Revert the form status so they go back to the queue and can be scheduled again
	_ = uc.UpdateFormStatus(meeting.TeleFormID, domain.TeleFormStatusTeleconferenceQueued)
	return uc.MeetingRepo.Delete(id)
}

// ── Account Generation ─────────────────────────────────────────────────

func (uc *telemarketingUsecase) GenerateClientAccount(formID uuid.UUID, telemarketerID uuid.UUID) (*GeneratedAccountResult, error) {
	form, err := uc.FormRepo.FindByID(formID)
	if err != nil {
		return nil, errors.New("form not found")
	}

	if form.ClientUserID != nil {
		return nil, errors.New("account already generated for this form")
	}

	// Generate random password
	password := utils.RandomString(10)
	hash, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Get CLIENT role
	clientRole, err := uc.RoleRepo.FindByName("CLIENT")
	if err != nil {
		return nil, errors.New("CLIENT role not found")
	}

	// Determine creator/facilitator ID (use fallback admin if Nil)
	creatorID := telemarketerID
	if creatorID == uuid.Nil {
		admin, err := uc.UserRepo.FindByEmail("admin@ananahnu.id")
		if err == nil && admin != nil {
			creatorID = admin.ID
		}
	}

	// Determine service type based on route type
	serviceType := "REGULER"
	selfDeclareType := ""
	if form.RouteType == domain.TeleRouteSelfDeclare {
		serviceType = "SELF_DECLARE"
		if form.SelfDeclareType != "" {
			selfDeclareType = form.SelfDeclareType
		}
	}

	// Inline function to handle Client and Submission creation
	createClientAndSubmission := func() (*uuid.UUID, error) {
		var address string
		if form.Address != "" {
			address = form.Address
		}
		businessName := form.Name
		agreement, err := uc.AgreementRepo.FindByTeleFormID(form.ID)
		if err == nil && agreement != nil {
			if agreement.BusinessName != "" {
				businessName = agreement.BusinessName
			}
			if address == "" {
				address = agreement.Address
			}
		}

		// Create Client record
		clientID := uuid.New()
		client := &domain.Client{
			ID:              clientID,
			NIB:             "DRAFT-" + uuid.New().String()[:8],
			BusinessName:    businessName,
			ClientName:      form.Name,
			Phone:           form.Phone,
			Address:         address,
			ProductName:     form.BusinessType,
			ServiceType:     serviceType,
			SelfDeclareType: selfDeclareType,
			FacilitatorID:   creatorID,
			CreatedBy:       creatorID,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}
		if err := uc.ClientRepo.Create(client); err != nil {
			return nil, err
		}

		var salesSchemeID int64 = 1 // Direct Sale
		var scaleID int64
		switch form.BusinessScale {
		case "mikro_kecil":
			scaleID = 1
		case "menengah":
			scaleID = 3
		case "besar":
			scaleID = 4
		}

		// Create Submission record
		subID := uuid.New()
		sub := &domain.Submission{
			ID:              subID,
			ClientID:        clientID,
			Status:          domain.StatusDraft,
			ServiceType:     serviceType,
			SelfDeclareType: selfDeclareType,
			DataSource:      "ORGANIK",
			ProvinceID:      &form.ProvinceID,
			BranchCount:     form.BranchCount,
			ProductCount:    1,
			Mandays:         1,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}
		if scaleID > 0 {
			sub.BusinessScaleID = &scaleID
		}
		if serviceType == "REGULER" {
			sub.SalesSchemeID = &salesSchemeID
		}
		if err := uc.SubmissionRepo.Create(sub); err != nil {
			return nil, err
		}

		return &subID, nil
	}

	// Check if email already exists
	existing, _ := uc.UserRepo.FindByEmail(form.Email)
	if existing != nil {
		// If user already exists, link to form and auto-create submission
		form.ClientUserID = &existing.ID
		form.Status = domain.TeleFormStatusDataInput
		form.UpdatedAt = time.Now()

		subIDPtr, err := createClientAndSubmission()
		if err == nil {
			form.SubmissionID = subIDPtr
		}

		_ = uc.FormRepo.Update(form)

		return &GeneratedAccountResult{
			Email:    existing.Email,
			Password: "(existing account)",
			UserID:   existing.ID.String(),
		}, nil
	}

	// Create new user
	newUserID := uuid.New()
	user := &domain.User{
		ID:           newUserID,
		Username:     form.Email,
		Email:        form.Email,
		PasswordHash: hash,
		FullName:     form.Name,
		Phone:        form.Phone,
		ProvinceID:   form.ProvinceID,
		RoleID:       clientRole.ID,
		ReferralCode: uc.generateReferralCode(form.Name, newUserID),
	}

	if err := uc.UserRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	// Update form with client user ID and auto-created submission
	form.ClientUserID = &newUserID
	form.Status = domain.TeleFormStatusDataInput
	form.UpdatedAt = time.Now()

	subIDPtr, err := createClientAndSubmission()
	if err == nil {
		form.SubmissionID = subIDPtr
	}

	_ = uc.FormRepo.Update(form)

	// Send WhatsApp with account details
	if uc.NotifUC != nil {
		loginURL := os.Getenv("TELEMARKETING_URL")
		if loginURL == "" {
			if os.Getenv("APP_ENV") == "production" {
				loginURL = "https://telemarketing.halalcore.id/login"
			} else {
				loginURL = "http://localhost:5174/login"
			}
		}

		msg := fmt.Sprintf(
			"Halo %s,\n\nAkun HalalCore Anda telah dibuat:\n📧 Email: %s\n🔑 Password: %s\n\nSilakan login dan segera ganti password Anda.\n🔗 Login: %s\n\nTerima kasih.",
			form.Name, form.Email, password, loginURL,
		)
		_ = uc.NotifUC.SendWhatsAppNotification(form.Phone, msg)
	}

	return &GeneratedAccountResult{
		Email:    form.Email,
		Password: password,
		UserID:   newUserID.String(),
	}, nil
}

// ── Agreement ──────────────────────────────────────────────────────────

func (uc *telemarketingUsecase) CreateAgreement(input TeleAgreementInput) (*domain.TeleAgreement, error) {
	if !input.DataAccuracyConsent || !input.AgreementConsent || !input.RegulatorConsent {
		return nil, errors.New("semua persetujuan harus dicentang")
	}

	formID, err := uuid.Parse(input.TeleFormID)
	if err != nil {
		return nil, errors.New("invalid tele_form_id")
	}

	form, err := uc.FormRepo.FindByID(formID)
	if err != nil {
		return nil, errors.New("form not found")
	}

	if form.ClientUserID == nil {
		return nil, errors.New("client account belum dibuat")
	}

	// Get next agreement number
	agreementNumber, err := uc.AgreementRepo.GetNextAgreementNumber()
	if err != nil {
		return nil, err
	}

	agreement := &domain.TeleAgreement{
		ID:                  uuid.New(),
		TeleFormID:          formID,
		AgreementNumber:     agreementNumber,
		ClientUserID:        *form.ClientUserID,
		BusinessName:        input.BusinessName,
		PICName:             input.PICName,
		Address:             input.Address,
		Email:               input.Email,
		Phone:               input.Phone,
		ServiceValue:        input.ServiceValue,
		DPPercent:           input.DPPercent,
		DataAccuracyConsent: input.DataAccuracyConsent,
		AgreementConsent:    input.AgreementConsent,
		RegulatorConsent:    input.RegulatorConsent,
		IPAddress:           input.IPAddress,
		SignedAt:            time.Now(),
		CreatedAt:           time.Now(),
	}

	// Generate Verification Token (HMAC-SHA256)
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "halalcore-default-secret-key" // fallback
	}
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(agreement.ID.String() + agreement.AgreementNumber + agreement.SignedAt.Format(time.RFC3339)))
	agreement.VerificationToken = hex.EncodeToString(mac.Sum(nil))

	// Generate Signature Hash (SHA256 of frozen data)
	hashInput := fmt.Sprintf("%s|%s|%s|%s|%s|%.2f|%t|%t|%t|%s",
		input.BusinessName, input.PICName, input.Address, input.Email, input.Phone, input.ServiceValue,
		input.DataAccuracyConsent, input.AgreementConsent, input.RegulatorConsent, input.IPAddress)
	hash := sha256.Sum256([]byte(hashInput))
	agreement.SignatureHash = hex.EncodeToString(hash[:])

	if err := uc.AgreementRepo.Create(agreement); err != nil {
		return nil, err
	}

	// Update form status
	form.Status = domain.TeleFormStatusAgreementSigned
	form.UpdatedAt = time.Now()
	_ = uc.FormRepo.Update(form)

	return agreement, nil
}

func (uc *telemarketingUsecase) GetAgreementByFormID(formID uuid.UUID) (*domain.TeleAgreement, error) {
	return uc.AgreementRepo.FindByTeleFormID(formID)
}

func (uc *telemarketingUsecase) VerifyAgreement(agreementID uuid.UUID, token string) (*VerificationResult, error) {
	agreement, err := uc.AgreementRepo.FindByID(agreementID)
	if err != nil {
		return &VerificationResult{Status: "INVALID"}, nil
	}

	// Verify token
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "halalcore-default-secret-key" // fallback
	}
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(agreement.ID.String() + agreement.AgreementNumber + agreement.SignedAt.Format(time.RFC3339)))
	expectedToken := hex.EncodeToString(mac.Sum(nil))

	if token != expectedToken || token != agreement.VerificationToken {
		return &VerificationResult{Status: "INVALID"}, nil
	}

	// Verify data integrity
	hashInput := fmt.Sprintf("%s|%s|%s|%s|%s|%.2f|%t|%t|%t|%s",
		agreement.BusinessName, agreement.PICName, agreement.Address, agreement.Email, agreement.Phone, agreement.ServiceValue,
		agreement.DataAccuracyConsent, agreement.AgreementConsent, agreement.RegulatorConsent, agreement.IPAddress)
	expectedHashBytes := sha256.Sum256([]byte(hashInput))
	expectedHash := hex.EncodeToString(expectedHashBytes[:])

	status := "VALID"
	if expectedHash != agreement.SignatureHash {
		status = "TAMPERED"
	}

	return &VerificationResult{
		Status:       status,
		AgreementNum: agreement.AgreementNumber,
		BusinessName: agreement.BusinessName,
		PICName:      agreement.PICName,
		SignedAt:     agreement.SignedAt,
	}, nil
}

// ── Estimation Calculator ──────────────────────────────────────────────

func (uc *telemarketingUsecase) CalculateReguler(input CalculateRegulerInput) (*RegulerEstimation, error) {
	if uc.BillingConfigRepo == nil {
		return nil, errors.New("billing config not available")
	}

	// 1. Ambil skema penjualan
	schemes, err := uc.BillingConfigRepo.FindAllSalesSchemePrices(map[string]interface{}{
		"sales_scheme_id":   input.SalesSchemeID,
		"business_type_id":  input.BusinessTypeID,
		"business_scale_id": input.BusinessScaleID,
		"is_active":         true,
	})
	if err != nil {
		return nil, errors.New("gagal mengambil harga skema penjualan: " + err.Error())
	}
	
	var scheme *domain.SalesSchemePrice
	if len(schemes) > 0 {
		scheme = &schemes[0]
	}

	// 2. Ambil semua komponen biaya yg aktif
	components, err := uc.BillingConfigRepo.FindAllBillingComponents(map[string]interface{}{"is_active": true})
	if err != nil {
		return nil, errors.New("gagal mengambil komponen biaya: " + err.Error())
	}

	var total float64
	var breakdown []BreakdownItem

	// Find the best matching PENDAMPINGAN component
	var bestPendampingan *domain.BillingComponent
	bestScore := -1

	for _, comp := range components {
		if comp.Category != "PENDAMPINGAN" {
			continue
		}
		// Match filters
		if comp.ProvinceID != nil && *comp.ProvinceID != input.ProvinceID {
			continue
		}
		if comp.RegencyID != nil && input.RegencyID != nil && *comp.RegencyID != *input.RegencyID {
			continue
		}
		if comp.BusinessTypeID != nil && *comp.BusinessTypeID != input.BusinessTypeID {
			continue
		}
		if comp.BusinessScaleID != nil && *comp.BusinessScaleID != input.BusinessScaleID {
			continue
		}
		if comp.SalesSchemeID != nil && *comp.SalesSchemeID != input.SalesSchemeID {
			continue
		}

		// Score specificity
		score := 0
		if comp.DistrictID != nil { score += 1000 }
		if comp.RegencyID != nil { score += 100 }
		if comp.ProvinceID != nil { score += 10 }
		if comp.SalesSchemeID != nil { score += 8 }
		if comp.BusinessScaleID != nil { score += 5 }
		if comp.ProductCategoryID != nil { score += 2 }
		if comp.BusinessTypeID != nil { score += 1 }

		if score > bestScore {
			bestScore = score
			bestPendampingan = &comp
		}
	}

	var price float64
	var name string = "Jasa Pendampingan"

	if bestPendampingan != nil {
		price = bestPendampingan.BaseAmount
		name = bestPendampingan.Name
	} else if scheme != nil {
		price = scheme.BasePrice
		if scheme.SalesScheme.Name != "" {
			name = scheme.SalesScheme.Name
		}
	}

	if scheme != nil && scheme.DiscountPercent > 0 {
		discount := price * (scheme.DiscountPercent / 100.0)
		price -= discount
	}

	if price > 0 {
		total += price
		breakdown = append(breakdown, BreakdownItem{
			Name:     name,
			Category: "PENDAMPINGAN",
			Amount:   price,
		})
	}

	// 3. Hitung komponen lainnya berdasarkan rule masing-masing
	for _, comp := range components {
		if comp.Category == "PENDAMPINGAN" {
			continue // Jasa pendampingan sudah dihitung
		}

		// Filter komponen yg mensyaratkan province/regency/dll
		if comp.ProvinceID != nil && *comp.ProvinceID != input.ProvinceID {
			continue
		}
		if comp.RegencyID != nil && input.RegencyID != nil && *comp.RegencyID != *input.RegencyID {
			continue
		}
		if comp.BusinessTypeID != nil && *comp.BusinessTypeID != input.BusinessTypeID {
			continue
		}
		if comp.BusinessScaleID != nil && *comp.BusinessScaleID != input.BusinessScaleID {
			continue
		}
		if comp.SalesSchemeID != nil && *comp.SalesSchemeID != input.SalesSchemeID {
			continue
		}

		amount := comp.BaseAmount
		
		// Modifier untuk cabang
		if comp.Type == "PER_CABANG" && input.BranchCount > 1 {
			amount = amount * float64(input.BranchCount)
		}

		// Modifier untuk produk
		if comp.Type == "PER_PRODUK" && input.ProductCount > 0 {
			// Misalnya ada free produk, ini bisa dilanjut logicnya. Untuk sederhananya:
			amount = amount * float64(input.ProductCount)
		}

		total += amount
		breakdown = append(breakdown, BreakdownItem{
			Name:     comp.Name,
			Category: comp.Category,
			Amount:   amount,
		})
	}

	// Skema DP (70% - 30%)
	dpPercent := 70.0
	dpAmount := total * (dpPercent / 100.0)
	finalAmount := total - dpAmount

	var schemePriceInfo SchemePriceInfo
	basePriceVal := price
	if scheme != nil && scheme.DiscountPercent > 0 {
		// Calculate the basePrice before discount to display correctly
		basePriceVal = price / (1.0 - (scheme.DiscountPercent / 100.0))
	}
	if scheme != nil {
		schemePriceInfo = SchemePriceInfo{
			BasePrice:       basePriceVal,
			DiscountPercent: scheme.DiscountPercent,
			Description:     scheme.Description,
		}
	} else if bestPendampingan != nil {
		schemePriceInfo = SchemePriceInfo{
			BasePrice:       basePriceVal,
			DiscountPercent: 0,
			Description:     "Harga Berdasarkan Kategori Pendampingan",
		}
	}

	return &RegulerEstimation{
		TotalAmount:  total,
		DPAmount:     dpAmount,
		DPPercent:    dpPercent,
		FinalAmount:  finalAmount,
		FinalPercent: 100.0 - dpPercent,
		Breakdown:    breakdown,
		SchemePrice:  schemePriceInfo,
	}, nil
}

// ── Analytics ──────────────────────────────────────────────────────────

func (uc *telemarketingUsecase) GetAnalytics(filter map[string]interface{}) (*TeleAnalytics, error) {
	allForms, _, err := uc.FormRepo.FindAll(filter, 1, 100000)
	if err != nil {
		return nil, err
	}

	analytics := &TeleAnalytics{}

	for _, f := range allForms {
		if f.Status == domain.TeleFormStatusDeleted {
			continue
		}

		analytics.TotalForms++

		// Route Type Distributions
		switch f.RouteType {
		case domain.TeleRouteSelfDeclare:
			analytics.TotalSelfDeclare++
		case domain.TeleRouteTeleconference:
			analytics.TotalTeleconference++
		}

		// Funnel Metrics (Cumulative)
		
		// 1. Akun Dibuat (and beyond)
		if f.Status == domain.TeleFormStatusAccountCreated ||
			f.Status == domain.TeleFormStatusDataInput ||
			f.Status == domain.TeleFormStatusAgreementSigned ||
			f.Status == domain.TeleFormStatusInvoiceSent ||
			f.Status == domain.TeleFormStatusPaid {
			analytics.TotalAccountCreated++
		}

		// 2. Agreement Signed (and beyond)
		if f.Status == domain.TeleFormStatusAgreementSigned ||
			f.Status == domain.TeleFormStatusInvoiceSent ||
			f.Status == domain.TeleFormStatusPaid {
			analytics.TotalAgreementSigned++
		}

		// 3. Invoice Sent (and beyond)
		if f.Status == domain.TeleFormStatusInvoiceSent ||
			f.Status == domain.TeleFormStatusPaid {
			analytics.TotalInvoiceSent++
		}

		// 4. Paid
		if f.Status == domain.TeleFormStatusPaid {
			analytics.TotalPaid++
		}
	}

	// For the funnel step "Teleconference", calculate the cumulative count of teleconference-routed forms that went past PENDING
	var teleconferenceFunnelCount int64
	for _, f := range allForms {
		if f.Status == domain.TeleFormStatusDeleted {
			continue
		}
		if f.RouteType == domain.TeleRouteTeleconference && f.Status != domain.TeleFormStatusPending {
			teleconferenceFunnelCount++
		}
	}

	// Calculate conversion rate
	if analytics.TotalForms > 0 {
		analytics.ConversionRate = float64(analytics.TotalPaid) / float64(analytics.TotalForms) * 100
	}

	// Build funnel data
	analytics.FunnelData = []TeleFunnelStep{
		{Step: "Form Masuk", Count: analytics.TotalForms},
		{Step: "Teleconference", Count: teleconferenceFunnelCount},
		{Step: "Akun Dibuat", Count: analytics.TotalAccountCreated},
		{Step: "Agreement", Count: analytics.TotalAgreementSigned},
		{Step: "Invoice Terkirim", Count: analytics.TotalInvoiceSent},
		{Step: "Dibayar", Count: analytics.TotalPaid},
	}

	// Build monthly trend
	monthlyMap := make(map[string]*TeleMonthlyData)
	for _, f := range allForms {
		if f.Status == domain.TeleFormStatusDeleted {
			continue
		}
		key := f.CreatedAt.Format("2006-01")
		if _, ok := monthlyMap[key]; !ok {
			monthlyMap[key] = &TeleMonthlyData{Month: key}
		}
		monthlyMap[key].FormsReceived++

		if f.Status == domain.TeleFormStatusAccountCreated || f.Status == domain.TeleFormStatusDataInput ||
			f.Status == domain.TeleFormStatusAgreementSigned || f.Status == domain.TeleFormStatusInvoiceSent ||
			f.Status == domain.TeleFormStatusPaid {
			monthlyMap[key].AccountsCreated++
		}
		if f.Status == domain.TeleFormStatusPaid {
			monthlyMap[key].Paid++
		}
	}

	for _, v := range monthlyMap {
		analytics.MonthlyTrend = append(analytics.MonthlyTrend, *v)
	}

	return analytics, nil
}

func (uc *telemarketingUsecase) GetDashboard(userID uuid.UUID, role string) (*TeleDashboard, error) {
	dashboard := &TeleDashboard{}

	// Status counts for this user/role
	statusFilter := map[string]interface{}{}
	if role == "TELEMARKETER" {
		statusFilter["telemarketer_id"] = userID
	}
	counts, _ := uc.FormRepo.CountByStatus(statusFilter)
	dashboard.StatusCounts = counts

	// Total assigned
	var total int64
	if role == "TELEMARKETER" {
		_, total, _ = uc.FormRepo.FindByTelemarketerID(userID, 1, 0)
	} else {
		_, total, _ = uc.FormRepo.FindAll(map[string]interface{}{}, 1, 0)
	}
	dashboard.TotalAssigned = total

	// Pending forms
	dashboard.PendingForms = counts[string(domain.TeleFormStatusPending)] +
		counts[string(domain.TeleFormStatusTeleconferenceQueued)]

	// Active clients (account created but not yet paid)
	dashboard.ActiveClients = counts[string(domain.TeleFormStatusAccountCreated)] +
		counts[string(domain.TeleFormStatusDataInput)] +
		counts[string(domain.TeleFormStatusAgreementSigned)] +
		counts[string(domain.TeleFormStatusInvoiceSent)]

	// Scheduled meetings
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.Add(24 * time.Hour)

	meetingFilter := map[string]interface{}{
		"status":    "SCHEDULED",
		"date_from": todayStart,
		"date_to":   todayEnd,
	}
	if role == "TELEMARKETER" {
		meetingFilter["telemarketer_id"] = userID
	}
	todayMeetings, scheduledCount, _ := uc.MeetingRepo.FindAll(meetingFilter, 1, 100)
	dashboard.TodayMeetings = todayMeetings
	dashboard.ScheduledMeetings = scheduledCount

	// Recent forms (last 10)
	var recentForms []domain.TeleForm
	if role == "TELEMARKETER" {
		recentForms, _, _ = uc.FormRepo.FindByTelemarketerID(userID, 1, 10)
	} else {
		recentForms, _, _ = uc.FormRepo.FindAll(map[string]interface{}{}, 1, 10)
	}
	dashboard.RecentForms = recentForms

	return dashboard, nil
}

// ── Cleanup ────────────────────────────────────────────────────────────

func (uc *telemarketingUsecase) CleanupExpiredAccounts() error {
	cutoffDate := time.Now().AddDate(0, 0, -30)
	forms, err := uc.FormRepo.FindExpiredUnpaid(cutoffDate)
	if err != nil {
		return err
	}

	for _, form := range forms {
		log.Printf("Cleaning up expired form: %s (email: %s)", form.ID, form.Email)

		// Delete the client user account if it was created
		if form.ClientUserID != nil {
			_ = uc.UserRepo.Delete(*form.ClientUserID)
		}

		// Update form status
		form.Status = domain.TeleFormStatusDeleted
		form.UpdatedAt = time.Now()
		_ = uc.FormRepo.Update(&form)
	}

	return nil
}

func (uc *telemarketingUsecase) generateReferralCode(fullName string, userID uuid.UUID) string {
	// Hapus semua vokal dari seluruh nama, ambil konsonan saja
	prefix := strings.ToUpper(removeVowelsAndNonAlpha(fullName))
	if prefix == "" {
		prefix = "RF"
	}

	// Cek keunikan, jika duplikat tambah angka di belakang
	const maxAttempts = 1000
	code := prefix
	counter := 2
	for i := 0; i < maxAttempts; i++ {
		existing, err := uc.UserRepo.FindByReferralCode(code)
		if err != nil {
			// Record not found → kode unik
			return code
		}
		if userID != uuid.Nil && existing != nil && existing.ID == userID {
			return code
		}
		code = fmt.Sprintf("%s%d", prefix, counter)
		counter++
	}
	uuidStr := strings.ReplaceAll(uuid.New().String(), "-", "")
	cleanUUID := strings.ToUpper(removeVowelsAndNonAlpha(uuidStr))
	if len(cleanUUID) > 6 {
		cleanUUID = cleanUUID[:6]
	}
	return fmt.Sprintf("%s-%s", prefix, cleanUUID)
}

// ── Public Pricing ─────────────────────────────────────────────────────

func (uc *telemarketingUsecase) GetPendampinganPricing() ([]PendampinganPrice, error) {
	if uc.BillingConfigRepo == nil {
		return nil, errors.New("billing config not available")
	}

	filter := map[string]interface{}{
		"category": "PENDAMPINGAN",
	}
	components, err := uc.BillingConfigRepo.FindAllBillingComponents(filter)
	if err != nil {
		return nil, err
	}

	// Load all business scales to map IDs to names
	scales, err := uc.BillingConfigRepo.FindAllBusinessScales()
	if err != nil {
		return nil, err
	}
	scaleMap := make(map[int64]string)
	for _, s := range scales {
		scaleMap[s.ID] = s.Name
	}

	// Map scale name to the form value used in the telemarketing form
	nameToValue := map[string]string{
		"Mikro":    "mikro_kecil",
		"Kecil":    "mikro_kecil",
		"Menengah": "menengah",
		"Besar":    "besar",
	}

	var result []PendampinganPrice
	seen := make(map[string]bool)

	for _, comp := range components {
		if comp.BusinessScaleID == nil {
			continue
		}
		scaleName := scaleMap[*comp.BusinessScaleID]
		scaleValue := nameToValue[scaleName]
		if scaleValue == "" {
			scaleValue = strings.ToLower(scaleName)
		}

		// For mikro_kecil, keep the higher amount if both Mikro and Kecil exist
		if seen[scaleValue] {
			// Update if this amount is higher
			for i := range result {
				if result[i].ScaleValue == scaleValue && comp.BaseAmount > result[i].Amount {
					result[i].Amount = comp.BaseAmount
				}
			}
			continue
		}

		seen[scaleValue] = true
		result = append(result, PendampinganPrice{
			ScaleName:  scaleName,
			ScaleValue: scaleValue,
			Amount:     comp.BaseAmount,
		})
	}

	return result, nil
}
