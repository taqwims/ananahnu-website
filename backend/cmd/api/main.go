package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"ananahnu/internal/domain"
	"ananahnu/pkg/database"
	"ananahnu/pkg/email"
	"ananahnu/pkg/midtrans"

	"ananahnu/internal/repository"
	"ananahnu/internal/usecase"
	httpDelivery "ananahnu/internal/delivery/http"
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
		&domain.ProductCategory{},
		&domain.BusinessScale{},
		&domain.HalalAgency{},
		&domain.BillingComponent{},
		&domain.SubmissionCostDetail{},
		&domain.CoordinatorRate{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("Migration successful.")

	// 4. Seed Roles (Idempotent)
	log.Println("Seeding Roles...")
	roles := []string{
		"DIRECTOR", "MANAGER", "QC_OFFICER", "DRAFTER",
		"HALAL_KONSULTAN", "MARKETING", "VERIFIKATOR",
		"CLIENT", "FINANCE",
		"KOORDINATOR", "ADMIN_PELATIHAN", "ADMIN_KEUANGAN",
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

	// 4.6 Seed Default Form Configs (Idempotent)
	seedFormConfigs(db)

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

	// Services
	emailSender := email.NewGmailSender()
	midtransGateway := midtrans.NewMidtransGateway()

	// 6. Setup Usecases
	authUC := usecase.NewAuthUsecase(userRepo, roleRepo, clientRepo, tokenRepo, emailSender)
	notificationUC := usecase.NewNotificationUsecase(notifRepo)
	submissionUC := usecase.NewSubmissionWorkflowUsecase(submissionRepo, clientRepo, roleRepo, auditRepo, userRepo, notificationUC, invoiceRepo, coordinatorRateRepo, formValueRepo)
	importUC := usecase.NewImportUsecase(clientRepo)
	exportUC := usecase.NewExportUsecase(clientRepo)
	paymentUC := usecase.NewPaymentUsecase(paymentRepo, submissionRepo, auditRepo, midtransGateway, invoiceRepo)
	cmsUC := usecase.NewCMSUsecase(cmsRepo)
	clientCRUDUC := usecase.NewClientUsecase(clientRepo)
	dashboardUC := usecase.NewDashboardUsecase(submissionRepo, clientRepo, auditRepo)
	formConfigUC := usecase.NewFormConfigUsecase(formConfigRepo, formValueRepo)
	geographyUC := usecase.NewGeographyUsecase(geoRepo, billingRateRepo)
	trainingUC := usecase.NewTrainingUsecase(trainingRepo, participantRepo)
	consultantUC := usecase.NewConsultantUsecase(consultantRepo)
	billingUC := usecase.NewBillingUsecase(invoiceRepo, paymentConfigRepo, billingRateRepo, userRepo, notificationUC)
	userMgmtUC := usecase.NewUserManagementUsecase(userRepo, roleRepo)
	billingConfigUC := usecase.NewBillingConfigUsecase(billingConfigRepo, coordinatorRateRepo)

	// 7. Setup Router & Handlers
	r := gin.Default()

	// CORS Middleware (simplified)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
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

	// Static files
	r.Static("/uploads", "./uploads")

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// 8. Run
	r.Run(":8080")
}

// seedFormConfigs seeds default form field configurations.
func seedFormConfigs(db *gorm.DB) {
	type seedEntry struct {
		FormType, FieldKey, FieldLabel, InputType, Description string
		IsRequired                                             bool
		SortOrder                                              int
	}

	defaults := []seedEntry{
		// SELF_DECLARE
		{"SELF_DECLARE", "nib", "NIB", "FILE_UPLOAD", "Upload dokumen NIB (opsional)", false, 1},
		{"SELF_DECLARE", "foto_produk", "Foto Produk", "FILE_UPLOAD", "Upload foto produk", true, 2},
		{"SELF_DECLARE", "ktp", "KTP", "FILE_UPLOAD", "Upload KTP penanggung jawab", true, 3},
		{"SELF_DECLARE", "foto_verval", "Foto Verval", "FILE_UPLOAD", "Upload foto verifikasi lapangan", true, 4},
		{"SELF_DECLARE", "foto_bersama_consultant", "Foto Bersama Consultant", "FILE_UPLOAD", "Upload foto bersama consultant", true, 5},
		{"SELF_DECLARE", "resep", "Resep", "FILE_UPLOAD", "Upload dokumen resep (opsional)", false, 6},
		{"SELF_DECLARE", "catatan_pph", "Catatan Bahan PPH", "TEXT", "Catatan bahan PPH (opsional)", false, 7},
		// REGULER
		{"REGULER", "data_kontrak", "Data Kontrak", "FILE_UPLOAD", "Upload data kontrak pendampingan", true, 1},
		{"REGULER", "bukti_bayar", "Bukti Bayar", "FILE_UPLOAD", "Upload bukti pembayaran", true, 2},
		{"REGULER", "template_kontrak", "Template Kontrak", "LINK", "Link template kontrak pendampingan", true, 3},
		// RECRUITMENT
		{"RECRUITMENT", "ktp", "KTP", "FILE_UPLOAD", "Upload KTP", true, 1},
		{"RECRUITMENT", "foto_3x4", "Foto 3x4 Latar Merah", "FILE_UPLOAD", "Upload foto 3x4 latar belakang merah", true, 2},
		{"RECRUITMENT", "ijazah_sta", "Ijazah STA", "FILE_UPLOAD", "Upload ijazah STA", true, 3},
		{"RECRUITMENT", "buku_rekening", "Buku Rekening", "FILE_UPLOAD", "Upload halaman depan buku rekening", true, 4},
		{"RECRUITMENT", "npwp", "NPWP", "FILE_UPLOAD", "Upload NPWP (opsional)", false, 5},
	}

	for _, d := range defaults {
		var existing domain.FormFieldConfig
		result := db.Where("form_type = ? AND field_key = ?", d.FormType, d.FieldKey).First(&existing)
		if result.Error != nil {
			// Not found, create it
			cfg := domain.FormFieldConfig{
				FormType:    d.FormType,
				FieldKey:    d.FieldKey,
				FieldLabel:  d.FieldLabel,
				InputType:   d.InputType,
				IsRequired:  d.IsRequired,
				SortOrder:   d.SortOrder,
				Description: d.Description,
			}
			db.Create(&cfg)
		}
	}

	log.Println("Form config seeding completed.")
}
