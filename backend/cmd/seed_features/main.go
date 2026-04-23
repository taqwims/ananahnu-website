package main

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"ananahnu/internal/domain"
	"ananahnu/pkg/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}

	log.Println("=== Running Feature Data Seeder ===")

	// --- Geography ---
	seedGeography(db)

	// --- Roles (ensure new roles exist) ---
	newRoles := []string{"KOORDINATOR", "ADMIN_PELATIHAN", "ADMIN_KEUANGAN", "DIRECTOR", "HALAL_KONSULTAN", "QC_OFFICER", "DRAFTER", "CLIENT"}
	for _, name := range newRoles {
		var r domain.Role
		db.FirstOrCreate(&r, domain.Role{Name: name})
	}
	log.Println("✓ Roles seeded")

	// --- Sample Users for new roles ---
	seedUsers(db)

	// --- Training ---
	seedTraining(db)

	// --- Payment Config ---
	seedPaymentConfig(db)

	log.Println("=== Seeder Complete! ===")
}

func seedGeography(db *gorm.DB) {
	provinces := []string{
		"DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur",
		"Banten", "DI Yogyakarta",
	}

	regencyMap := map[string][]string{
		"DKI Jakarta": {"Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"},
		"Jawa Barat":  {"Kota Bandung", "Kota Bogor", "Kota Bekasi", "Kota Depok", "Kabupaten Bandung"},
		"Jawa Tengah": {"Kota Semarang", "Kota Solo", "Kabupaten Kudus", "Kabupaten Pekalongan"},
		"Jawa Timur":  {"Kota Surabaya", "Kota Malang", "Kabupaten Sidoarjo", "Kabupaten Gresik"},
		"Banten":      {"Kota Tangerang", "Kota Tangerang Selatan", "Kota Serang", "Kabupaten Tangerang"},
		"DI Yogyakarta": {"Kota Yogyakarta", "Kabupaten Sleman", "Kabupaten Bantul", "Kabupaten Gunung Kidul"},
	}

	districtMap := map[string][]string{
		"Jakarta Pusat":   {"Menteng", "Gambir", "Tanah Abang", "Senen"},
		"Jakarta Selatan": {"Kebayoran Baru", "Tebet", "Pancoran", "Mampang Prapatan"},
		"Kota Bandung":    {"Coblong", "Bandung Wetan", "Cicendo", "Sumur Bandung"},
		"Kota Surabaya":   {"Gubeng", "Tambaksari", "Wonokromo", "Rungkut"},
	}

	for _, pName := range provinces {
		var prov domain.Province
		db.FirstOrCreate(&prov, domain.Province{Name: pName})

		if regs, ok := regencyMap[pName]; ok {
			for _, rName := range regs {
				var reg domain.Regency
				db.FirstOrCreate(&reg, domain.Regency{ProvinceID: prov.ID, Name: rName})

				// Seed billing rates for each regency
				for _, svc := range []string{"REGULER", "SELF_DECLARE"} {
					var rate domain.BillingRate
					result := db.Where("regency_id = ? AND service_type = ?", reg.ID, svc).First(&rate)
					if result.Error != nil {
						amount := 3500000.0
						if svc == "SELF_DECLARE" {
							amount = 1500000.0
						}
						db.Create(&domain.BillingRate{
							ServiceType: svc,
							RegencyID:   reg.ID,
							Amount:      amount,
							Description: "Tarif " + svc + " - " + rName,
						})
					}
				}

				// Seed districts
				if dists, ok2 := districtMap[rName]; ok2 {
					for _, dName := range dists {
						var dist domain.District
						db.FirstOrCreate(&dist, domain.District{RegencyID: reg.ID, Name: dName})
					}
				}
			}
		}
	}

	log.Println("✓ Geography + billing rates seeded (6 provinces, ~26 regencies, ~16 districts)")
}

func seedUsers(db *gorm.DB) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	type userSeed struct {
		Email    string
		Username string
		FullName string
		RoleName string
	}

	users := []userSeed{
		{"admin@ananahnu.id", "admin", "Super Admin", "DIRECTOR"},
		{"koordinator@ananahnu.id", "koordinator", "Ahmad Koordinator", "KOORDINATOR"},
		{"pelatihan@ananahnu.id", "adm_pelatihan", "Siti Admin Pelatihan", "ADMIN_PELATIHAN"},
		{"keuangan@ananahnu.id", "adm_keuangan", "Budi Admin Keuangan", "ADMIN_KEUANGAN"},
		{"konsultan1@ananahnu.id", "konsultan1", "Dewi Konsultan", "HALAL_KONSULTAN"},
		{"konsultan2@ananahnu.id", "konsultan2", "Eko Konsultan", "HALAL_KONSULTAN"},
		{"qc@ananahnu.id", "qcofficer", "Rina QC Officer", "QC_OFFICER"},
		{"drafter@ananahnu.id", "drafter", "Hadi Drafter", "DRAFTER"},
	}

	var koordinatorID uuid.UUID

	for _, u := range users {
		var existing domain.User
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err == nil {
			if u.RoleName == "KOORDINATOR" {
				koordinatorID = existing.ID
			}
			continue
		}

		var role domain.Role
		db.Where("name = ?", u.RoleName).First(&role)

		newUser := domain.User{
			Email:        u.Email,
			Username:     u.Username,
			FullName:     u.FullName,
			PasswordHash: string(hashed),
			RoleID:       role.ID,
		}
		db.Create(&newUser)

		if u.RoleName == "KOORDINATOR" {
			koordinatorID = newUser.ID
		}
	}

	// Link konsultans to koordinator
	if koordinatorID != uuid.Nil {
		var konsultans []domain.User
		db.Where("email IN ?", []string{"konsultan1@ananahnu.id", "konsultan2@ananahnu.id"}).Find(&konsultans)
		for _, k := range konsultans {
			db.Model(&k).Update("leader_id", koordinatorID)
		}
	}

	log.Println("✓ Users seeded (koordinator, admin pelatihan, admin keuangan, 2 konsultan, qc, drafter)")

	// Seed consultant profiles
	seedConsultantProfiles(db)
}

func seedConsultantProfiles(db *gorm.DB) {
	var konsultan1 domain.User
	if err := db.Where("email = ?", "konsultan1@ananahnu.id").First(&konsultan1).Error; err != nil {
		return
	}

	var existing domain.ConsultantProfile
	if err := db.Where("user_id = ?", konsultan1.ID).First(&existing).Error; err != nil {
		db.Create(&domain.ConsultantProfile{
			UserID:         konsultan1.ID,
			KTPURL:         "https://example.com/ktp-dewi.pdf",
			Photo3x4URL:    "https://example.com/foto-dewi.jpg",
			IjazahSTAURL:   "https://example.com/ijazah-dewi.pdf",
			BankAccountURL: "https://example.com/rekening-dewi.pdf",
			NPWPURL:        "https://example.com/npwp-dewi.pdf",
			IsVerified:     true,
		})
	}

	var konsultan2 domain.User
	if err := db.Where("email = ?", "konsultan2@ananahnu.id").First(&konsultan2).Error; err != nil {
		return
	}

	var existing2 domain.ConsultantProfile
	if err := db.Where("user_id = ?", konsultan2.ID).First(&existing2).Error; err != nil {
		db.Create(&domain.ConsultantProfile{
			UserID:         konsultan2.ID,
			KTPURL:         "https://example.com/ktp-eko.pdf",
			Photo3x4URL:    "https://example.com/foto-eko.jpg",
			IjazahSTAURL:   "",
			BankAccountURL: "",
			IsVerified:     false,
		})
	}

	log.Println("✓ Consultant profiles seeded (1 verified, 1 incomplete)")
}

func seedTraining(db *gorm.DB) {
	var existing domain.Training
	if err := db.Where("title = ?", "Pelatihan Penyelia Halal Batch 1").First(&existing).Error; err == nil {
		return
	}

	training := domain.Training{
		Title:       "Pelatihan Penyelia Halal Batch 1",
		Description: "Pelatihan dasar untuk calon penyelia halal yang akan bertugas di lapangan.",
		StartDate:   time.Now().AddDate(0, 0, 7),
		EndDate:     time.Now().AddDate(0, 0, 10),
		Location:    "Jakarta Convention Center",
	}
	db.Create(&training)

	training2 := domain.Training{
		Title:       "Workshop Audit Internal Halal",
		Description: "Workshop lanjutan tentang prosedur audit internal sertifikasi halal.",
		StartDate:   time.Now().AddDate(0, 1, 0),
		EndDate:     time.Now().AddDate(0, 1, 3),
		Location:    "Hotel Grand Mercure, Bandung",
	}
	db.Create(&training2)

	// Add participants
	var konsultan1, konsultan2 domain.User
	db.Where("email = ?", "konsultan1@ananahnu.id").First(&konsultan1)
	db.Where("email = ?", "konsultan2@ananahnu.id").First(&konsultan2)

	if konsultan1.ID != uuid.Nil {
		db.Create(&domain.TrainingParticipant{
			TrainingID: training.ID,
			UserID:     konsultan1.ID,
			Status:     "LULUS",
		})
		db.Create(&domain.TrainingParticipant{
			TrainingID: training2.ID,
			UserID:     konsultan1.ID,
			Status:     "PESERTA",
		})
	}
	if konsultan2.ID != uuid.Nil {
		db.Create(&domain.TrainingParticipant{
			TrainingID: training.ID,
			UserID:     konsultan2.ID,
			Status:     "PESERTA",
		})
	}

	log.Println("✓ Training seeded (2 trainings, 3 participants)")
}

func seedPaymentConfig(db *gorm.DB) {
	configs := []domain.PaymentConfig{
		{ServiceType: "REGULER", ItemName: "Biaya Pendampingan", Amount: 2500000, IsActive: true},
		{ServiceType: "REGULER", ItemName: "Biaya Sidang Fatwa", Amount: 500000, IsActive: true},
		{ServiceType: "REGULER", ItemName: "Biaya Administrasi", Amount: 250000, IsActive: true},
		{ServiceType: "SELF_DECLARE", ItemName: "Biaya Self Declare", Amount: 1000000, IsActive: true},
		{ServiceType: "SELF_DECLARE", ItemName: "Biaya Verifikasi", Amount: 500000, IsActive: true},
	}

	for _, cfg := range configs {
		var existing domain.PaymentConfig
		result := db.Where("service_type = ? AND item_name = ?", cfg.ServiceType, cfg.ItemName).First(&existing)
		if result.Error != nil {
			db.Create(&cfg)
		}
	}

	log.Println("✓ Payment configs seeded (3 REGULER, 2 SELF_DECLARE)")
}
