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

	"github.com/google/uuid"
	"gorm.io/gorm"
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
	// Add invoice type column for DP/PELUNASAN/FULL split payment support
	_ = db.Exec("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'FULL'")
	// Add form_field_config_id column to billing_components table for optional fees connected to form fields
	_ = db.Exec("ALTER TABLE billing_components ADD COLUMN IF NOT EXISTS form_field_config_id BIGINT")

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
		&domain.RoleSchemeMapping{},
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
		// Operational Manager
		&domain.LPHPartner{},
		&domain.AuditorPartner{},
		&domain.DailyQuota{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("Migration successful.")

	// 4. Seed Roles (Idempotent)
	log.Println("Seeding Roles...")
	roles := []string{
		"DIRECTOR", "MANAGER", "QC_OFFICER", "VERIFIKATOR", "DRAFTER",
		"HALAL_ADVISOR", "MARKETING",
		"CLIENT",
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

	// 4.6 Seed Operational Manager & Staff Users (Idempotent)
	seedOperationalData(db)

	// 4.7 Seed Sample News Articles for SEO (Idempotent)
	_ = seeder.SeedNewsData(db)

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
	promotionRepo := repository.NewPromotionRepository(db)
	operationalRepo := repository.NewOperationalRepository(db)

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
		ConsultantRepo: consultantRepo,
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
		ConfigRepo:     formConfigRepo,
		ValueRepo:      formValueRepo,
		SubmissionRepo: submissionRepo,
	})
	geographyUC := usecase.NewGeographyUsecase(usecase.GeographyUsecaseDeps{
		GeoRepo:  geoRepo,
		RateRepo: billingRateRepo,
	})
	trainingUC := usecase.NewTrainingUsecase(usecase.TrainingUsecaseDeps{
		TrainingRepo:    trainingRepo,
		ParticipantRepo: participantRepo,
		UserRepo:        userRepo,
		PromotionRepo:   promotionRepo,
		CommissionRepo:  commissionRepo,
		RoleRepo:        roleRepo,
	})
	consultantUC := usecase.NewConsultantUsecase(usecase.ConsultantUsecaseDeps{
		ProfileRepo:    consultantRepo,
		UserRepo:       userRepo,
		SubmissionRepo: submissionRepo,
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
		TeleFormRepo:      teleFormRepo,
		PaymentConfigRepo: paymentConfigRepo,
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
		SubmissionRepo:    submissionRepo,
		SettingRepo:       settingRepo,
		TeleAgreementRepo: teleAgreementRepo,
		InvoiceRepo:       invoiceRepo,
		BillingConfigRepo: billingConfigRepo,
	})

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
		FormRepo:          teleFormRepo,
		MeetingRepo:       teleMeetingRepo,
		AgreementRepo:     teleAgreementRepo,
		UserRepo:          userRepo,
		RoleRepo:          roleRepo,
		NotifUC:           notificationUC,
		WASender:          waSender,
		ClientRepo:        clientRepo,
		SubmissionRepo:    submissionRepo,
		BillingConfigRepo: billingConfigRepo,
	})

	bizDevUC := usecase.NewBizDevUsecase(usecase.BizDevUsecaseDeps{
		SubmissionRepo: submissionRepo,
		ClientRepo:     clientRepo,
		InvoiceRepo:    invoiceRepo,
		TargetRepo:     companyTargetRepo,
		UserRepo:       userRepo,
	})

	operationalUC := usecase.NewOperationalUsecase(usecase.OperationalUsecaseDeps{
		Repo:        operationalRepo,
		SubRepo:     submissionRepo,
		AuditRepo:   auditRepo,
		UserRepo:    userRepo,
		NotifUC:     notificationUC,
		SettingRepo: settingRepo,
	})

	// 7. Setup Router & Handlers
	r := gin.Default()

	// CORS Middleware — supports multiple frontend origins
	// Access-Control-Allow-Origin cannot be wildcard when credentials are used.
	var allowedOrigins []string
	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	} else if envOrigins := os.Getenv("FRONTEND_URL"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	} else if envOrigins := os.Getenv("APP_FRONTEND_URL"); envOrigins != "" {
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
	httpDelivery.NewFormConfigHandler(r, formConfigUC, submissionUC)
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
	httpDelivery.NewOperationalHandler(r, operationalUC)

	// Static files
	r.Static("/uploads", "./uploads")
	r.Static("/paymentproof", "./paymentproof")
	r.Static("/consultant-docs", "./consultant")
	r.Static("/templates", "./templates")
	r.Static("/swagger", "./docs")

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
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

func seedOperationalData(db *gorm.DB) {
	log.Println("Seeding Operational Users, Partners & Submissions...")
	hashed, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// Roles
	var managerRole, qcoRole, drafterRole, verifRole, advisorRole domain.Role
	db.Where("name = ?", "MANAGER").First(&managerRole)
	db.Where("name = ?", "QC_OFFICER").First(&qcoRole)
	db.Where("name = ?", "DRAFTER").First(&drafterRole)
	db.Where("name = ?", "VERIFIKATOR").First(&verifRole)
	db.Where("name = ?", "HALAL_ADVISOR").First(&advisorRole)

	// 1. Manager
	if managerRole.ID != 0 {
		var mgr domain.User
		if err := db.Where("email = ?", "operasional@halalcore.id").First(&mgr).Error; err != nil {
			db.Create(&domain.User{
				Email:        "operasional@halalcore.id",
				Username:     "manajer_operasional",
				FullName:     "Manajer Operasional",
				Phone:        "081234567800",
				PasswordHash: string(hashed),
				RoleID:       managerRole.ID,
				ReferralCode: "REF-MGR-OPS",
			})
		}
	}

	// 2. QCO Staff
	var qco1, qco2, qco3 domain.User
	if qcoRole.ID != 0 {
		if err := db.Where("email = ?", "qco1@ananahnu.id").First(&qco1).Error; err != nil {
			qco1 = domain.User{
				Email:        "qco1@ananahnu.id",
				Username:     "sarah_qco",
				FullName:     "Sarah Fatimah, S.TP",
				Phone:        "08122334455",
				PasswordHash: string(hashed),
				RoleID:       qcoRole.ID,
				ReferralCode: "REF-QCO-01",
			}
			db.Create(&qco1)
		}
		if err := db.Where("email = ?", "qco2@ananahnu.id").First(&qco2).Error; err != nil {
			qco2 = domain.User{
				Email:        "qco2@ananahnu.id",
				Username:     "dimas_qco",
				FullName:     "Dimas Wicaksono, S.Si",
				Phone:        "08133445566",
				PasswordHash: string(hashed),
				RoleID:       qcoRole.ID,
				ReferralCode: "REF-QCO-02",
			}
			db.Create(&qco2)
		}
		if err := db.Where("email = ?", "qco3@ananahnu.id").First(&qco3).Error; err != nil {
			qco3 = domain.User{
				Email:        "qco3@ananahnu.id",
				Username:     "nadia_qco",
				FullName:     "Nadia Putri, S.Gz",
				Phone:        "08144556677",
				PasswordHash: string(hashed),
				RoleID:       qcoRole.ID,
				ReferralCode: "REF-QCO-03",
			}
			db.Create(&qco3)
		}
	}

	// 3. Drafter Staff (HDO)
	var d1, d2, d3 domain.User
	if drafterRole.ID != 0 {
		if err := db.Where("email = ?", "drafter1@ananahnu.id").First(&d1).Error; err != nil {
			d1 = domain.User{
				Email:        "drafter1@ananahnu.id",
				Username:     "hendra_drafter",
				FullName:     "Hendra Pratama",
				Phone:        "08155667788",
				PasswordHash: string(hashed),
				RoleID:       drafterRole.ID,
				ReferralCode: "REF-DFT-01",
			}
			db.Create(&d1)
		}
		if err := db.Where("email = ?", "drafter2@ananahnu.id").First(&d2).Error; err != nil {
			d2 = domain.User{
				Email:        "drafter2@ananahnu.id",
				Username:     "ayu_drafter",
				FullName:     "Ayu Lestari",
				Phone:        "08166778899",
				PasswordHash: string(hashed),
				RoleID:       drafterRole.ID,
				ReferralCode: "REF-DFT-02",
			}
			db.Create(&d2)
		}
		if err := db.Where("email = ?", "drafter3@ananahnu.id").First(&d3).Error; err != nil {
			d3 = domain.User{
				Email:        "drafter3@ananahnu.id",
				Username:     "budi_drafter",
				FullName:     "Budi Setiawan",
				Phone:        "08177889900",
				PasswordHash: string(hashed),
				RoleID:       drafterRole.ID,
				ReferralCode: "REF-DFT-03",
			}
			db.Create(&d3)
		}
	}

	// 4. Verifikator Staff (Self Declare)
	var v1, v2 domain.User
	if verifRole.ID != 0 {
		if err := db.Where("email = ?", "verifikator1@ananahnu.id").First(&v1).Error; err != nil {
			v1 = domain.User{
				Email:        "verifikator1@ananahnu.id",
				Username:     "nurul_verif",
				FullName:     "Nurul Hidayah, S.Pd",
				Phone:        "08188990011",
				PasswordHash: string(hashed),
				RoleID:       verifRole.ID,
				ReferralCode: "REF-VRF-01",
			}
			db.Create(&v1)
		}
		if err := db.Where("email = ?", "verifikator2@ananahnu.id").First(&v2).Error; err != nil {
			v2 = domain.User{
				Email:        "verifikator2@ananahnu.id",
				Username:     "rizky_verif",
				FullName:     "Rizky Ramadhan",
				Phone:        "08199001122",
				PasswordHash: string(hashed),
				RoleID:       verifRole.ID,
				ReferralCode: "REF-VRF-02",
			}
			db.Create(&v2)
		}
	}

	// 5. Halal Advisor
	var adv1, adv2 domain.User
	if advisorRole.ID != 0 {
		if err := db.Where("email = ?", "advisor1@ananahnu.id").First(&adv1).Error; err != nil {
			adv1 = domain.User{
				Email:        "advisor1@ananahnu.id",
				Username:     "siti_advisor",
				FullName:     "Siti Aisyah",
				Phone:        "081234567890",
				PasswordHash: string(hashed),
				RoleID:       advisorRole.ID,
				ReferralCode: "REF-ADV-01",
			}
			db.Create(&adv1)
		}
		if err := db.Where("email = ?", "advisor2@ananahnu.id").First(&adv2).Error; err != nil {
			adv2 = domain.User{
				Email:        "advisor2@ananahnu.id",
				Username:     "fauzan_advisor",
				FullName:     "Fauzan Arifin",
				Phone:        "081298765432",
				PasswordHash: string(hashed),
				RoleID:       advisorRole.ID,
				ReferralCode: "REF-ADV-02",
			}
			db.Create(&adv2)
		}
	}

	// 6. Seed LPH Partners & Auditors
	var lphCount int64
	db.Model(&domain.LPHPartner{}).Count(&lphCount)
	if lphCount == 0 {
		lph1 := domain.LPHPartner{
			Name:   "LPH LPPOM MUI",
			Code:   "LPH-001",
			Region: "Nasional",
			Phone:  "021-8796291",
			Email:  "info@halalmui.org",
			Status: "Aktif",
		}
		lph2 := domain.LPHPartner{
			Name:   "LPH Sucofindo",
			Code:   "LPH-002",
			Region: "Nasional",
			Phone:  "021-7983666",
			Email:  "halal@sucofindo.co.id",
			Status: "Aktif",
		}
		lph3 := domain.LPHPartner{
			Name:   "LPH Surveyor Indonesia",
			Code:   "LPH-003",
			Region: "Nasional",
			Phone:  "021-5265526",
			Email:  "halal@ptsi.co.id",
			Status: "Aktif",
		}
		lph4 := domain.LPHPartner{
			Name:   "LPH PERSIS",
			Code:   "LPH-004",
			Region: "Jawa Barat",
			Phone:  "022-4201234",
			Email:  "info@lphpersis.or.id",
			Status: "Aktif",
		}
		db.Create(&lph1)
		db.Create(&lph2)
		db.Create(&lph3)
		db.Create(&lph4)

		// Seed Auditors
		db.Create(&domain.AuditorPartner{
			Name:    "Dr. Ir. Budi Santoso, M.Si",
			Code:    "AUD-001",
			LPHID:   &lph1.ID,
			LPHName: lph1.Name,
			Phone:   "081234567890",
			Email:   "budi.santoso@auditor.id",
			Status:  "Aktif",
		})
		db.Create(&domain.AuditorPartner{
			Name:    "Rina Wijayanti, S.Si",
			Code:    "AUD-002",
			LPHID:   &lph1.ID,
			LPHName: lph1.Name,
			Phone:   "081298765432",
			Email:   "rina.wijaya@auditor.id",
			Status:  "Aktif",
		})
		db.Create(&domain.AuditorPartner{
			Name:    "Ahmad Fauzi, M.T",
			Code:    "AUD-003",
			LPHID:   &lph2.ID,
			LPHName: lph2.Name,
			Phone:   "081377889900",
			Email:   "ahmad.fauzi@auditor.id",
			Status:  "Aktif",
		})
		db.Create(&domain.AuditorPartner{
			Name:    "Dewi Sartika, S.TP",
			Code:    "AUD-004",
			LPHID:   &lph3.ID,
			LPHName: lph3.Name,
			Phone:   "081488990011",
			Email:   "dewi.sartika@auditor.id",
			Status:  "Aktif",
		})
		db.Create(&domain.AuditorPartner{
			Name:    "Rizky Fadlan, M.Si",
			Code:    "AUD-005",
			LPHID:   &lph4.ID,
			LPHName: lph4.Name,
			Phone:   "081599001122",
			Email:   "rizky.fadlan@auditor.id",
			Status:  "Aktif",
		})
	}

	// 7. Seed Daily Quota (SEHATI)
	var quotaCount int64
	db.Model(&domain.DailyQuota{}).Count(&quotaCount)
	if quotaCount == 0 {
		todayStr := time.Now().Format("2006-01-02")
		quotas := []domain.DailyQuota{
			{Date: todayStr, Region: "DKI Jakarta", Allocated: 3000, PrevUsed: 1942, UsedToday: 32, UpdatedBy: "Sistem"},
			{Date: todayStr, Region: "Jawa Barat", Allocated: 3500, PrevUsed: 2318, UsedToday: 41, UpdatedBy: "Sistem"},
			{Date: todayStr, Region: "Jawa Tengah", Allocated: 2500, PrevUsed: 1705, UsedToday: 28, UpdatedBy: "Sistem"},
			{Date: todayStr, Region: "Jawa Timur", Allocated: 2000, PrevUsed: 1384, UsedToday: 19, UpdatedBy: "Sistem"},
			{Date: todayStr, Region: "Banten", Allocated: 1500, PrevUsed: 765, UsedToday: 6, UpdatedBy: "Sistem"},
			{Date: todayStr, Region: "DI Yogyakarta", Allocated: 1000, PrevUsed: 420, UsedToday: 8, UpdatedBy: "Sistem"},
		}
		for _, q := range quotas {
			db.Create(&q)
		}
	}

	// 8. Seed Sample Submissions if needed
	var subCount int64
	db.Model(&domain.Submission{}).Count(&subCount)
	if subCount < 5 {
		seedSampleSubmissions(db, adv1.ID, qco1.ID, d1.ID)
	}

	log.Println("✓ Operational Users, Partners & Submissions seeded successfully.")
}

func seedSampleSubmissions(db *gorm.DB, advisorID, qcoID, drafterID uuid.UUID) {
	now := time.Now()
	deadline1 := now.AddDate(0, 0, 3)
	deadline2 := now.AddDate(0, 0, 5)
	auditDate := now.AddDate(0, 0, 14)

	clients := []struct {
		ClientName   string
		BusinessName string
		NIB          string
		Address      string
		Phone        string
		ServiceType  string
		SDType       string
		Status       domain.SubmissionStatus
		Priority     string
		Sihal        string
		LPH          string
		Auditor      string
		AssignedID   *uuid.UUID
		AuditTime    *time.Time
		Tracking     string
	}{
		{
			ClientName:   "Hj. Siti Mariam",
			BusinessName: "Dapoer Zuhra Snack & Bakery",
			NIB:          "0220108920191",
			Address:      "Jl. Buah Batu No. 120, Kota Bandung, Jawa Barat",
			Phone:        "081234567891",
			ServiceType:  "REGULER",
			Status:       domain.StatusQCOfficer,
			Priority:     "HIGH",
			Sihal:        "SH-2026-0801",
			AssignedID:   &qcoID,
			Tracking:     "HC-2608-00101",
		},
		{
			ClientName:   "Budi Hartono",
			BusinessName: "PT Pangan Sejahtera Mandiri",
			NIB:          "0220108920192",
			Address:      "Kawasan Industri Jababeka Blok C-12, Cikarang, Jawa Barat",
			Phone:        "081234567892",
			ServiceType:  "REGULER",
			Status:       domain.StatusQCReview,
			Priority:     "URGENT",
			Sihal:        "SH-2026-0802",
			AssignedID:   &qcoID,
			Tracking:     "HC-2608-00102",
		},
		{
			ClientName:   "Dedi Kurniawan",
			BusinessName: "Kenangan Cake & Pastry",
			NIB:          "0220108920193",
			Address:      "Jl. Malioboro No. 45, Yogyakarta",
			Phone:        "081234567893",
			ServiceType:  "REGULER",
			Status:       domain.StatusWaitingAssignment,
			Priority:     "NORMAL",
			Sihal:        "",
			Tracking:     "HC-2608-00103",
		},
		{
			ClientName:   "Ahmad Rifai",
			BusinessName: "Alam Segar Sari Buah",
			NIB:          "0220108920194",
			Address:      "Jl. Raya Tajur No. 88, Kota Bogor, Jawa Barat",
			Phone:        "081234567894",
			ServiceType:  "REGULER",
			Status:       domain.StatusDrafter,
			Priority:     "HIGH",
			Sihal:        "SH-2026-0804",
			AssignedID:   &drafterID,
			Tracking:     "HC-2608-00104",
		},
		{
			ClientName:   "Eko Prasetyo",
			BusinessName: "Keripik Singkong Barokah",
			NIB:          "0220108920195",
			Address:      "Desa Sukamaju RT 03/02, Kab. Garut, Jawa Barat",
			Phone:        "081234567895",
			ServiceType:  "SELF_DECLARE",
			SDType:       "GRATIS",
			Status:       domain.StatusVervalPendamping,
			Priority:     "NORMAL",
			Tracking:     "HC-2608-00105",
		},
		{
			ClientName:   "Ratna Sari",
			BusinessName: "Madu Murni Al-Barokah",
			NIB:          "0220108920196",
			Address:      "Jl. Ahmad Yani No. 12, Kota Surabaya, Jawa Timur",
			Phone:        "081234567896",
			ServiceType:  "SELF_DECLARE",
			SDType:       "MANDIRI",
			Status:       domain.StatusVervalPendamping,
			Priority:     "NORMAL",
			Tracking:     "HC-2608-00106",
		},
		{
			ClientName:   "Dr. Hendra Wijaya",
			BusinessName: "PT Boga Halal Perkasa",
			NIB:          "0220108920197",
			Address:      "Jl. Gatot Subroto No. 200, Jakarta Selatan",
			Phone:        "081234567897",
			ServiceType:  "REGULER",
			Status:       domain.StatusQCReview,
			Priority:     "HIGH",
			Sihal:        "SH-2026-0807",
			LPH:          "LPH LPPOM MUI",
			Auditor:      "Dr. Ir. Budi Santoso, M.Si",
			AuditTime:    &auditDate,
			Tracking:     "HC-2608-00107",
		},
		{
			ClientName:   "H. Slamet Riyadi",
			BusinessName: "Bakso Halal Juara",
			NIB:          "0220108920198",
			Address:      "Jl. Pahlawan No. 55, Kota Semarang, Jawa Tengah",
			Phone:        "081234567898",
			ServiceType:  "REGULER",
			Status:       domain.StatusSHTerbit,
			Priority:     "NORMAL",
			Sihal:        "ID33110002345670824",
			Tracking:     "HC-2608-00108",
		},
	}

	for _, c := range clients {
		client := domain.Client{
			NIB:             c.NIB,
			BusinessName:    c.BusinessName,
			ClientName:      c.ClientName,
			Address:         c.Address,
			Phone:           c.Phone,
			ServiceType:     c.ServiceType,
			SelfDeclareType: c.SDType,
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		if err := db.Create(&client).Error; err == nil {
			var advUID *uuid.UUID
			if advisorID != uuid.Nil {
				advUID = &advisorID
			}

			sub := domain.Submission{
				ClientID:          client.ID,
				Status:            c.Status,
				ServiceType:       c.ServiceType,
				SelfDeclareType:   c.SDType,
				Priority:          c.Priority,
				SihalNumber:       c.Sihal,
				LPHName:           c.LPH,
				AuditorName:       c.Auditor,
				AuditDate:         c.AuditTime,
				TargetDeadline:    &deadline1,
				AssignedDrafterID: c.AssignedID,
				ConsultantID:      advUID,
				TrackingNumber:    &c.Tracking,
				CreatedAt:         now,
				UpdatedAt:         now,
			}
			if c.Priority == "URGENT" {
				sub.TargetDeadline = &deadline2
			}
			db.Create(&sub)
		}
	}
}
