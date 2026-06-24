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
		var role domain.Role
		db.Where("name = ?", name).FirstOrCreate(&role)
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

	// 4. Seed Sales Schemes
	schemes := []domain.SalesScheme{
		{Name: "Direct Sale", Description: "Penjualan langsung ke klien"},
		{Name: "Partnership", Description: "Kerjasama pihak ketiga"},
	}
	for i := range schemes {
		db.Where("name = ?", schemes[i].Name).FirstOrCreate(&schemes[i])
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
		{Name: "Biaya Audit LPH (Umum)", Category: "LPH", Type: "PER_CABANG", BaseAmount: 3000000, IsMandatory: true},
		{Name: "Biaya Audit LPH (Khusus Jakarta)", Category: "LPH", Type: "PER_CABANG", BaseAmount: 4500000, IsMandatory: true, ProvinceID: dkiId},
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
		var existing domain.BillingComponent
		err := db.Where("name = ?", components[i].Name).First(&existing).Error
		if err != nil {
			db.Create(&components[i])
		}
	}

	// 6. Seed Sales Scheme Prices
	prices := []domain.SalesSchemePrice{
		{SalesSchemeID: schemes[0].ID, BasePrice: 5000000, DataSource: "ORGANIK", Description: "Harga Dasar Umum", IsActive: true},
		{SalesSchemeID: schemes[0].ID, BusinessTypeID: &bTypes[0].ID, BusinessScaleID: &scales[0].ID, BasePrice: 3000000, DataSource: "ORGANIK", Description: "Promo Makanan Mikro", IsActive: true},
		{SalesSchemeID: schemes[0].ID, BusinessTypeID: &bTypes[1].ID, BasePrice: 8000000, DataSource: "ORGANIK", Description: "Harga Dasar Kosmetik", IsActive: true},
		{SalesSchemeID: schemes[1].ID, BasePrice: 4000000, DataSource: "MARKETING", Description: "Harga Dasar Partnership", IsActive: true},
	}
	for i := range prices {
		var existing domain.SalesSchemePrice
		tx := db.Where("sales_scheme_id = ? AND data_source = ?", prices[i].SalesSchemeID, prices[i].DataSource)
		if prices[i].BusinessTypeID != nil {
			tx = tx.Where("business_type_id = ?", prices[i].BusinessTypeID)
		} else {
			tx = tx.Where("business_type_id IS NULL")
		}
		if prices[i].BusinessScaleID != nil {
			tx = tx.Where("business_scale_id = ?", prices[i].BusinessScaleID)
		} else {
			tx = tx.Where("business_scale_id IS NULL")
		}
		err := tx.First(&existing).Error
		if err != nil {
			db.Create(&prices[i])
		}
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
