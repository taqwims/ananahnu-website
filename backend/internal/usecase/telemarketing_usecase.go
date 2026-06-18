package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/utils"
	"ananahnu/pkg/whatsapp"
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
	createClientAndSubmission := func(userID uuid.UUID) (*uuid.UUID, error) {
		businessName := form.Name + " Business"
		agreement, err := uc.AgreementRepo.FindByTeleFormID(form.ID)
		if err == nil && agreement != nil && agreement.BusinessName != "" {
			businessName = agreement.BusinessName
		}

		// Create Client record
		clientID := uuid.New()
		client := &domain.Client{
			ID:              clientID,
			NIB:             "DRAFT-" + uuid.New().String()[:8],
			BusinessName:    businessName,
			ClientName:      form.Name,
			Phone:           form.Phone,
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

		// Create Submission record
		subID := uuid.New()
		sub := &domain.Submission{
			ID:              subID,
			ClientID:        clientID,
			Status:          domain.StatusDraft,
			ServiceType:     serviceType,
			SelfDeclareType: selfDeclareType,
			DataSource:      "TELEMARKETING",
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
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

		subIDPtr, err := createClientAndSubmission(existing.ID)
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

	subIDPtr, err := createClientAndSubmission(newUserID)
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

// ── Analytics ──────────────────────────────────────────────────────────

func (uc *telemarketingUsecase) GetAnalytics(filter map[string]interface{}) (*TeleAnalytics, error) {
	statusCounts, err := uc.FormRepo.CountByStatus(filter)
	if err != nil {
		return nil, err
	}

	analytics := &TeleAnalytics{}

	// Sum totals from status counts
	for status, count := range statusCounts {
		analytics.TotalForms += count

		switch domain.TeleFormStatus(status) {
		case domain.TeleFormStatusTeleconferenceQueued, domain.TeleFormStatusMeetingScheduled, domain.TeleFormStatusMeetingCompleted:
			analytics.TotalTeleconference += count
		case domain.TeleFormStatusAccountCreated, domain.TeleFormStatusDataInput:
			analytics.TotalAccountCreated += count
		case domain.TeleFormStatusAgreementSigned:
			analytics.TotalAgreementSigned += count
		case domain.TeleFormStatusInvoiceSent:
			analytics.TotalInvoiceSent += count
		case domain.TeleFormStatusPaid:
			analytics.TotalPaid += count
		case domain.TeleFormStatusExpired, domain.TeleFormStatusDeleted:
			analytics.TotalExpired += count
		}
	}

	// Also count self-declare from route_type
	allForms, _, _ := uc.FormRepo.FindAll(filter, 1, 100000)
	for _, f := range allForms {
		if f.RouteType == domain.TeleRouteSelfDeclare {
			analytics.TotalSelfDeclare++
		}
	}

	// Calculate conversion rate
	if analytics.TotalForms > 0 {
		analytics.ConversionRate = float64(analytics.TotalPaid) / float64(analytics.TotalForms) * 100
	}

	// Build funnel data
	analytics.FunnelData = []TeleFunnelStep{
		{Step: "Form Masuk", Count: analytics.TotalForms},
		{Step: "Teleconference", Count: analytics.TotalTeleconference},
		{Step: "Akun Dibuat", Count: analytics.TotalAccountCreated},
		{Step: "Agreement", Count: analytics.TotalAgreementSigned},
		{Step: "Invoice Terkirim", Count: analytics.TotalInvoiceSent},
		{Step: "Dibayar", Count: analytics.TotalPaid},
	}

	// Build monthly trend
	monthlyMap := make(map[string]*TeleMonthlyData)
	for _, f := range allForms {
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
