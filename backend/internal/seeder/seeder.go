package seeder

import (
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"ananahnu/internal/domain"
)

// PerformResetAndSeed wipes the schema, migrates, and seeds all default/sample data.
func PerformResetAndSeed(db *gorm.DB) error {
	log.Println("=== Starting Database Wiping & Resetting ===")

	// 1. Drop public schema
	if err := db.Exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;").Error; err != nil {
		return err
	}

	// 2. Auto Migrate
	err := db.AutoMigrate(
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
		&domain.FormFieldConfig{},
		&domain.FormFieldValue{},
		&domain.Province{},
		&domain.Regency{},
		&domain.District{},
		&domain.BillingRate{},
		&domain.Training{},
		&domain.TrainingParticipant{},
		&domain.ConsultantProfile{},
		&domain.Invoice{},
		&domain.PaymentConfig{},
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
	)
	if err != nil {
		return err
	}

	log.Println("✓ Migration complete after reset.")

	// 3. Seed Roles
	roles := []string{
		"DIRECTOR", "MANAGER", "QC_OFFICER", "DRAFTER",
		"HALAL_ADVISOR", "MARKETING", "AUDIT_MANAGER",
		"CLIENT", "FINANCE",
		"HALAL_MANAGER", "HALAL_DIRECTOR", "ADMIN_PELATIHAN", "ADMIN_KEUANGAN",
		"BUSINESS_DEVELOPMENT", "DRAFT_MANAGER",
		"TELEMARKETER", "VERIFIKATOR",
	}
	for _, name := range roles {
		db.Create(&domain.Role{Name: name})
	}
	log.Println("✓ Roles seeded.")

	// 4. Seed Admin User
	hashed, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	var directorRole domain.Role
	db.Where("name = ?", "DIRECTOR").First(&directorRole)

	admin := domain.User{
		Email:        "admin@ananahnu.id",
		Username:     "admin",
		FullName:     "Super Admin",
		PasswordHash: string(hashed),
		RoleID:       directorRole.ID,
		ReferralCode: removeVowels("admin_ref"), // Ensure unique non-empty referral code to prevent Postgres constraints
	}
	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Failed to create admin: %v", err)
	}

	// 5. Seed default form config
	SeedFormConfigs(db)

	// 6. Seed Geography
	seedGeography(db)

	// 7. Seed Users and Consultant Profiles
	seedUsers(db)

	// 8. Seed Trainings
	seedTraining(db)

	// 9. Seed Payment Configs
	seedPaymentConfig(db)

	// 10. Seed Kalkulator & Cost config components
	seedKalkulatorData(db)

	log.Println("=== Wiping & Seeding COMPLETED successfully! ===")
	return nil
}

// SeedFormConfigs seeds default form field configurations.
func SeedFormConfigs(db *gorm.DB) {
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
		{"REGULER", "surat_penawaran", "Template Surat Penawaran", "LINK", "Link template surat penawaran (opsional)", false, 4},
		// RECRUITMENT
		{"RECRUITMENT", "ktp", "KTP", "FILE_UPLOAD", "Upload KTP", true, 1},
		{"RECRUITMENT", "foto_3x4", "Foto 3x4 Latar Merah", "FILE_UPLOAD", "Upload foto 3x4 latar belakang merah", true, 2},
		{"RECRUITMENT", "ijazah_sta", "Ijazah STA", "FILE_UPLOAD", "Upload ijazah STA", true, 3},
		{"RECRUITMENT", "buku_rekening", "Buku Rekening", "FILE_UPLOAD", "Upload halaman depan buku rekening", true, 4},
		{"RECRUITMENT", "npwp", "NPWP", "FILE_UPLOAD", "Upload NPWP (opsional)", false, 5},
	}

	for _, d := range defaults {
		var existing domain.FormFieldConfig
		err := db.Where("form_type = ? AND field_key = ?", d.FormType, d.FieldKey).First(&existing).Error
		if err != nil { // Not found
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

	log.Println("✓ Geography & billing rates seeded.")
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
		{"halal_manager@ananahnu.id", "halal_manager", "Ahmad Halal Manager", "HALAL_MANAGER"},
		{"pelatihan@ananahnu.id", "adm_pelatihan", "Siti Admin Pelatihan", "ADMIN_PELATIHAN"},
		{"keuangan@ananahnu.id", "adm_keuangan", "Budi Admin Keuangan", "ADMIN_KEUANGAN"},
		{"advisor1@ananahnu.id", "advisor1", "Dewi Advisor", "HALAL_ADVISOR"},
		{"advisor2@ananahnu.id", "advisor2", "Eko Advisor", "HALAL_ADVISOR"},
		{"qc@ananahnu.id", "qcofficer", "Rina QC Officer", "QC_OFFICER"},
		{"drafter@ananahnu.id", "drafter", "Hadi Drafter", "DRAFTER"},
		{"telemarketer@ananahnu.id", "telemarketer", "telemarketer", "TELEMARKETER"},
		{"telemarketer2@ananahnu.id", "telemarketer2", "telemarketer2", "TELEMARKETER"},
	}

	var halalManagerID uuid.UUID

	for _, u := range users {
		var role domain.Role
		db.Where("name = ?", u.RoleName).First(&role)

		newUser := domain.User{
			Email:        u.Email,
			Username:     u.Username,
			FullName:     u.FullName,
			PasswordHash: string(hashed),
			RoleID:       role.ID,
			ReferralCode: removeVowels(u.Username), // Ensure unique vowel-free referral code
		}
		db.Create(&newUser)

		if u.RoleName == "HALAL_MANAGER" {
			halalManagerID = newUser.ID
		}
	}

	// Link advisors to halal_manager
	if halalManagerID != uuid.Nil {
		var advisors []domain.User
		db.Where("email IN ?", []string{"advisor1@ananahnu.id", "advisor2@ananahnu.id"}).Find(&advisors)
		for _, k := range advisors {
			db.Model(&k).Update("leader_id", halalManagerID)
		}
	}

	// Seed consultant profiles
	seedConsultantProfiles(db)
}

func seedConsultantProfiles(db *gorm.DB) {
	var advisor1 domain.User
	if err := db.Where("email = ?", "advisor1@ananahnu.id").First(&advisor1).Error; err == nil {
		db.Create(&domain.ConsultantProfile{
			UserID:         advisor1.ID,
			KTPURL:         "https://example.com/ktp-dewi.pdf",
			Photo3x4URL:    "https://example.com/foto-dewi.jpg",
			IjazahSTAURL:   "https://example.com/ijazah-dewi.pdf",
			BankAccountURL: "https://example.com/rekening-dewi.pdf",
			NPWPURL:        "https://example.com/npwp-dewi.pdf",
			IsVerified:     true,
		})
	}

	var advisor2 domain.User
	if err := db.Where("email = ?", "advisor2@ananahnu.id").First(&advisor2).Error; err == nil {
		db.Create(&domain.ConsultantProfile{
			UserID:         advisor2.ID,
			KTPURL:         "https://example.com/ktp-eko.pdf",
			Photo3x4URL:    "https://example.com/foto-eko.jpg",
			IjazahSTAURL:   "",
			BankAccountURL: "",
			IsVerified:     false,
		})
	}
}

func seedTraining(db *gorm.DB) {
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
	var advisor1, advisor2 domain.User
	db.Where("email = ?", "advisor1@ananahnu.id").First(&advisor1)
	db.Where("email = ?", "advisor2@ananahnu.id").First(&advisor2)

	if advisor1.ID != uuid.Nil {
		db.Create(&domain.TrainingParticipant{
			TrainingID: training.ID,
			UserID:     advisor1.ID,
			Status:     "LULUS",
		})
		db.Create(&domain.TrainingParticipant{
			TrainingID: training2.ID,
			UserID:     advisor1.ID,
			Status:     "PESERTA",
		})
	}
	if advisor2.ID != uuid.Nil {
		db.Create(&domain.TrainingParticipant{
			TrainingID: training.ID,
			UserID:     advisor2.ID,
			Status:     "PESERTA",
		})
	}
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
		db.Create(&cfg)
	}
}

func seedKalkulatorData(db *gorm.DB) {
	// 1. Seed Business Scales
	scales := []domain.BusinessScale{
		{Name: "Mikro"},
		{Name: "Kecil"},
		{Name: "Menengah"},
		{Name: "Besar"},
	}
	for i := range scales {
		db.Create(&scales[i])
	}

	// 2. Seed Business Types
	bTypes := []domain.BusinessType{
		{Name: "Makanan & Minuman"},
		{Name: "Kosmetik"},
		{Name: "Obat-obatan"},
	}
	for i := range bTypes {
		db.Create(&bTypes[i])
	}

	// 3. Seed Product Categories
	pCats := []domain.ProductCategory{
		{Name: "Camilan Ringan", BusinessTypeID: &bTypes[0].ID},
		{Name: "Minuman Kemasan", BusinessTypeID: &bTypes[0].ID},
		{Name: "Skincare", BusinessTypeID: &bTypes[1].ID},
	}
	for i := range pCats {
		db.Create(&pCats[i])
	}

	// 4. Seed Sales Schemes
	schemes := []domain.SalesScheme{
		{Name: "Direct Sale", Description: "Penjualan langsung ke klien"},
		{Name: "Partnership", Description: "Kerjasama pihak ketiga"},
	}
	for i := range schemes {
		db.Create(&schemes[i])
	}

	// Get DKI Jakarta ID if exists
	var dki domain.Province
	db.Where("name ILIKE ?", "%DKI JAKARTA%").First(&dki)
	var dkiId *int64
	if dki.ID != 0 {
		dkiId = &dki.ID
	}

	// 5. Seed Billing Components
	components := []domain.BillingComponent{
		{Name: "Biaya Registrasi Dasar", Category: "REGISTRASI", Type: "FIXED", BaseAmount: 500000, IsMandatory: true},
		{Name: "Biaya Audit LPH (Umum)", Category: "LPH", Type: "FIXED", BaseAmount: 3000000, IsMandatory: true},
		{Name: "Biaya Audit LPH (Khusus Jakarta)", Category: "LPH", Type: "FIXED", BaseAmount: 4500000, IsMandatory: true, ProvinceID: dkiId},
		{Name: "Biaya Sidang MUI", Category: "MUI", Type: "FIXED", BaseAmount: 1500000, IsMandatory: true},
		{Name: "Sertifikat BPJPH", Category: "BPJPH", Type: "FIXED", BaseAmount: 1000000, IsMandatory: true},
		{Name: "Sertifikat BPJPH (Khusus Kosmetik)", Category: "BPJPH", Type: "FIXED", BaseAmount: 2000000, IsMandatory: true, BusinessTypeID: &bTypes[1].ID},
		// Pendampingan per skala usaha
		{Name: "Jasa Pendampingan (Mikro)", Category: "PENDAMPINGAN", Type: "FIXED", BaseAmount: 3500000, IsMandatory: true, BusinessScaleID: &scales[0].ID},
		{Name: "Jasa Pendampingan (Kecil)", Category: "PENDAMPINGAN", Type: "FIXED", BaseAmount: 3500000, IsMandatory: true, BusinessScaleID: &scales[1].ID},
		{Name: "Jasa Pendampingan (Menengah)", Category: "PENDAMPINGAN", Type: "FIXED", BaseAmount: 5500000, IsMandatory: true, BusinessScaleID: &scales[2].ID},
		{Name: "Jasa Pendampingan (Besar)", Category: "PENDAMPINGAN", Type: "FIXED", BaseAmount: 10000000, IsMandatory: true, BusinessScaleID: &scales[3].ID},
	}
	for i := range components {
		db.Create(&components[i])
	}

	// 6. Seed Sales Scheme Prices
	prices := []domain.SalesSchemePrice{
		{SalesSchemeID: schemes[0].ID, BasePrice: 5000000, DataSource: "ORGANIK", Description: "Harga Dasar Umum", IsActive: true},
		{SalesSchemeID: schemes[0].ID, BusinessTypeID: &bTypes[0].ID, BusinessScaleID: &scales[0].ID, BasePrice: 3000000, DataSource: "ORGANIK", Description: "Promo Makanan Mikro", IsActive: true},
		{SalesSchemeID: schemes[0].ID, BusinessTypeID: &bTypes[1].ID, BasePrice: 8000000, DataSource: "ORGANIK", Description: "Harga Dasar Kosmetik", IsActive: true},
		{SalesSchemeID: schemes[1].ID, BasePrice: 4000000, DataSource: "MARKETING", Description: "Harga Dasar Partnership", IsActive: true},
	}
	for i := range prices {
		db.Create(&prices[i])
	}
}

func removeVowels(s string) string {
	var out []rune
	for _, r := range s {
		switch r {
		case 'a', 'i', 'u', 'e', 'o', 'A', 'I', 'U', 'E', 'O':
			// skip vowels
		default:
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
				out = append(out, r)
			}
		}
	}
	return strings.ToUpper(string(out))
}
