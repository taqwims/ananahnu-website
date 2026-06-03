package main

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"ananahnu/internal/domain"
	"ananahnu/internal/seeder"
	"ananahnu/pkg/database"
	"ananahnu/pkg/email"
	"ananahnu/pkg/midtrans"
	"ananahnu/pkg/whatsapp"

	httpDelivery "ananahnu/internal/delivery/http"
	"ananahnu/internal/repository"
	"ananahnu/internal/usecase"
	"os"
)

func main() {
	// 1. Load Env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	// 2. Connect DB
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 3. Auto Migrate
	log.Println("Running AutoMigrate...")
	// Force add audit result columns if they are missing (Fail-safe)
	_ = db.Exec("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS audit_result_1_url TEXT")
	_ = db.Exec("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS audit_result_2_url TEXT")

	err = db.AutoMigrate(
		// Auth & Users
		&domain.Role{},
		&domain.Permission{},
		&domain.RolePermission{},
		&domain.User{},
		&domain.PasswordResetToken{},
		// Client & Submission
		&domain.Client{},
		&domain.Submission{},
		&domain.SubmissionFile{},
		// Payment
		&domain.Payment{},
		// Notifications
		&domain.Notification{},
		// KPI
		&domain.KPIPerformance{},
		// Audit
		&domain.AuditLog{},
		// CMS
		&domain.ContentBlock{},
		&domain.News{},
		&domain.Affiliate{},
		&domain.CertifiedProduct{},
		// Dynamic Form Config
		&domain.FormFieldConfig{},
		&domain.FormFieldValue{},
		// Geography & Billing
		&domain.Province{},
		&domain.Regency{},
		&domain.District{},
		&domain.BillingRate{},
		// Training
		&domain.Training{},
		&domain.TrainingParticipant{},
		// Consultant
		&domain.ConsultantProfile{},
		// Invoice & Billing Config
		&domain.Invoice{},
		&domain.PaymentConfig{},
		// Dynamic Cost/Billing
		&domain.SalesScheme{},
		&domain.BusinessType{},
		&domain.ProductCategory{},
		&domain.BusinessScale{},
		&domain.BillingComponent{},
		&domain.SalesSchemePrice{},
		&domain.SubmissionCostDetail{},
		&domain.CoordinatorRate{},
		&domain.SystemSetting{},
		&domain.Commission{},
		&domain.PromotionRequest{},
		// SPH & Targets & Expenses
		&domain.SPH{},
		&domain.CompanyTarget{},
		&domain.Expense{},
		// Telemarketing
		&domain.TeleForm{},
		&domain.TeleMeeting{},
		&domain.TeleAgreement{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("Migration successful.")

	// 4. Seed Roles (Idempotent)
	log.Println("Seeding Roles...")
	roles := []string{
		"DIRECTOR", "MANAGER", "QC_OFFICER", "DRAFTER",
		"HALAL_ADVISOR", "MARKETING", "AUDIT_MANAGER",
		"CLIENT", "FINANCE",
		"HALAL_MANAGER", "HALAL_DIRECTOR", "ADMIN_PELATIHAN", "ADMIN_KEUANGAN",
		"BUSINESS_DEVELOPMENT", "DRAFT_MANAGER",
		"TELEMARKETER",
	}
	for _, roleName := range roles {
		var r domain.Role
		if err := db.FirstOrCreate(&r, domain.Role{Name: roleName}).Error; err != nil {
			log.Printf("Failed to seed role %s: %v", roleName, err)
		}
	}
	log.Println("Seeding completed.")

	// 4.5 Seed Admin User
	var adminUser domain.User
	if err := db.Where("email = ?", "admin@ananahnu.id").First(&adminUser).Error; err != nil {
		log.Println("Seeding Admin User...")
		// Hash password
		hashed, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

		// Find Director Role ID
		var directorRole domain.Role
		db.Where("name = ?", "DIRECTOR").First(&directorRole)

		admin := domain.User{
			Email:        "admin@ananahnu.id",
			Username:     "admin",
			FullName:     "Super Admin",
			PasswordHash: string(hashed),
			RoleID:       directorRole.ID,
		}
		if err := db.Create(&admin).Error; err != nil {
			log.Printf("Failed to create admin: %v", err)
		} else {
			log.Println("Admin created: admin@ananahnu.id / password123")
		}
	}

	// 5. Setup Repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	clientRepo := repository.NewClientRepository(db)
	submissionRepo := repository.NewSubmissionRepository(db)
	auditRepo := repository.NewAuditLogRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	tokenRepo := repository.NewPasswordTokenRepository(db)
	notifRepo := repository.NewNotificationRepository(db)
	cmsRepo := repository.NewCMSRepository(db)
	formConfigRepo := repository.NewFormConfigRepository(db)
	formValueRepo := repository.NewFormFieldValueRepository(db)
	geoRepo := repository.NewGeographyRepository(db)
	billingRateRepo := repository.NewBillingRateRepository(db)
	trainingRepo := repository.NewTrainingRepository(db)
	participantRepo := repository.NewTrainingParticipantRepository(db)
	consultantRepo := repository.NewConsultantProfileRepository(db)
	invoiceRepo := repository.NewInvoiceRepository(db)
	paymentConfigRepo := repository.NewPaymentConfigRepository(db)
	billingConfigRepo := repository.NewBillingConfigRepository(db)
	coordinatorRateRepo := repository.NewCoordinatorRateRepository(db)
	settingRepo := repository.NewPostgresSystemSettingRepository(db)
	commissionRepo := repository.NewCommissionRepository(db)
	sphRepo := repository.NewSPHRepository(db)
	companyTargetRepo := repository.NewCompanyTargetRepository(db)
	expenseRepo := repository.NewExpenseRepository(db)
	teleFormRepo := repository.NewTeleFormRepository(db)
	teleMeetingRepo := repository.NewTeleMeetingRepository(db)
	teleAgreementRepo := repository.NewTeleAgreementRepository(db)

	// Services
	emailSender := email.NewGmailSender()
	midtransGateway := midtrans.NewMidtransGateway()

	// WhatsApp Sender with dynamic token from SystemSetting
	waSender := whatsapp.NewFonnteSender(func() string {
		setting, err := settingRepo.GetSetting("fonnte_token")
		if err == nil && setting != nil && setting.Value != "" {
			return setting.Value
		}
		// Fallback to env
		return os.Getenv("FONNTE_TOKEN")
	})

	// 6. Setup Usecases
	authUC := usecase.NewAuthUsecase(usecase.AuthUsecaseDeps{
		UserRepo:       userRepo,
		RoleRepo:       roleRepo,
		ClientRepo:     clientRepo,
		TokenRepo:      tokenRepo,
		CommissionRepo: commissionRepo,
		EmailSender:    emailSender,
	})
	notificationUC := usecase.NewNotificationUsecase(usecase.NotificationUsecaseDeps{
		NotifRepo:   notifRepo,
		WASender:    waSender,
		SettingRepo: settingRepo,
	})
	importUC := usecase.NewImportUsecase(usecase.ImportUsecaseDeps{
		ClientRepo: clientRepo,
	})
	exportUC := usecase.NewExportUsecase(usecase.ExportUsecaseDeps{
		ClientRepo: clientRepo,
	})
	cmsUC := usecase.NewCMSUsecase(usecase.CMSUsecaseDeps{
		CMSRepo: cmsRepo,
	})
	clientCRUDUC := usecase.NewClientUsecase(usecase.ClientUsecaseDeps{
		ClientRepo:      clientRepo,
		UserRepo:        userRepo,
		ConsultantRepo:  consultantRepo,
		ParticipantRepo: participantRepo,
	})
	dashboardUC := usecase.NewDashboardUsecase(usecase.DashboardUsecaseDeps{
		SubmissionRepo: submissionRepo,
		ClientRepo:     clientRepo,
		AuditRepo:      auditRepo,
		UserRepo:       userRepo,
	})
	formConfigUC := usecase.NewFormConfigUsecase(usecase.FormConfigUsecaseDeps{
		ConfigRepo: formConfigRepo,
		ValueRepo:  formValueRepo,
	})
	geographyUC := usecase.NewGeographyUsecase(usecase.GeographyUsecaseDeps{
		GeoRepo:  geoRepo,
		RateRepo: billingRateRepo,
	})
	trainingUC := usecase.NewTrainingUsecase(usecase.TrainingUsecaseDeps{
		TrainingRepo:    trainingRepo,
		ParticipantRepo: participantRepo,
		UserRepo:        userRepo,
	})
	consultantUC := usecase.NewConsultantUsecase(usecase.ConsultantUsecaseDeps{
		ProfileRepo: consultantRepo,
		UserRepo:    userRepo,
	})

	// Initialize in order of dependency: Billing -> Workflow -> Payment
	billingUC := usecase.NewBillingUsecase(usecase.BillingUsecaseDeps{
		InvoiceRepo:       invoiceRepo,
		ConfigRepo:        paymentConfigRepo,
		RateRepo:          billingRateRepo,
		UserRepo:          userRepo,
		NotifUC:           notificationUC,
		CommissionRepo:    commissionRepo,
		SettingRepo:       settingRepo,
		SubmissionRepo:    submissionRepo,
		BillingConfigRepo: billingConfigRepo,
	})

	submissionUC := usecase.NewSubmissionWorkflowUsecase(usecase.SubmissionWorkflowDeps{
		SubmissionRepo:    submissionRepo,
		ClientRepo:        clientRepo,
		RoleRepo:          roleRepo,
		AuditRepo:         auditRepo,
		UserRepo:          userRepo,
		NotifUC:           notificationUC,
		InvoiceRepo:       invoiceRepo,
		RateRepo:          coordinatorRateRepo,
		FieldValueRepo:    formValueRepo,
		BillingConfigRepo: billingConfigRepo,
		ConsultantRepo:    consultantRepo,
		ParticipantRepo:   participantRepo,
		SettingRepo:       settingRepo,
	})

	paymentUC := usecase.NewPaymentUsecase(usecase.PaymentUsecaseDeps{
		PaymentRepo:    paymentRepo,
		SubmissionRepo: submissionRepo,
		AuditRepo:      auditRepo,
		Midtrans:       midtransGateway,
		InvoiceRepo:    invoiceRepo,
		BillingUC:      billingUC,
		NotifUC:        notificationUC,
		SettingRepo:    settingRepo,
		WorkflowUC:     submissionUC,
	})

	userMgmtUC := usecase.NewUserManagementUsecase(usecase.UserManagementUsecaseDeps{
		UserRepo:       userRepo,
		RoleRepo:       roleRepo,
		CommissionRepo: commissionRepo,
	})
	billingConfigUC := usecase.NewBillingConfigUsecase(usecase.BillingConfigUsecaseDeps{
		Repo:           billingConfigRepo,
		RateRepo:       coordinatorRateRepo,
		InvoiceRepo:    invoiceRepo,
		SubmissionRepo: submissionRepo,
	})
	settingUC := usecase.NewSystemSettingUsecase(usecase.SystemSettingUsecaseDeps{
		Repo: settingRepo,
	})
	documentUC := usecase.NewDocumentUsecase(usecase.DocumentUsecaseDeps{
		SubmissionRepo: submissionRepo,
		SettingRepo:    settingRepo,
	})

	promotionRepo := repository.NewPromotionRepository(db)
	promotionUC := usecase.NewPromotionUsecase(usecase.PromotionUsecaseDeps{
		PromotionRepo:   promotionRepo,
		UserRepo:        userRepo,
		CommissionRepo:  commissionRepo,
		RoleRepo:        roleRepo,
		ParticipantRepo: participantRepo,
	})

	sphUC := usecase.NewSPHUsecase(usecase.SPHUsecaseDeps{
		SPHRepo:           sphRepo,
		SubmissionRepo:    submissionRepo,
		BillingConfigRepo: billingConfigRepo,
	})

	financeUC := usecase.NewFinanceUsecase(usecase.FinanceUsecaseDeps{
		InvoiceRepo:    invoiceRepo,
		CommissionRepo: commissionRepo,
		UserRepo:       userRepo,
		ClientRepo:     clientRepo,
		SubmissionRepo: submissionRepo,
		SettingRepo:    settingRepo,
		ExpenseRepo:    expenseRepo,
		NotifUC:        notificationUC,
		RoleRepo:       roleRepo,
	})

	teleUC := usecase.NewTelemarketingUsecase(usecase.TelemarketingUsecaseDeps{
		FormRepo:      teleFormRepo,
		MeetingRepo:   teleMeetingRepo,
		AgreementRepo: teleAgreementRepo,
		UserRepo:      userRepo,
		RoleRepo:      roleRepo,
		NotifUC:       notificationUC,
		WASender:      waSender,
	})

	bizDevUC := usecase.NewBizDevUsecase(usecase.BizDevUsecaseDeps{
		SubmissionRepo: submissionRepo,
		ClientRepo:     clientRepo,
		InvoiceRepo:    invoiceRepo,
		TargetRepo:     companyTargetRepo,
		UserRepo:       userRepo,
	})

	// 7. Setup Router & Handlers
	r := gin.Default()

	// CORS Middleware — supports multiple frontend origins
	// Access-Control-Allow-Origin cannot be wildcard when credentials are used.
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:5174"}
	if envOrigins := os.Getenv("FRONTEND_URL"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	}
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		for _, ao := range allowedOrigins {
			if strings.TrimSpace(ao) == origin {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Existing handlers
	httpDelivery.NewAuthHandler(r, authUC)
	httpDelivery.NewSubmissionHandler(r, submissionUC)
	httpDelivery.NewImportHandler(r, importUC)
	httpDelivery.NewExportHandler(r, exportUC)
	httpDelivery.NewPaymentHandler(r, paymentUC)
	httpDelivery.NewNotificationHandler(r, notificationUC)
	httpDelivery.NewCMSHandler(r, cmsUC)
	httpDelivery.NewClientHandler(r, clientCRUDUC, userRepo)
	httpDelivery.NewDashboardHandler(r, dashboardUC)

	// New handlers
	httpDelivery.NewFormConfigHandler(r, formConfigUC)
	httpDelivery.NewGeographyHandler(r, geographyUC)
	httpDelivery.NewTrainingHandler(r, trainingUC)
	httpDelivery.NewConsultantHandler(r, consultantUC)
	httpDelivery.NewBillingHandler(r, billingUC, paymentUC, invoiceRepo)
	httpDelivery.NewUserManagementHandler(r, userMgmtUC)
	httpDelivery.NewBillingConfigHandler(r, billingConfigUC)
	httpDelivery.NewMediaHandler(r)
	httpDelivery.NewSystemSettingHandler(r, settingUC)
	httpDelivery.NewDocumentHandler(r, documentUC)
	httpDelivery.NewPromotionHandler(r, promotionUC)
	httpDelivery.NewSPHHandler(r, sphUC)
	httpDelivery.NewFinanceHandler(r, financeUC)
	httpDelivery.NewBizDevHandler(r, bizDevUC)
	httpDelivery.NewTelemarketingHandler(r, teleUC)

	// Static files
	r.Static("/uploads", "./uploads")
	r.Static("/paymentproof", "./paymentproof")
	r.Static("/consultant-docs", "./consultant")
	r.Static("/templates", "./templates")

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// /reset-db hanya tersedia di mode development (non-production)
	if os.Getenv("APP_ENV") != "production" {
		r.GET("/reset-db", func(c *gin.Context) {
			// Tambahan: validasi secret key agar tidak sembarang orang bisa trigger
			secret := os.Getenv("RESET_DB_SECRET")
			if secret != "" && c.Query("secret") != secret {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
				return
			}
			if err := seeder.PerformResetAndSeed(db); err != nil {
				c.JSON(500, gin.H{
					"status":  "error",
					"message": err.Error(),
				})
				return
			}
			c.JSON(200, gin.H{
				"status":  "success",
				"message": "Database successfully wiped and seeded like new!",
			})
		})
	}

	// 8. Background: cleanup expired telemarketing accounts every 24 hours
	go func() {
		for {
			time.Sleep(24 * time.Hour)
			log.Println("Running telemarketing expired account cleanup...")
			if err := teleUC.CleanupExpiredAccounts(); err != nil {
				log.Printf("Cleanup error: %v", err)
			}
		}
	}()

	// 9. Run
	r.Run(":8080")
}
