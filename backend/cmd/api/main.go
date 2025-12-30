package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"github.com/joho/godotenv"
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
		&domain.Role{},
		&domain.Permission{},
		&domain.RolePermission{},
		&domain.User{},
		&domain.PasswordResetToken{},
		&domain.Client{},
		&domain.Submission{},
		&domain.SubmissionFile{},
		&domain.Payment{},
		&domain.Notification{},
		&domain.KPIPerformance{},
		&domain.AuditLog{},
		&domain.ContentBlock{},
		&domain.News{},
		&domain.Affiliate{},
		&domain.CertifiedProduct{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("Migration successful.")

	// 4. Seed Roles (Idempotent)
	log.Println("Seeding Roles...")
	roles := []string{"DIRECTOR", "MANAGER", "QC_OFFICER", "DRAFTER", "HALAL_KONSULTAN", "MARKETING", "VERIFIKATOR", "CLIENT", "FINANCE"}
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
	
	// Services
	emailSender := email.NewGmailSender()
	midtransGateway := midtrans.NewMidtransGateway()

	// 6. Setup Usecases
	authUC := usecase.NewAuthUsecase(userRepo, roleRepo, clientRepo, tokenRepo, emailSender)
	submissionUC := usecase.NewSubmissionWorkflowUsecase(submissionRepo, roleRepo, auditRepo)
	importUC := usecase.NewImportUsecase(clientRepo)
	exportUC := usecase.NewExportUsecase(clientRepo)
	paymentUC := usecase.NewPaymentUsecase(paymentRepo, submissionRepo, midtransGateway)
	notificationUC := usecase.NewNotificationUsecase(notifRepo)
	cmsUC := usecase.NewCMSUsecase(cmsRepo)
	clientCRUDUC := usecase.NewClientUsecase(clientRepo)
	dashboardUC := usecase.NewDashboardUsecase(submissionRepo, clientRepo)

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

	httpDelivery.NewAuthHandler(r, authUC)
	httpDelivery.NewSubmissionHandler(r, submissionUC)
	httpDelivery.NewImportHandler(r, importUC)
	httpDelivery.NewExportHandler(r, exportUC)
	httpDelivery.NewPaymentHandler(r, paymentUC)
	httpDelivery.NewNotificationHandler(r, notificationUC)
	httpDelivery.NewCMSHandler(r, cmsUC)
	httpDelivery.NewClientHandler(r, clientCRUDUC)
	httpDelivery.NewDashboardHandler(r, dashboardUC)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// 8. Run
	r.Run(":8080")
}
