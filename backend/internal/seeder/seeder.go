package seeder

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"ananahnu/internal/domain"
)

// PerformResetAndSeed wipes the schema, migrates, and seeds all default/sample data.
func PerformResetAndSeed(db *gorm.DB) error {
	// Safety Check: block if running in production
	if os.Getenv("APP_ENV") == "production" {
		return fmt.Errorf("dangerous operation: resetting database is not allowed in production environment")
	}

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
		&domain.BusinessType{},
		&domain.ProductCategory{},
		&domain.BusinessScale{},
		&domain.BillingComponent{},
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
		"HALAL_ADVISOR", "MARKETING",
		"CLIENT",
		"HALAL_MANAGER", "HALAL_DIRECTOR", "ADMIN_PELATIHAN", "ADMIN_KEUANGAN",
		"BUSINESS_DEVELOPMENT",
		"TELEMARKETER",
	}
	for _, name := range roles {
		var role domain.Role
		if err := db.Where(&domain.Role{Name: name}).FirstOrCreate(&role).Error; err != nil {
			return fmt.Errorf("failed to seed role %s: %w", name, err)
		}
	}
	log.Println("✓ Roles seeded.")

	// 4. Seed Admin User
	adminPass := os.Getenv("ADMIN_INITIAL_PASSWORD")
	if adminPass == "" {
		adminPass = "password123"
	}
	hashed, _ := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
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
	if err := db.Where("email = ?", admin.Email).FirstOrCreate(&admin).Error; err != nil {
		log.Printf("Failed to create admin: %v", err)
	}

	// 5. Seed default form config
	SeedFormConfigs(db)

	// 6. Seed Geography
	seedGeography(db)

	// 9. Seed Payment Configs
	seedPaymentConfig(db)

	// 10. Seed Kalkulator & Cost config components
	seedKalkulatorData(db)

	// 11. Seed System Settings (Payment Gateway, Company info)
	seedSystemSettings(db)

	// 12. Seed Vouchers
	SeedVoucherData(db)

	log.Println("=== Wiping & Seeding COMPLETED successfully! ===")
	return nil
}

// SeedVoucherData seeds initial promotional vouchers and realistic usage history.
func SeedVoucherData(db *gorm.DB) {
	var count int64
	db.Model(&domain.Voucher{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding sample vouchers and usage analytics data...")
	now := time.Now()
	startDate := now.AddDate(0, -1, 0)
	endDate := now.AddDate(0, 3, 0)

	vouchers := []domain.Voucher{
		{
			Code:          "HALALBERKAH",
			Name:          "Promo Berkah Halal Indonesia",
			Description:   "Potongan langsung Rp 500.000 untuk pengajuan sertifikasi Halal Reguler",
			DiscountType:  domain.DiscountTypeFixedAmount,
			DiscountValue: 500000,
			MinSpend:      2500000,
			UsageLimit:    100,
			UsagePerUser:  1,
			UsedCount:     18,
			TotalDiscount: 9000000,
			ValidFrom:     startDate,
			ValidUntil:    endDate,
			IsActive:      true,
			Scope:         domain.VoucherScopeReguler,
			CreatedAt:     startDate,
			UpdatedAt:     now,
		},
		{
			Code:          "DISKON10",
			Name:          "Diskon 10% Semua Layanan",
			Description:   "Potongan 10% maksimal Rp 350.000 untuk semua layanan HalalCore",
			DiscountType:  domain.DiscountTypePercentage,
			DiscountValue: 10,
			MaxDiscount:   350000,
			MinSpend:      1000000,
			UsageLimit:    250,
			UsagePerUser:  2,
			UsedCount:     34,
			TotalDiscount: 10200000,
			ValidFrom:     startDate,
			ValidUntil:    endDate,
			IsActive:      true,
			Scope:         domain.VoucherScopeAll,
			CreatedAt:     startDate,
			UpdatedAt:     now,
		},
		{
			Code:          "UMKMBANGKIT",
			Name:          "Subsidi UMKM Mandiri",
			Description:   "Potongan biaya verifikasi Rp 250.000 untuk pengajuan Self Declare Mandiri",
			DiscountType:  domain.DiscountTypeFixedAmount,
			DiscountValue: 250000,
			MinSpend:      500000,
			UsageLimit:    50,
			UsagePerUser:  1,
			UsedCount:     12,
			TotalDiscount: 3000000,
			ValidFrom:     startDate,
			ValidUntil:    endDate,
			IsActive:      true,
			Scope:         domain.VoucherScopeSelfDeclare,
			CreatedAt:     startDate,
			UpdatedAt:     now,
		},
		{
			Code:          "TRAINING20",
			Name:          "Diskon Pelatihan Penyelia Halal 20%",
			Description:   "Potongan 20% pendaftaran pelatihan kompetensi penyelia dan auditor halal",
			DiscountType:  domain.DiscountTypePercentage,
			DiscountValue: 20,
			MaxDiscount:   400000,
			MinSpend:      750000,
			UsageLimit:    30,
			UsagePerUser:  1,
			UsedCount:     8,
			TotalDiscount: 2400000,
			ValidFrom:     startDate,
			ValidUntil:    endDate,
			IsActive:      true,
			Scope:         domain.VoucherScopeTraining,
			CreatedAt:     startDate,
			UpdatedAt:     now,
		},
		{
			Code:          "TELEVIP2026",
			Name:          "Voucher Eksklusif Telemarketing",
			Description:   "Diskon spesial Rp 750.000 untuk kesepakatan via Telemarketing",
			DiscountType:  domain.DiscountTypeFixedAmount,
			DiscountValue: 750000,
			MinSpend:      3500000,
			UsageLimit:    20,
			UsagePerUser:  1,
			UsedCount:     5,
			TotalDiscount: 3750000,
			ValidFrom:     startDate,
			ValidUntil:    endDate,
			IsActive:      true,
			Scope:         domain.VoucherScopeTele,
			CreatedAt:     startDate,
			UpdatedAt:     now,
		},
		{
			Code:          "FLASH50K",
			Name:          "Flash Deal 50 Ribu",
			Description:   "Potongan langsung Rp 50.000 tanpa minimum transaksi",
			DiscountType:  domain.DiscountTypeFixedAmount,
			DiscountValue: 50000,
			MinSpend:      0,
			UsageLimit:    500,
			UsagePerUser:  1,
			UsedCount:     42,
			TotalDiscount: 2100000,
			ValidFrom:     startDate,
			ValidUntil:    now.AddDate(0, 0, -2), // Expired
			IsActive:      true,
			Scope:         domain.VoucherScopeAll,
			CreatedAt:     startDate,
			UpdatedAt:     now,
		},
	}

	for i := range vouchers {
		db.Create(&vouchers[i])
	}

	// Seed Sample Usages
	sampleUsers := []struct {
		Name  string
		Email string
		Phone string
	}{
		{"Hj. Siti Mariam", "siti.mariam@gmail.com", "081234567891"},
		{"Budi Hartono", "budi.hartono@panganmakmur.com", "081234567892"},
		{"Dedi Kurniawan", "dedi.kenangan@gmail.com", "081234567893"},
		{"Ahmad Rifai", "ahmad.rifai@alamsegar.co.id", "081234567894"},
		{"Ratna Sari", "ratnasari@madubarokah.com", "081234567896"},
		{"Dr. Hendra Wijaya", "dr.hendra@bogahalal.com", "081234567897"},
		{"H. Slamet Riyadi", "slamet.bakso@gmail.com", "081234567898"},
		{"Fajar Nugroho", "fajar.nugroho@kulinernusantara.id", "081399887766"},
		{"Dewi Anggraini", "dewi.anggraini@sambalhalal.com", "081544332211"},
		{"Muhammad Yusuf", "yusuf.kopi@warkophalal.com", "081677889900"},
	}

	v1 := vouchers[0] // HALALBERKAH
	v2 := vouchers[1] // DISKON10
	v3 := vouchers[2] // UMKMBANGKIT

	for idx, u := range sampleUsers {
		daysAgo := (idx * 3) % 12
		usedDate := now.AddDate(0, 0, -daysAgo).Add(time.Duration(idx*45) * time.Minute)

		var chosenV domain.Voucher
		var orig float64
		var disc float64
		var refType string

		if idx%3 == 0 {
			chosenV = v1
			orig = 3500000
			disc = 500000
			refType = "INVOICE"
		} else if idx%3 == 1 {
			chosenV = v2
			orig = 2500000
			disc = 250000
			refType = "SUBMISSION"
		} else {
			chosenV = v3
			orig = 1000000
			disc = 250000
			refType = "INVOICE"
		}

		final := orig - disc
		refNo := fmt.Sprintf("INV-2026-0%d", 1000+idx)

		usage := domain.VoucherUsage{
			VoucherID:      chosenV.ID,
			VoucherCode:    chosenV.Code,
			UserName:       u.Name,
			UserEmail:      u.Email,
			UserPhone:      u.Phone,
			OriginalAmount: orig,
			DiscountAmount: disc,
			FinalAmount:    final,
			ReferenceType:  refType,
			ReferenceNo:    refNo,
			Status:         "APPLIED",
			UsedAt:         usedDate,
			CreatedAt:      usedDate,
		}
		db.Create(&usage)
	}

	log.Println("✓ Sample vouchers and usage analytics data seeded successfully.")
}

// SeedFormConfigs seeds default form field configurations.
func SeedFormConfigs(db *gorm.DB) {
	type seedEntry struct {
		FormType, FieldKey, FieldLabel, InputType, Description string
		IsRequired                                             bool
		SortOrder                                              int
		StepNumber                                             int
		StepName                                               string
	}

	defaults := []seedEntry{
		// CLIENT_SUBMISSION (Pengajuan Awal Klien - Card-based)
		// Step 1: Informasi Pelaku Usaha (Identitas & Kontak)
		{"CLIENT_SUBMISSION", "client_name", "Nama Penanggung Jawab", "TEXT", "Nama lengkap pemilik atau penanggung jawab usaha", true, 1, 1, "Informasi Pelaku Usaha"},
		{"CLIENT_SUBMISSION", "phone", "Nomor WhatsApp / Kontak", "TEXT", "Nomor kontak aktif penanggung jawab usaha", true, 2, 1, "Informasi Pelaku Usaha"},
		{"CLIENT_SUBMISSION", "nik", "NIK Penanggung Jawab", "TEXT", "Nomor Induk Kependudukan (16 digit)", true, 3, 1, "Informasi Pelaku Usaha"},
		{"CLIENT_SUBMISSION", "ktp", "Foto e-KTP Penanggung Jawab", "FILE_UPLOAD", "Unggah foto e-KTP penanggung jawab yang jelas", true, 4, 1, "Informasi Pelaku Usaha"},

		// Step 2: Informasi Usaha & Operasional (Penentuan Harga & Layanan)
		{"CLIENT_SUBMISSION", "business_name", "Nama Usaha / Merek Dagang", "TEXT", "Nama merek atau usaha yang diajukan", true, 1, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "nib", "Nomor Induk Berusaha (NIB)", "TEXT", "Nomor Induk Berusaha (13 digit) jika sudah ada", false, 2, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "nib_file", "Dokumen NIB (PDF/Foto)", "FILE_UPLOAD", "Unggah file berkas NIB dari OSS (opsional)", false, 3, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "business_scale", "Skala Usaha", "TEXT", "Skala usaha (Mikro, Kecil, Menengah, Besar)", true, 4, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "business_type", "Jenis Usaha", "TEXT", "Jenis atau bidang usaha", true, 5, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "product_category", "Kategori Produk", "TEXT", "Kategori produk yang didaftarkan", true, 6, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "product_name", "Nama Produk / Varian", "TEXT", "Nama atau daftar produk yang diajukan", true, 7, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "product_count", "Jumlah Produk", "NUMBER", "Total jumlah produk / item yang diajukan", true, 8, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "branch_count", "Jumlah Cabang / Pabrik", "NUMBER", "Jumlah outlet, cabang, atau fasilitas produksi", true, 9, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "address", "Alamat Fasilitas / Tempat Usaha", "TEXT", "Alamat lengkap fasilitas atau lokasi produksi usaha", true, 10, 2, "Informasi Usaha & Operasional"},
		{"CLIENT_SUBMISSION", "foto_produk", "Foto Produk / Brosur Kemasan", "FILE_UPLOAD", "Unggah foto produk atau kemasan berlabel", false, 11, 2, "Informasi Usaha & Operasional"},

		// Step 3: Penunjukan Pendamping Halal (Opsional)
		{"CLIENT_SUBMISSION", "advisor_code", "Nomor Registrasi Advisor", "TEXT", "Masukkan nomor registrasi / kode Halal Advisor jika sudah ada (opsional)", false, 1, 3, "Penunjukan Pendamping Halal"},

		// SELF_DECLARE
		{"SELF_DECLARE", "nib", "NIB", "FILE_UPLOAD", "Upload dokumen NIB (opsional)", false, 1, 1, "Step 1"},
		{"SELF_DECLARE", "foto_produk", "Foto Produk", "FILE_UPLOAD", "Upload foto produk", true, 2, 1, "Step 1"},
		{"SELF_DECLARE", "ktp", "KTP", "FILE_UPLOAD", "Upload KTP penanggung jawab", true, 3, 1, "Step 1"},
		{"SELF_DECLARE", "foto_verval", "Foto Verval", "FILE_UPLOAD", "Upload foto verifikasi lapangan", true, 4, 1, "Step 1"},
		{"SELF_DECLARE", "foto_bersama_consultant", "Foto Bersama Consultant", "FILE_UPLOAD", "Upload foto bersama consultant", true, 5, 1, "Step 1"},
		{"SELF_DECLARE", "resep", "Resep", "FILE_UPLOAD", "Upload dokumen resep (opsional)", false, 6, 1, "Step 1"},
		{"SELF_DECLARE", "catatan_pph", "Catatan Bahan PPH", "TEXT", "Catatan bahan PPH (opsional)", false, 7, 1, "Step 1"},
		// REGULER
		{"REGULER", "data_kontrak", "Data Kontrak", "FILE_UPLOAD", "Upload data kontrak pendampingan", true, 1, 1, "Step 1"},
		{"REGULER", "bukti_bayar", "Bukti Bayar", "FILE_UPLOAD", "Upload bukti pembayaran", true, 2, 1, "Step 1"},
		{"REGULER", "template_kontrak", "Template Kontrak", "LINK", "Link template kontrak pendampingan", true, 3, 1, "Step 1"},
		{"REGULER", "surat_penawaran", "Template Surat Penawaran", "LINK", "Link template surat penawaran (opsional)", false, 4, 1, "Step 1"},
		// RECRUITMENT
		{"RECRUITMENT", "ktp", "KTP", "FILE_UPLOAD", "Upload KTP", true, 1, 1, "Step 1"},
		{"RECRUITMENT", "foto_3x4", "Foto 3x4 Latar Merah", "FILE_UPLOAD", "Upload foto 3x4 latar belakang merah", true, 2, 1, "Step 1"},
		{"RECRUITMENT", "ijazah_sta", "Ijazah STA", "FILE_UPLOAD", "Upload ijazah STA", true, 3, 1, "Step 1"},
		{"RECRUITMENT", "buku_rekening", "Buku Rekening", "FILE_UPLOAD", "Upload halaman depan buku rekening", true, 4, 1, "Step 1"},
		{"RECRUITMENT", "npwp", "NPWP", "FILE_UPLOAD", "Upload NPWP (opsional)", false, 5, 1, "Step 1"},
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
				StepNumber:  d.StepNumber,
				StepName:    d.StepName,
				IsActive:    true,
			}
			db.Create(&cfg)
		}
	}

	log.Println("Form config seeding completed.")
}

const baseURL = "https://emsifa.github.io/api-wilayah-indonesia/api"

// Structs for parsing JSON
type apiProvince struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type apiRegency struct {
	ID         string `json:"id"`
	ProvinceID string `json:"province_id"`
	Name       string `json:"name"`
}

type apiDistrict struct {
	ID        string `json:"id"`
	RegencyID string `json:"regency_id"`
	Name      string `json:"name"`
}

func fetchJSON(url string, target interface{}) error {
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	return json.Unmarshal(bodyBytes, target)
}

func parseInt(s string) int64 {
	val, _ := strconv.ParseInt(s, 10, 64)
	return val
}

func seedGeography(db *gorm.DB) {
	log.Println("Mengunduh data wilayah dari API publik...")

	// 1. Fetch Provinces
	var apiProvinces []apiProvince
	if err := fetchJSON(fmt.Sprintf("%s/provinces.json", baseURL), &apiProvinces); err != nil {
		log.Printf("⚠️ Gagal mengunduh provinsi: %v", err)
		return
	}

	for _, p := range apiProvinces {
		prov := domain.Province{
			ID:   parseInt(p.ID),
			Name: p.Name,
		}
		db.Clauses(clause.OnConflict{DoNothing: true}).Create(&prov)
	}
	log.Printf("✓ %d Provinsi berhasil disimpan.", len(apiProvinces))

	// 2. Fetch Regencies & Districts Concurrently
	var wg sync.WaitGroup
	sem := make(chan struct{}, 15) // Limit concurrency to avoid hitting rate limits

	for _, prov := range apiProvinces {
		wg.Add(1)
		go func(p apiProvince) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			var regencies []apiRegency
			if err := fetchJSON(fmt.Sprintf("%s/regencies/%s.json", baseURL, p.ID), &regencies); err != nil {
				log.Printf("⚠️ Gagal mengunduh kabupaten untuk provinsi %s: %v", p.Name, err)
				return
			}

			var dbRegs []domain.Regency
			for _, r := range regencies {
				dbRegs = append(dbRegs, domain.Regency{
					ID:         parseInt(r.ID),
					ProvinceID: parseInt(r.ProvinceID),
					Name:       r.Name,
				})
			}
			if len(dbRegs) > 0 {
				db.Clauses(clause.OnConflict{DoNothing: true}).Create(&dbRegs)
			}

			// Seed billing rates and districts for each regency
			for _, r := range regencies {
				regID := parseInt(r.ID)

				// Seed billing rates
				for _, svc := range []string{"REGULER", "SELF_DECLARE"} {
					amount := 3500000.0
					if svc == "SELF_DECLARE" {
						amount = 1500000.0
					}
					rate := domain.BillingRate{
						ServiceType: svc,
						RegencyID:   regID,
						Amount:      amount,
						Description: "Tarif " + svc + " - " + r.Name,
					}
					db.Clauses(clause.OnConflict{DoNothing: true}).Create(&rate)
				}

				// Fetch Districts
				var districts []apiDistrict
				if err := fetchJSON(fmt.Sprintf("%s/districts/%s.json", baseURL, r.ID), &districts); err == nil {
					var dbDistricts []domain.District
					for _, d := range districts {
						dbDistricts = append(dbDistricts, domain.District{
							ID:        parseInt(d.ID),
							RegencyID: parseInt(d.RegencyID),
							Name:      d.Name,
						})
					}
					if len(dbDistricts) > 0 {
						db.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&dbDistricts, 500)
					}
				}
			}
		}(prov)
	}

	wg.Wait()
	log.Println("✓ Geography & billing rates seeded.")
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
		err := db.Where("service_type = ? AND item_name = ?", cfg.ServiceType, cfg.ItemName).First(&existing).Error
		if err != nil {
			db.Create(&cfg)
		}
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
		db.Where("name = ?", scales[i].Name).FirstOrCreate(&scales[i])
	}

	// 2. Seed Business Types
	bTypes := []domain.BusinessType{
		{Name: "Makanan & Minuman"},
		{Name: "Kosmetik"},
		{Name: "Obat-obatan"},
	}
	for i := range bTypes {
		db.Where("name = ?", bTypes[i].Name).FirstOrCreate(&bTypes[i])
	}

	// 3. Seed Product Categories
	pCats := []domain.ProductCategory{
		{Name: "Camilan Ringan", BusinessTypeID: &bTypes[0].ID},
		{Name: "Minuman Kemasan", BusinessTypeID: &bTypes[0].ID},
		{Name: "Skincare", BusinessTypeID: &bTypes[1].ID},
	}
	for i := range pCats {
		var existing domain.ProductCategory
		err := db.Where("name = ?", pCats[i].Name).First(&existing).Error
		if err != nil {
			db.Create(&pCats[i])
		} else {
			pCats[i] = existing
		}
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
		{Name: "Biaya Pendaftaran BPJPH", Category: "BPJPH", Type: "FIXED", BaseAmount: 500000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Biaya Audit LPH (Umum)", Category: "LPH", Type: "PER_CABANG", BaseAmount: 3000000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Biaya Audit LPH (Khusus Jakarta)", Category: "LPH", Type: "PER_CABANG", BaseAmount: 4500000, IsMandatory: true, ProvinceID: dkiId, ServiceType: "REGULER"},
		{Name: "Biaya Sidang MUI", Category: "MUI", Type: "FIXED", BaseAmount: 1500000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Sertifikat BPJPH", Category: "BPJPH", Type: "FIXED", BaseAmount: 1000000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Sertifikat BPJPH (Khusus Kosmetik)", Category: "BPJPH", Type: "FIXED", BaseAmount: 2000000, IsMandatory: true, BusinessTypeID: &bTypes[1].ID, ServiceType: "REGULER"},
		// Pendampingan per skala usaha
		{Name: "Jasa Pendampingan (Mikro)", Category: "PENDAMPINGAN", Type: "PER_CABANG", BaseAmount: 3500000, IsMandatory: true, BusinessScaleID: &scales[0].ID, ServiceType: "REGULER"},
		{Name: "Jasa Pendampingan (Kecil)", Category: "PENDAMPINGAN", Type: "PER_CABANG", BaseAmount: 3500000, IsMandatory: true, BusinessScaleID: &scales[1].ID, ServiceType: "REGULER"},
		{Name: "Jasa Pendampingan (Menengah)", Category: "PENDAMPINGAN", Type: "PER_CABANG", BaseAmount: 5500000, IsMandatory: true, BusinessScaleID: &scales[2].ID, ServiceType: "REGULER"},
		{Name: "Jasa Pendampingan (Besar)", Category: "PENDAMPINGAN", Type: "PER_CABANG", BaseAmount: 10000000, IsMandatory: true, BusinessScaleID: &scales[3].ID, ServiceType: "REGULER"},
	}
	for i := range components {
		var existing domain.BillingComponent
		err := db.Where("name = ?", components[i].Name).First(&existing).Error
		if err != nil {
			db.Create(&components[i])
		} else if existing.Type == "" || (components[i].Category == "PENDAMPINGAN" && existing.Type != components[i].Type) {
			db.Model(&existing).Update("type", components[i].Type)
		}
	}
}

func seedSystemSettings(db *gorm.DB) {
	settings := []domain.SystemSetting{
		{Key: "PAYMENT_GATEWAY_ACTIVE", Value: "MIDTRANS"},
		{Key: "PAYMENT_MANUAL_ENABLED", Value: "true"},
		{Key: "PAYMENT_ONLINE_ENABLED", Value: "true"},
		{Key: "PAYMENT_BANK_NAME", Value: "BNI"},
		{Key: "PAYMENT_BANK_ACCOUNT_NO", Value: "1825073247"},
		{Key: "PAYMENT_BANK_ACCOUNT_NAME", Value: "PT. Ana Nahnu Indonesia"},
		{Key: "MIDTRANS_IS_PRODUCTION", Value: "false"},
		{Key: "MAYAR_IS_PRODUCTION", Value: "false"},
		{Key: "COMPANY_NAME", Value: "PT Ana Nahnu Indonesia"},
		{Key: "BRAND_NAME", Value: "HalalCore"},
		{Key: "COMPANY_EMAIL", Value: "info@ananahnu.id"},
		{Key: "COMPANY_PHONE", Value: "+62 812-3456-7890"},
		{Key: "COMPANY_ADDRESS", Value: "Jl. Raya Ana Nahnu No. 1, Jakarta"},
		{Key: "CS_PHONE", Value: "6281564955280"},
		{Key: "CS_NAME", Value: "Customer Support HalalCore"},
		{Key: "SUPPORT_EMAIL", Value: "support@halalcore.id"},
		{Key: "OPERATIONAL_HOURS", Value: "Senin - Jumat, 08:00 - 17:00 WIB"},
		{Key: "CONSULTATION_PHONE", Value: "6281564955280"},
		{Key: "WHATSAPP_DEFAULT_MESSAGE", Value: "Halo Admin HalalCore, saya membutuhkan bantuan terkait pengajuan sertifikasi halal."},
		{Key: "SOCIAL_INSTAGRAM", Value: "https://instagram.com/halalcore.id"},
		{Key: "SOCIAL_TIKTOK", Value: "https://tiktok.com/@halalcore.id"},
		{Key: "COMPANY_WEBSITE", Value: "https://halalcore.id"},
	}

	for _, s := range settings {
		var existing domain.SystemSetting
		if err := db.Where("key = ?", s.Key).First(&existing).Error; err != nil {
			db.Create(&s)
		}
	}
	log.Println("✓ System settings seeded.")
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
