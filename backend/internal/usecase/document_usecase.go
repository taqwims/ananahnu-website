package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/utils"
	"ananahnu/pkg/qrcode"
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
)

type DocumentUsecase interface {
	GenerateContract(submissionID uuid.UUID, format string) ([]byte, string, error)
	GenerateSPH(submissionID uuid.UUID) ([]byte, string, error)
	GenerateTeleAgreementPDF(agreementID uuid.UUID) ([]byte, string, error)
	GenerateInvoicePDF(submissionID uuid.UUID) ([]byte, string, error)
}

type DocumentUsecaseDeps struct {
	SubmissionRepo    domain.SubmissionRepository
	SettingRepo       domain.SystemSettingRepository
	TeleAgreementRepo domain.TeleAgreementRepository
	InvoiceRepo       domain.InvoiceRepository
	BillingConfigRepo domain.BillingConfigRepository
}

type documentUsecase struct {
	DocumentUsecaseDeps
}

func NewDocumentUsecase(deps DocumentUsecaseDeps) DocumentUsecase {
	return &documentUsecase{
		DocumentUsecaseDeps: deps,
	}
}

func (uc *documentUsecase) GenerateContract(submissionID uuid.UUID, format string) ([]byte, string, error) {
	// 1. Fetch Data
	submission, err := uc.SubmissionRepo.FindByID(submissionID)
	if err != nil {
		return nil, "", err
	}

	if submission.ServiceType != "REGULER" {
		return nil, "", fmt.Errorf("contract generation only supported for REGULER service")
	}

	// Fetch Settings
	settings, _ := uc.SettingRepo.GetAllSettings()
	settingMap := make(map[string]string)
	for _, s := range settings {
		settingMap[s.Key] = s.Value
	}

	// Prepare Variables
	now := time.Now()
	days := []string{"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
	months := []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}

	vars := make(map[string]string)

	// Contract Info
	if submission.ContractNumber == nil || *submission.ContractNumber == "" {
		count, err := uc.SubmissionRepo.CountSubmissionsWithContractInYear(now.Year())
		if err == nil {
			contractNum := fmt.Sprintf("HC/PK-SH/%d/%05d", now.Year(), count+1)
			submission.ContractNumber = &contractNum
			_ = uc.SubmissionRepo.Update(submission)
		}
	}

	contractNum := "DRAFT"
	if submission.ContractNumber != nil {
		contractNum = *submission.ContractNumber
	}
	vars["{{contract_number}}"] = contractNum

	trackingNum := "-"
	if submission.TrackingNumber != nil {
		trackingNum = *submission.TrackingNumber
	}
	vars["{{application_number}}"] = trackingNum

	status := "DRAFT"
	if submission.Status == "READY_FOR_SIGNATURE" {
		status = "READY FOR SIGNATURE"
	} else if submission.Status == "SIGNED" {
		status = "SIGNED"
	}
	vars["{{contract_status}}"] = status
	vars["{{service_scheme}}"] = submission.ServiceType

	// Client Info
	client := submission.Client
	clientPartyName := client.BusinessName
	if clientPartyName == "" {
		clientPartyName = client.ClientName
	}
	vars["{{client_party_name}}"] = clientPartyName

	clientPartyDesc := "Pelaku Usaha"
	if client.BusinessName != "" {
		clientPartyDesc = "Badan Usaha"
	}
	vars["{{client_party_description}}"] = clientPartyDesc

	// Mask identity
	identity := client.NIB
	if strings.HasPrefix(identity, "DRAFT-") {
		identity = ""
	}
	if client.NIK != "" {
		if identity != "" {
			identity = fmt.Sprintf("%s / %s", client.NIK, identity)
		} else {
			identity = client.NIK
		}
	}
	vars["{{client_identity_number_masked}}"] = identity
	vars["{{client_address}}"] = client.Address
	vars["{{client_signatory_name}}"] = client.ClientName
	vars["{{client_signatory_capacity}}"] = "Pemohon"

	vars["{{client_nib}}"] = client.NIB
	vars["{{business_scale}}"] = "-"
	if submission.CostDetail != nil && submission.CostDetail.BusinessScaleID != nil {
		vars["{{business_scale}}"] = submission.CostDetail.BusinessScale.Name
	}
	vars["{{business_address}}"] = client.Address
	vars["{{client_contact_name}}"] = client.ClientName
	vars["{{client_phone}}"] = client.Phone

	// Extract email and brand name from FormFieldValues
	clientEmail := "-"
	brandName := "-"
	for _, fv := range submission.FieldValues {
		if fv.FormField.FieldKey == "email" {
			clientEmail = fv.TextValue
		}
		if fv.FormField.FieldKey == "brand_name" || fv.FormField.FieldKey == "nama_merk" || fv.FormField.FieldKey == "merk" {
			brandName = fv.TextValue
		}
	}
	if brandName == "-" && client.BusinessName != "" {
		brandName = client.BusinessName
	}
	vars["{{client_email}}"] = clientEmail
	vars["{{service_package}}"] = brandName

	// Dates & Location
	vars["{{contract_day}}"] = days[now.Weekday()]
	vars["{{contract_date_text}}"] = fmt.Sprintf("%d %s %d", now.Day(), months[now.Month()], now.Year())
	vars["{{contract_city}}"] = uc.getSetting(settingMap, "COMPANY_CITY", "Ciamis")
	vars["{{company_address}}"] = uc.getSetting(settingMap, "COMPANY_ADDRESS", "Dusun Cikohkol, Desa Sukasari, Kecamatan Banjarsari, Kabupaten Ciamis, Jawa Barat 46383")
	vars["{{generated_at_local}}"] = fmt.Sprintf("%d %s %d", now.Day(), months[now.Month()], now.Year())

	// Advisor
	advisorName := "-"
	advisorID := "-"
	advisorPhone := "-"
	advisorEmail := "-"
	if submission.Consultant != nil {
		advisorName = submission.Consultant.FullName
		advisorID = submission.Consultant.ID.String()[:8]
		advisorPhone = submission.Consultant.Phone
		advisorEmail = submission.Consultant.Email
	} else {
		advisorName = uc.getSetting(settingMap, "COMPANY_DIRECTOR_NAME", "Direktur Ana Nahnu")
	}
	vars["{{advisor_name}}"] = advisorName
	vars["{{advisor_id}}"] = advisorID
	vars["{{advisor_phone}}"] = advisorPhone
	vars["{{advisor_email}}"] = advisorEmail

	// Ruang Lingkup
	vars["{{product_category}}"] = "-"
	if submission.CostDetail != nil && submission.CostDetail.ProductCategoryID != nil {
		vars["{{product_category}}"] = submission.CostDetail.ProductCategory.Name
	}
	vars["{{product_count}}"] = fmt.Sprintf("%d", submission.ProductCount)
	vars["{{product_summary}}"] = brandName
	vars["{{facility_count}}"] = fmt.Sprintf("%d", submission.BranchCount)
	vars["{{facility_summary}}"] = "Lokasi Fasilitas Utama"
	vars["{{special_terms_or_dash}}"] = "-"

	// Cost details
	totalAmount := 0.0
	if submission.CostDetail != nil && submission.CostDetail.TotalAmount > 0 {
		totalAmount = submission.CostDetail.TotalAmount
		vars["[CostBreakdownJSON]"] = submission.CostDetail.CostBreakdownData
	} else if submission.Invoice != nil && submission.Invoice.Amount > 0 {
		totalAmount = submission.Invoice.Amount
	} else if len(submission.Invoices) > 0 && submission.Invoices[0].Amount > 0 {
		totalAmount = submission.Invoices[0].Amount
	} else if costDetail, err := uc.BillingConfigRepo.GetSubmissionCostDetail(submissionID); err == nil && costDetail != nil && costDetail.TotalAmount > 0 {
		totalAmount = costDetail.TotalAmount
		vars["[CostBreakdownJSON]"] = costDetail.CostBreakdownData
	}
	vars["{{total_contract_amount_formatted}}"] = uc.formatIDR(totalAmount)
	vars["{{total_contract_amount_words}}"] = utils.TerbilangRupiah(totalAmount)

	// Support info
	vars["{{customer_service_contact}}"] = "cs@halalcore.id"
	vars["{{complaint_channel}}"] = "complaint@halalcore.id"
	vars["{{privacy_contact}}"] = "privasi@halalcore.id"
	vars["{{refund_processing_days}}"] = uc.getSetting(settingMap, "REFUND_PROCESSING_DAYS", "14")

	// Verification URL
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = os.Getenv("APP_FRONTEND_URL")
	}
	if frontendURL == "" {
		frontendURL = uc.getSetting(settingMap, "FRONTEND_URL", "https://halalcore.id")
	}
	vars["[Verification URL]"] = fmt.Sprintf("%s/verify-agreement/%s", frontendURL, submission.ID.String())

	// Generate PDF
	filename := fmt.Sprintf("Kontrak_%s", strings.ReplaceAll(clientPartyName, " ", "_"))
	if format != "pdf" {
		return nil, "", fmt.Errorf("only pdf format is supported")
	}

	buf, err := uc.generatePDF(vars)
	if err != nil {
		return nil, "", err
	}
	return buf, filename + ".pdf", nil
}

func (uc *documentUsecase) getSetting(m map[string]string, key, fallback string) string {
	if v, ok := m[key]; ok && v != "" {
		return v
	}
	return fallback
}

func (uc *documentUsecase) formatIDR(amount float64) string {
	// Simple IDR formatter
	s := fmt.Sprintf("%.0f", amount)
	var res []string
	for i := len(s); i > 0; i -= 3 {
		start := i - 3
		if start < 0 {
			start = 0
		}
		res = append([]string{s[start:i]}, res...)
	}
	return strings.Join(res, ".")
}

func (uc *documentUsecase) generateDocx(vars map[string]string) ([]byte, error) {
	// Manual DOCX filling by unzipping and replacing word/document.xml
	templatePath := "templates/kontrak_reguler.docx"

	// We read the whole file into memory first
	r, err := zip.OpenReader(templatePath)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	for _, f := range r.File {
		fw, err := w.Create(f.Name)
		if err != nil {
			return nil, err
		}
		rc, err := f.Open()
		if err != nil {
			return nil, err
		}

		if f.Name == "word/document.xml" {
			// Replace in XML
			content, err := io.ReadAll(rc)
			if err != nil {
				return nil, err
			}
			xmlStr := string(content)

			// Clean XML from spellcheck and other tags that split placeholders
			xmlStr = uc.cleanXml(xmlStr)

			// Inject placeholders into the footer labels that don't have them
			// Template has 2 blocks for Pihak Pertama and 2 for Pihak Kedua
			// Use Replace with count to target specifically
			xmlStr = strings.Replace(xmlStr, "Nama:</w:t>", "[Nama Penandatangan]</w:t>", 2)
			xmlStr = strings.Replace(xmlStr, "Nama:</w:t>", "[Nama Klien / Perusahaan]</w:t>", 2)

			for k, v := range vars {
				xmlStr = strings.ReplaceAll(xmlStr, k, v)
			}
			_, err = fw.Write([]byte(xmlStr))
		} else {
			// Copy as is
			_, err = io.Copy(fw, rc)
		}
		_ = rc.Close()
		if err != nil {
			return nil, err
		}
	}
	_ = w.Close()
	return buf.Bytes(), nil
}

func (uc *documentUsecase) generatePDF(vars map[string]string) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 25)
	
	// Define header with logo on all pages
	pdf.SetHeaderFunc(func() {
		logoPath := "templates/logo_halalcore_header.png"
		if _, err := os.Stat(logoPath); err == nil {
			pdf.ImageOptions(logoPath, 20, 12, 45, 12, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
		}
	})

	// Define footer with page numbers matching screenshot (bottom right)
	pdf.SetFooterFunc(func() {
		pdf.SetY(-15)
		pdf.SetFont("Times", "", 8)
		pdf.SetTextColor(100, 116, 139) // slate-500
		pdf.CellFormat(0, 10, fmt.Sprintf("Kontrak %s  |  Halaman %d", vars["{{contract_number}}"], pdf.PageNo()), "", 0, "R", false, 0, "")
	})

	pdf.SetMargins(20, 32, 20)
	pdf.AddPage()

	// Title
	pdf.SetXY(20, 32)
	pdf.SetFont("Times", "B", 10)
	pdf.SetTextColor(194, 65, 12) // amber-700 / orange-700
	pdf.CellFormat(0, 6, "PERJANJIAN LAYANAN", "", 1, "L", false, 0, "")
	
	pdf.SetFont("Times", "B", 18)
	pdf.SetTextColor(12, 74, 110) // sky-900
	pdf.CellFormat(0, 8, "KONTRAK PENDAMPINGAN", "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 8, "SERTIFIKASI HALAL", "", 1, "L", false, 0, "")
	
	pdf.SetFont("Times", "B", 11)
	pdf.SetTextColor(51, 65, 85) // slate-700
	pdf.CellFormat(0, 6, "Nomor: "+vars["{{contract_number}}"], "", 1, "L", false, 0, "")
	pdf.Ln(4)

	// Summary Table
	pdf.SetDrawColor(226, 232, 240) // slate-200
	pdf.SetLineWidth(0.3)
	
	drawTableObj := func(label, val string) {
		pdf.SetFillColor(240, 249, 255) // sky-50
		pdf.SetFont("Times", "B", 10)
		pdf.SetTextColor(12, 74, 110) // sky-900
		pdf.CellFormat(50, 7.5, "  "+label, "1", 0, "L", true, 0, "")
		
		pdf.SetFillColor(255, 255, 255)
		pdf.SetFont("Times", "", 10)
		pdf.SetTextColor(51, 65, 85)
		pdf.CellFormat(120, 7.5, "  "+val, "1", 1, "L", true, 0, "")
	}
	
	drawTableObj("Nomor Pengajuan", vars["{{application_number}}"])
	drawTableObj("Status Dokumen", vars["{{contract_status}}"])
	drawTableObj("Skema / Paket", vars["{{service_scheme}}"]+" / "+vars["{{service_package}}"])
	drawTableObj("Tanggal Dibuat", vars["{{generated_at_local}}"])
	pdf.Ln(4)

	// Notice Block
	yNotice := pdf.GetY()
	pdf.SetFillColor(248, 250, 252) // slate-50
	pdf.SetDrawColor(226, 232, 240) // slate-200
	pdf.Rect(20, yNotice, 170, 16, "DF")
	
	pdf.SetXY(22, yNotice + 2.5)
	pdf.SetFont("Times", "B", 9.5)
	pdf.SetTextColor(194, 65, 12) // amber-700
	pdf.Write(5, "PENTING. ")
	pdf.SetFont("Times", "", 9.5)
	pdf.SetTextColor(71, 85, 105) // slate-600
	pdf.Write(5, "Dokumen berstatus DRAFT belum mengikat Para Pihak. Perjanjian menjadi efektif setelah\nditandatangani oleh kedua pihak dan persyaratan mulai layanan pada Pasal 6 terpenuhi.")
	pdf.SetXY(20, yNotice + 16)
	pdf.Ln(6)

	// Intro Text
	pdf.SetFont("Times", "", 10)
	pdf.SetTextColor(51, 65, 85)
	introText := fmt.Sprintf("Pada hari ini, %s, tanggal %s, bertempat di %s, Para Pihak menerangkan dan menyepakati Perjanjian Layanan Pendampingan Sertifikasi Halal (selanjutnya disebut \"Perjanjian\") sebagai berikut:", vars["{{contract_day}}"], vars["{{contract_date_text}}"], vars["{{contract_city}}"])
	pdf.MultiCell(0, 5.5, introText, "", "J", false)
	pdf.Ln(3)

	// Pihak Pertama
	pdf.SetFont("Times", "B", 10)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(0, 5, "PIHAK PERTAMA — PENYEDIA LAYANAN", "", 1, "L", false, 0, "")
	pdf.SetFont("Times", "", 10)
	pdf.SetTextColor(51, 65, 85)
	p1Details := fmt.Sprintf("PT ANA NAHNU INDONESIA, badan hukum Indonesia dengan NIB 0411230033734 dan alamat di %s, pemilik dan pengelola platform Halalcore, dalam Perjanjian ini diwakili oleh %s, ID Halal Advisor %s, yang bertindak untuk dan atas nama PT Ana Nahnu Indonesia, selanjutnya disebut \"PIHAK PERTAMA\".", vars["{{company_address}}"], vars["{{advisor_name}}"], vars["{{advisor_id}}"])
	pdf.MultiCell(0, 5.5, p1Details, "", "J", false)
	pdf.Ln(3)

	// Pihak Kedua
	pdf.SetFont("Times", "B", 10)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(0, 5, "PIHAK KEDUA — KLIEN/PELAKU USAHA", "", 1, "L", false, 0, "")
	pdf.SetFont("Times", "", 10)
	pdf.SetTextColor(51, 65, 85)
	p2Details := fmt.Sprintf("%s, %s, NIK/NIB/nomor identitas %s, beralamat di %s, dalam hal merupakan badan usaha diwakili secara sah oleh %s selaku Pemohon, selanjutnya disebut \"PIHAK KEDUA\".", vars["{{client_party_name}}"], vars["{{client_party_description}}"], vars["{{client_identity_number_masked}}"], vars["{{client_address}}"], vars["{{client_signatory_name}}"])
	pdf.MultiCell(0, 5.5, p2Details, "", "J", false)
	pdf.Ln(3)

	p3Text := "PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut \"Para Pihak\" dan masing-masing disebut \"Pihak\"."
	pdf.MultiCell(0, 5.5, p3Text, "", "J", false)
	pdf.Ln(3)

	p4Text := "Para Pihak terlebih dahulu menerangkan bahwa PIHAK PERTAMA menyediakan jasa konsultasi dan pendampingan administratif sertifikasi halal; PIHAK KEDUA bermaksud mengajukan sertifikasi halal atas produk/usaha sebagaimana Ringkasan Pengajuan; dan keputusan penerbitan sertifikat halal sepenuhnya berada pada lembaga yang berwenang sesuai peraturan perundang-undangan."
	pdf.MultiCell(0, 5.5, p4Text, "", "J", false)
	pdf.Ln(6)

	pasalHeader := func(num, name string) {
		pdf.Ln(4)
		pdf.SetFont("Times", "B", 11)
		pdf.SetTextColor(12, 74, 110)
		pdf.CellFormat(0, 6, num, "", 1, "C", false, 0, "")
		pdf.CellFormat(0, 6, name, "", 1, "C", false, 0, "")
		pdf.Ln(2)
	}

	pasalBody := func(text string) {
		pdf.SetFont("Times", "", 10)
		pdf.SetTextColor(51, 65, 85)
		pdf.MultiCell(0, 5.5, text, "", "J", false)
		pdf.Ln(2)
	}

	// PASAL 1
	pasalHeader("PASAL 1", "DEFINISI")
	pasalBody("    (1)  \"Halalcore\" adalah platform dan merek layanan milik PT Ana Nahnu Indonesia yang digunakan untuk pengelolaan data, dokumen, komunikasi, pembayaran, dan status pendampingan.\n" +
		"    (2)  \"Halal Advisor\" adalah personel yang ditunjuk PIHAK PERTAMA sebagai penghubung dan pelaksana pendampingan. Halal Advisor bukan BPJPH, auditor halal, LPH, Pendamping Proses Produk Halal, Penyelia Halal, maupun lembaga penetap kehalalan, kecuali memiliki penunjukan terpisah yang sah untuk fungsi tersebut.\n" +
		"    (3)  \"Ringkasan Pengajuan\" adalah Lampiran 1 yang memuat data klien, skema layanan, ruang lingkup, produk/fasilitas, biaya, dan ketentuan khusus yang menjadi satu kesatuan dengan Perjanjian.\n" +
		"    (4)  \"Hari Kerja\" adalah Senin sampai Jumat, selain hari libur nasional dan hari yang ditetapkan sebagai hari libur oleh Pemerintah Republik Indonesia.\n" +
		"    (5)  \"Pihak Berwenang\" adalah BPJPH dan/atau lembaga lain yang secara hukum menjalankan pemeriksaan, pendampingan proses produk halal, penetapan kehalalan, penerbitan sertifikat, atau fungsi lain dalam penyelenggaraan jaminan produk halal.")

	// PASAL 2
	pasalHeader("PASAL 2", "OBJEK DAN RUANG LINGKUP LAYANAN")
	pasalBody(fmt.Sprintf("    (1)  PIHAK KEDUA menunjuk PIHAK PERTAMA untuk memberikan pendampingan sertifikasi halal dengan skema %s dan paket %s atas ruang lingkup sebagaimana Lampiran 1.\n"+
		"    (2)  Layanan dapat meliputi penilaian awal kelayakan skema; penyampaian daftar kebutuhan data; pemeriksaan kelengkapan administratif; pendampingan penyusunan dokumen Sistem Jaminan Produk Halal; pendampingan input atau pengajuan pada sistem resmi; koordinasi proses verifikasi, pemeriksaan, audit, atau pendampingan yang relevan; tindak lanjut koreksi administratif; pemantauan status; dan penyerahan salinan sertifikat apabila terbit.\n"+
		"    (3)  Komponen yang secara tegas ditandai \"Termasuk\" dalam Lampiran 1 merupakan kewajiban PIHAK PERTAMA. Komponen yang ditandai \"Tidak Termasuk\" atau tidak dicantumkan bukan bagian dari harga Perjanjian.\n"+
		"    (4)  Untuk skema pernyataan pelaku usaha/self declare, pernyataan kehalalan dan dokumen yang menurut sistem wajib disetujui pelaku usaha tetap harus ditandatangani atau diafirmasi sendiri oleh PIHAK KEDUA. Halal Advisor tidak berwenang menggantikan pernyataan faktual PIHAK KEDUA.", vars["{{service_scheme}}"], vars["{{service_package}}"]))

	// PASAL 3
	pasalHeader("PASAL 3", "LAYANAN YANG DIKECUALIKAN DAN PERUBAHAN RUANG LINGKUP")
	pasalBody("    (1)  Kecuali dinyatakan termasuk dalam Lampiran 1, layanan ini tidak mencakup pengurusan NIB atau perizinan usaha lain; pengujian laboratorium; pengadaan atau penggantian bahan; renovasi fasilitas; biaya perjalanan di luar wilayah layanan; biaya resmi BPJPH/LPH/lembaga fatwa; pelatihan Penyelia Halal; penerjemahan; legalisasi dokumen; perubahan sertifikat setelah terbit; dan layanan pemeliharaan pascasertifikasi.\n" +
		"    (2)  Penambahan merek, produk, varian, gerai, fasilitas, lokasi produksi, bahan berisiko, atau perubahan skema setelah Perjanjian efektif merupakan perubahan ruang lingkup dan harus memperoleh persetujuan tertulis Para Pihak mengenai tambahan biaya dan waktu.\n" +
		"    (3)  PIHAK PERTAMA tidak boleh menagihkan biaya tambahan tanpa persetujuan PIHAK KEDUA. Perubahan tarif pihak ketiga hanya dapat diteruskan kepada PIHAK KEDUA setelah disertai penjelasan dan persetujuan tertulis.")

	// PASAL 4
	pasalHeader("PASAL 4", "HAK DAN KEWAJIBAN PIHAK PERTAMA")
	pasalBody("    (1)  Memberikan layanan secara profesional, transparan, beritikad baik, dan sesuai ruang lingkup yang disepakati.\n" +
		"    (2)  Menunjuk Halal Advisor sebagai narahubung dan, bila diperlukan, menggantinya dengan personel lain yang setara dengan pemberitahuan kepada PIHAK KEDUA.\n" +
		"    (3)  Menyampaikan daftar kebutuhan, kekurangan dokumen, status penting, serta permintaan perbaikan melalui dashboard dan/atau kanal komunikasi resmi.\n" +
		"    (4)  Menjaga kerahasiaan data PIHAK KEDUA dan menggunakannya hanya untuk pelaksanaan layanan, pemenuhan kewajiban hukum, pengendalian mutu, dan kepentingan lain yang telah disetujui.\n" +
		"    (5)  Memperbaiki tanpa biaya jasa tambahan apabila pengajuan dikembalikan semata-mata karena kesalahan administratif PIHAK PERTAMA, sepanjang data sumber dari PIHAK KEDUA benar dan tidak berubah.\n" +
		"    (6)  Menerbitkan invoice/kuitansi resmi dan menerima pembayaran hanya melalui metode pembayaran resmi yang tercantum pada invoice atau dashboard.")

	// PASAL 5
	pasalHeader("PASAL 5", "HAK DAN KEWAJIBAN PIHAK KEDUA")
	pasalBody("    (1)  Memberikan data, dokumen, keterangan bahan, produk, proses, fasilitas, dan kondisi usaha yang benar, lengkap, mutakhir, serta dapat dipertanggungjawabkan.\n" +
		"    (2)  Menunjuk personel yang berwenang, memberikan akses yang wajar untuk pemeriksaan/pengambilan bukti, menghadiri audit atau pendampingan, dan merespons permintaan perbaikan paling lambat 3 (Tiga) Hari Kerja atau dalam batas waktu pihak berwenang.\n" +
		"    (3)  Menjaga kesesuaian bahan dan proses dengan data yang diajukan, menerapkan kewajiban Sistem Jaminan Produk Halal, serta memberitahukan perubahan bahan, pemasok, produk, proses, lokasi, atau personel terkait.\n" +
		"    (4)  Memastikan telah memperoleh hak penggunaan merek, dokumen, foto, sertifikat bahan, dan informasi pihak ketiga yang diserahkan kepada PIHAK PERTAMA.\n" +
		"    (5)  Membayar biaya sesuai Lampiran 1 dan tidak melakukan pembayaran pribadi kepada Halal Advisor. Pembayaran kepada rekening pribadi atau tanpa kuitansi resmi tidak dianggap sebagai pembayaran kepada PIHAK PERTAMA, kecuali dikonfirmasi tertulis oleh perusahaan.\n" +
		"    (6)  Memeriksa draf sebelum diajukan. Persetujuan PIHAK KEDUA melalui dashboard, tanda tangan, OTP, atau mekanisme afirmasi lain merupakan konfirmasi bahwa data yang diajukan telah diperiksa.")

	// PASAL 6
	pasalHeader("PASAL 6", "MULAI LAYANAN, JANGKA WAKTU, DAN PENUNDAAN")
	pasalBody("    (1)  Perjanjian efektif pada tanggal ditandatangani oleh Para Pihak. Pekerjaan mulai dihitung setelah PIHAK PERTAMA menerima pembayaran tahap pertama dan dokumen minimum yang ditandai wajib pada Lampiran 1.\n" +
		"    (2)  Target penyelesaian pekerjaan yang berada dalam kendali PIHAK PERTAMA adalah 6 (Enam) Hari Kerja, dengan rincian tahap pada Lampiran 1. Target ini bukan jaminan tanggal terbit sertifikat.\n" +
		"    (3)  Waktu tunggu akibat jadwal atau sistem pihak berwenang; proses pemeriksaan/audit; sidang/penetapan kehalalan; penerbitan sertifikat; permintaan tambahan dari pihak berwenang; gangguan sistem nasional; atau keterlambatan PIHAK KEDUA tidak dihitung sebagai keterlambatan PIHAK PERTAMA.\n" +
		"    (4)  Jika PIHAK KEDUA tidak merespons atau tidak melengkapi persyaratan selama 3 (Tiga) hari kalender sejak pengingat terakhir, pengajuan dapat berstatus Ditunda. Setelah 15 (Lima Belas) hari kalender, PIHAK PERTAMA dapat menutup layanan dengan pemberitahuan, tanpa menghapus hak PIHAK KEDUA atas rekonsiliasi pembayaran menurut Pasal 8.")

	// PASAL 7
	pasalHeader("PASAL 7", "BIAYA, DAN PEMBAYARAN")
	pasalBody(fmt.Sprintf("    (1)  Nilai Perjanjian adalah sebesar %s (%s), dengan rincian pada Lampiran 1.\n"+
		"    (2)  Pembayaran dilakukan 100%% ketika tanda tangan kontrak.\n"+
		"    (3)  Setiap perubahan nilai Perjanjian wajib tercatat dalam dashboard, invoice, atau addendum yang disetujui Para Pihak.", vars["{{total_contract_amount_formatted}}"], vars["{{total_contract_amount_words}}"]))

	// PASAL 8
	pasalHeader("PASAL 8", "PEMBATALAN, PENGAKHIRAN, DAN PENGEMBALIAN DANA")
	pasalBody(fmt.Sprintf("    (1)  Sebelum pekerjaan dimulai, PIHAK KEDUA dapat membatalkan layanan dan menerima pengembalian pembayaran setelah dikurangi biaya pihak ketiga yang telah dibayarkan dan biaya administrasi yang telah diinformasikan dalam Lampiran 1.\n"+
		"    (2)  Setelah pekerjaan dimulai, pembatalan oleh PIHAK KEDUA diselesaikan melalui rekonsiliasi berdasarkan pekerjaan yang telah dilaksanakan, biaya pihak ketiga yang tidak dapat ditarik kembali, serta kewajiban yang telah timbul. Kelebihan pembayaran, jika ada, dikembalikan paling lambat %s Hari Kerja setelah rekonsiliasi disepakati.\n"+
		"    (3)  PIHAK PERTAMA dapat menangguhkan atau mengakhiri layanan apabila terdapat data palsu, ketidaksesuaian substansial, kegiatan yang melanggar hukum, penolakan memenuhi kewajiban penting, atau tunggakan pembayaran; dengan pemberitahuan dan kesempatan perbaikan yang wajar, kecuali pelanggaran tidak dapat diperbaiki.\n"+
		"    (4)  Apabila PIHAK PERTAMA menghentikan layanan tanpa kesalahan PIHAK KEDUA, PIHAK PERTAMA mengembalikan bagian biaya jasa untuk pekerjaan yang belum dilaksanakan, tidak termasuk biaya pihak ketiga yang sah dan tidak dapat ditarik kembali.", vars["{{refund_processing_days}}"]))

	// PASAL 9
	pasalHeader("PASAL 9", "KEPUTUSAN SERTIFIKASI DAN BATAS TANGGUNG JAWAB")
	pasalBody("    (1)  PIHAK PERTAMA tidak menjanjikan atau menjamin diterbitkannya sertifikat halal, karena verifikasi, pemeriksaan, penetapan kehalalan, dan penerbitan sertifikat merupakan kewenangan pihak berwenang.\n" +
		"    (2)  PIHAK PERTAMA bertanggung jawab atas mutu jasa pendampingan sesuai Perjanjian, tetapi tidak bertanggung jawab atas penolakan, pengembalian, penundaan, pembekuan, atau pencabutan yang timbul karena data/kondisi PIHAK KEDUA; ketidaksesuaian bahan atau proses; perubahan kebijakan; keputusan pihak berwenang; atau keadaan di luar kendali wajar PIHAK PERTAMA.\n" +
		"    (3)  Tidak ada ketentuan dalam Perjanjian ini yang membatasi hak PIHAK KEDUA berdasarkan peraturan perlindungan konsumen atau mengecualikan tanggung jawab yang menurut hukum tidak dapat dikesampingkan.")

	// PASAL 10
	pasalHeader("PASAL 10", "KERAHASIAAN DAN PELINDUNGAN DATA PRIBADI")
	pasalBody(fmt.Sprintf("    (1)  PIHAK KEDUA memberikan persetujuan kepada PIHAK PERTAMA untuk mengumpulkan, menggunakan, menyimpan, memperbaiki, mengirimkan, dan mengungkapkan data yang relevan sejauh diperlukan untuk pelaksanaan layanan, termasuk kepada BPJPH, LPH, LP3H/P3H, lembaga/komite fatwa, laboratorium, penyedia tanda tangan elektronik, penyedia sistem, dan mitra operasional yang berwenang.\n"+
		"    (2)  PIHAK PERTAMA wajib menerapkan pengamanan yang wajar, pembatasan akses, pencatatan aktivitas, dan retensi data sesuai tujuan pemrosesan serta ketentuan hukum. Data tidak digunakan untuk pemasaran di luar layanan tanpa persetujuan terpisah.\n"+
		"    (3)  PIHAK KEDUA dapat mengajukan permintaan akses, koreksi, atau hak lain atas data pribadi melalui %s, sepanjang tidak bertentangan dengan kewajiban retensi, pembuktian transaksi, atau kewajiban hukum PIHAK PERTAMA.\n"+
		"    (4)  Kewajiban kerahasiaan tetap berlaku setelah Perjanjian berakhir, kecuali informasi telah tersedia untuk umum secara sah, diterima secara sah dari pihak lain, atau wajib diungkap berdasarkan hukum.", vars["{{privacy_contact}}"]))

	// PASAL 11
	pasalHeader("PASAL 11", "KONTRAK DAN TANDA TANGAN ELEKTRONIK")
	pasalBody("    (1)  Para Pihak setuju bahwa Perjanjian, persetujuan, invoice, bukti pembayaran, notifikasi, dan rekaman aktivitas dalam dashboard dapat berbentuk Informasi Elektronik atau Dokumen Elektronik dan dapat digunakan sebagai alat bukti sesuai hukum.\n" +
		"    (2)  Penandatanganan dapat dilakukan secara basah atau elektronik. Untuk penandatanganan elektronik, sistem wajib merekam identitas penanda tangan, versi dokumen, tanggal dan waktu, metode autentikasi, serta jejak audit yang dapat digunakan untuk memverifikasi persetujuan dan mendeteksi perubahan setelah penandatanganan.\n" +
		"    (3)  Setiap perubahan substansi setelah salah satu pihak menandatangani membatalkan status tanda tangan sebelumnya dan mengharuskan penandatanganan ulang oleh kedua pihak.")

	// PASAL 12
	pasalHeader("PASAL 12", "KEADAAN KAHAR")
	pasalBody("    (1)  Keadaan Kahar adalah peristiwa di luar kendali wajar Pihak yang terdampak, termasuk bencana, kebakaran besar, wabah, perang, kerusuhan, gangguan luas sistem pemerintah/telekomunikasi, kebijakan pemerintah yang langsung menghambat pelaksanaan, atau peristiwa lain yang sejenis.\n" +
		"    (2)  Pihak yang terdampak wajib memberitahukan keadaan tersebut secepatnya disertai penjelasan yang wajar. Kewajiban yang terdampak ditunda selama Keadaan Kahar dan Para Pihak bermusyawarah untuk menyesuaikan jadwal atau mengakhiri bagian layanan yang tidak dapat dilaksanakan.")

	// PASAL 13
	pasalHeader("PASAL 13", "KOMUNIKASI, PENGADUAN, DAN PENYELESAIAN PERSELISIHAN")
	pasalBody(fmt.Sprintf("    (1)  Komunikasi resmi dilakukan melalui dashboard Halalcore dan/atau kontak Para Pihak pada Lampiran 1. Perubahan kontak wajib diberitahukan.\n"+
		"    (2)  Pengaduan layanan disampaikan melalui %s dan ditanggapi paling lambat 1 Hari Kerja.\n"+
		"    (3)  Perselisihan diselesaikan terlebih dahulu melalui musyawarah selama paling lama 30 (tiga puluh) hari kalender sejak pemberitahuan tertulis. Jika tidak tercapai kesepakatan, Para Pihak dapat menggunakan mekanisme penyelesaian sengketa konsumen apabila berlaku atau mengajukan sengketa kepada pengadilan yang berwenang menurut ketentuan hukum acara.", vars["{{complaint_channel}}"]))

	// PASAL 14
	pasalHeader("PASAL 14", "KETENTUAN LAIN-LAIN")
	pasalBody("    (1)  Lampiran, persetujuan perubahan ruang lingkup, dan addendum yang ditandatangani atau diafirmasi Para Pihak merupakan bagian yang tidak terpisahkan dari Perjanjian.\n" +
		"    (2)  Jika terdapat pertentangan, urutan keberlakuan adalah addendum terbaru, naskah Perjanjian, Lampiran 1, kemudian komunikasi operasional; kecuali secara tegas disepakati lain.\n" +
		"    (3)  Ketidakberlakuan satu ketentuan tidak membatalkan ketentuan lainnya. Ketentuan yang tidak berlaku diganti dengan ketentuan sah yang paling mendekati maksud awal Para Pihak.\n" +
		"    (4)  PIHAK KEDUA tidak boleh mengalihkan Perjanjian tanpa persetujuan tertulis PIHAK PERTAMA. PIHAK PERTAMA dapat menggunakan personel atau mitra pelaksana dengan tetap bertanggung jawab atas koordinasi layanan dan pelindungan data sesuai Perjanjian.\n" +
		"    (5)  Perjanjian tidak diperpanjang secara otomatis. Layanan pascasertifikasi atau pengajuan baru memerlukan pesanan layanan baru atau addendum.")

	// PASAL 15
	pasalHeader("PASAL 15", "PENUTUP")
	pasalBody("Para Pihak menyatakan telah membaca, memahami, memiliki kewenangan untuk menandatangani, memperoleh kesempatan yang cukup untuk bertanya, dan menyetujui seluruh isi Perjanjian tanpa paksaan, kekhilafan, atau penipuan. Perjanjian dibuat dalam Bahasa Indonesia dan berlaku sejak tanggal efektif sebagaimana Pasal 6.")

	pdf.Ln(4)

	// Signature Section
	yPosSig := pdf.GetY()
	if yPosSig > 210 {
		pdf.AddPage()
		yPosSig = pdf.GetY()
	}

	pdf.SetFont("Times", "B", 10.5)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(0, 6, "TANDA TANGAN PARA PIHAK", "", 1, "C", false, 0, "")
	pdf.Ln(2)

	// Table Headers
	pdf.SetFillColor(12, 74, 110)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Times", "B", 9.5)
	pdf.CellFormat(85, 7.5, "PIHAK PERTAMA", "1", 0, "C", true, 0, "")
	pdf.CellFormat(85, 7.5, "PIHAK KEDUA", "1", 1, "C", true, 0, "")

	// Row 1: Multiline names
	yRow1 := pdf.GetY()
	pdf.SetTextColor(51, 65, 85)
	pdf.SetFont("Times", "B", 9)
	pdf.Rect(20, yRow1, 85, 12, "D")
	pdf.SetXY(20, yRow1 + 1.5)
	pdf.MultiCell(85, 4.5, "PT ANA NAHNU INDONESIA\nmelalui Halal Advisor yang berwenang", "", "C", false)

	pdf.SetXY(105, yRow1)
	pdf.Rect(105, yRow1, 85, 12, "D")
	pdf.SetXY(105, yRow1 + 3.5)
	pdf.MultiCell(85, 4.5, vars["{{client_party_name}}"], "", "C", false)
	pdf.SetXY(20, yRow1 + 12)

	// Row 2: Signatures QR Code space (Height 25mm)
	sigY := pdf.GetY()
	pdf.CellFormat(85, 25, "", "1", 0, "C", false, 0, "")
	pdf.CellFormat(85, 25, "", "1", 1, "C", false, 0, "")

	verifyURL := vars["[Verification URL]"]
	qrPNG, err := uc.generateQRImageWithLogo(verifyURL, "templates/logo_halalcore.png")
	if err == nil {
		pdf.RegisterImageOptionsReader("qr_p1", fpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions("qr_p1", 52.5, sigY + 2.5, 20, 20, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")

		pdf.RegisterImageOptionsReader("qr_p2", fpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions("qr_p2", 137.5, sigY + 2.5, 20, 20, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
	}

	// Row 3: Signatory names
	pdf.SetFont("Times", "B", 9.5)
	pdf.CellFormat(85, 7.5, vars["{{advisor_name}}"], "1", 0, "C", false, 0, "")
	pdf.CellFormat(85, 7.5, vars["{{client_signatory_name}}"], "1", 1, "C", false, 0, "")

	// Row 4: Signatory roles
	pdf.SetFont("Times", "", 8.5)
	pdf.CellFormat(85, 6, "ID Advisor: "+vars["{{advisor_id}}"], "1", 0, "C", false, 0, "")
	pdf.CellFormat(85, 6, vars["{{client_signatory_capacity}}"], "1", 1, "C", false, 0, "")

	// Row 5: Metadata (Grey background)
	yRow5 := pdf.GetY()
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(20, yRow5, 85, 12, "DF")
	pdf.SetXY(20, yRow5 + 1.5)
	pdf.MultiCell(85, 4.5, "Ditandatangani: "+vars["{{generated_at_local}}"]+"\nMetode: Tanda Tangan Elektronik (OTP)", "", "C", false)

	pdf.SetXY(105, yRow5)
	pdf.Rect(105, yRow5, 85, 12, "DF")
	pdf.SetXY(105, yRow5 + 1.5)
	pdf.MultiCell(85, 4.5, "Ditandatangani: "+vars["{{generated_at_local}}"]+"\nMetode: Tanda Tangan Elektronik (OTP)", "", "C", false)
	pdf.SetXY(20, yRow5 + 12)

	// === PAGE LAMPIRAN 1 ===
	pdf.AddPage()
	pdf.SetFont("Times", "B", 12)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(0, 6, "LAMPIRAN 1", "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, "RINGKASAN PENGAJUAN DAN PESANAN LAYANAN", "", 1, "L", false, 0, "")
	pdf.SetFont("Times", "I", 9)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(0, 5, fmt.Sprintf("Lampiran Perjanjian Nomor %s | Pengajuan %s", vars["{{contract_number}}"], vars["{{application_number}}"]), "", 1, "L", false, 0, "")
	pdf.Ln(4)

	drawRow := func(label, value string) {
		pdf.SetFillColor(240, 249, 255)
		pdf.SetFont("Times", "B", 9.5)
		pdf.SetTextColor(12, 74, 110)
		pdf.CellFormat(50, 7, "  "+label, "1", 0, "L", true, 0, "")
		
		pdf.SetFillColor(255, 255, 255)
		pdf.SetFont("Times", "", 9.5)
		pdf.SetTextColor(51, 65, 85)
		pdf.CellFormat(120, 7, "  "+value, "1", 1, "L", true, 0, "")
	}

	// Identitas Pengaju Table
	pdf.SetFont("Times", "B", 10)
	pdf.SetFillColor(12, 74, 110)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(0, 7.5, " A. IDENTITAS PENGAJU", "1", 1, "L", true, 0, "")
	
	pdf.SetTextColor(0, 0, 0)
	drawRow("Nama Pelaku Usaha", vars["{{client_party_name}}"])
	drawRow("Nama Usaha/Merek", vars["{{client_party_name}}"]+" / "+vars["{{service_package}}"])
	drawRow("NIB", vars["{{client_nib}}"]+" jika ada")
	drawRow("Skala Usaha", vars["{{business_scale}}"])
	drawRow("Alamat Usaha", vars["{{business_address}}"])
	drawRow("Narahubung", fmt.Sprintf("%s | %s | %s", vars["{{client_contact_name}}"], vars["{{client_phone}}"], vars["{{client_email}}"]))
	pdf.Ln(4)

	// Ruang Lingkup Table
	pdf.SetFont("Times", "B", 10)
	pdf.SetFillColor(12, 74, 110)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(0, 7.5, " B. RUANG LINGKUP PENGAJUAN", "1", 1, "L", true, 0, "")
	
	pdf.SetTextColor(0, 0, 0)
	drawRow("Skema", vars["{{service_scheme}}"])
	drawRow("Paket", vars["{{service_package}}"])
	drawRow("Kategori Produk", vars["{{product_category}}"])
	drawRow("Produk/Varian", vars["{{product_count}}"]+" produk/varian — "+vars["{{product_summary}}"])
	drawRow("Pabrik/Cabang", vars["{{facility_count}}"]+" lokasi — "+vars["{{facility_summary}}"])
	drawRow("Ketentuan Khusus", vars["{{special_terms_or_dash}}"]+" / dikosongkan")
	pdf.Ln(4)

	// Rincian Biaya Table
	pdf.SetFont("Times", "B", 10)
	pdf.SetFillColor(12, 74, 110)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(0, 7.5, " C. RINCIAN BIAYA", "1", 1, "L", true, 0, "")
	
	pdf.CellFormat(120, 7.5, "  Komponen Biaya", "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 7.5, "Jumlah  ", "1", 1, "R", true, 0, "")

	pdf.SetTextColor(51, 65, 85)
	pdf.SetFont("Times", "", 9.5)

	var breakdown []struct {
		Name     string  `json:"name"`
		Category string  `json:"category"`
		Price    float64 `json:"price"`
		Quantity float64 `json:"quantity"`
		Total    float64 `json:"total"`
	}

	if vars["[CostBreakdownJSON]"] != "" {
		if err := json.Unmarshal([]byte(vars["[CostBreakdownJSON]"]), &breakdown); err == nil {
			for _, item := range breakdown {
				pdf.SetFillColor(255, 255, 255)
				pdf.CellFormat(120, 7, "  "+item.Name, "1", 0, "L", true, 0, "")
				
				formattedVal := uc.formatIDR(item.Total)
				if item.Total < 0 || strings.ToUpper(item.Category) == "DISKON" {
					formattedVal = "(" + uc.formatIDR(-item.Total) + ")"
				}
				pdf.CellFormat(50, 7, formattedVal+"  ", "1", 1, "R", true, 0, "")
			}
		}
	}

	if len(breakdown) == 0 {
		pdf.CellFormat(120, 7, "  Jasa Pendampingan", "1", 0, "L", true, 0, "")
		pdf.CellFormat(50, 7, vars["[Jasa Pendampingan]"]+"  ", "1", 1, "R", true, 0, "")
		pdf.CellFormat(120, 7, "  Biaya Pihak Ketiga", "1", 0, "L", true, 0, "")
		pdf.CellFormat(50, 7, vars["[Biaya Pihak Ketiga]"]+"  ", "1", 1, "R", true, 0, "")
		pdf.CellFormat(120, 7, "  Diskon", "1", 0, "L", true, 0, "")
		pdf.CellFormat(50, 7, "("+vars["[Diskon]"]+")  ", "1", 1, "R", true, 0, "")
	}

	// Total Row
	pdf.SetFillColor(240, 249, 255)
	pdf.SetFont("Times", "B", 9.5)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(120, 8, "  TOTAL", "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 8, vars["{{total_contract_amount_formatted}}"]+"  ", "1", 1, "R", true, 0, "")
	pdf.Ln(4)

	// Kontak Resmi Info Box
	yPosD := pdf.GetY()
	pdf.SetFillColor(248, 250, 252)
	pdf.SetDrawColor(226, 232, 240)
	pdf.Rect(20, yPosD, 170, 15, "DF")
	
	pdf.SetXY(22, yPosD + 2.5)
	pdf.SetFont("Times", "B", 9.5)
	pdf.SetTextColor(12, 74, 110)
	pdf.Write(4.5, "D. KONTAK RESMI. ")
	pdf.SetFont("Times", "", 9)
	pdf.SetTextColor(71, 85, 105)
	contactText := fmt.Sprintf("Halal Advisor: %s (ID %s), %s, %s | Layanan pelanggan: %s | Pengaduan: %s | Privasi: %s.",
		vars["{{advisor_name}}"], vars["{{advisor_id}}"], vars["{{advisor_phone}}"], vars["{{advisor_email}}"],
		vars["{{customer_service_contact}}"], vars["{{complaint_channel}}"], vars["{{privacy_contact}}"])
	pdf.Write(4.5, contactText)
	pdf.SetXY(20, yPosD + 15)
	pdf.Ln(6)

	// Footer note
	pdf.SetFont("Times", "I", 8.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.MultiCell(0, 4.5, "Lampiran ini dibuat otomatis dari data pengajuan dan disetujui bersamaan dengan Perjanjian. Perubahan setelah finalisasi harus tercatat sebagai revisi atau addendum dan ditandatangani ulang bila mengubah substansi hak atau kewajiban Para Pihak.", "", "L", false)

	// === PAGE LAMPIRAN 2 ===
	pdf.AddPage()
	pdf.SetFont("Times", "B", 12)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(0, 6, "LAMPIRAN 2", "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, "PERSETUJUAN PENGAJUAN DAN KUASA TERBATAS", "", 1, "L", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Times", "", 10)
	pdf.SetTextColor(51, 65, 85)
	pdf.MultiCell(0, 5.5, "PIHAK KEDUA dengan ini:\n" +
		"    (1)  menyatakan seluruh data, dokumen, foto, daftar bahan, daftar produk, dan uraian proses yang diberikan adalah benar, lengkap, dan sesuai kondisi usaha pada saat diajukan;\n" +
		"    (2)  memberikan kuasa terbatas kepada PT Ana Nahnu Indonesia melalui Halal Advisor yang ditunjuk untuk menyiapkan, memasukkan, mengunggah, mengoreksi, memantau, dan mengomunikasikan data pengajuan pada sistem resmi, sejauh diizinkan oleh sistem dan hukum;\n" +
		"    (3)  memahami bahwa kuasa terbatas ini tidak mencakup kewenangan untuk membuat pernyataan palsu, mengubah fakta usaha, menandatangani pernyataan kehalalan yang wajib dilakukan pelaku usaha, menerima dana atas nama PIHAK KEDUA, atau melakukan tindakan lain di luar pengurusan administratif pengajuan;\n" +
		"    (4)  menyetujui penyampaian data kepada pihak berwenang dan mitra pemrosesan yang diperlukan sebagaimana Pasal 10; dan\n" +
		"    (5)  wajib segera mencabut atau memperbarui kuasa apabila terjadi perubahan wakil, kontak, produk, bahan, proses, fasilitas, atau keadaan lain yang memengaruhi pengajuan.\n\n" +
		"Persetujuan ini berlaku sejak Perjanjian efektif sampai pengajuan selesai, dihentikan, atau kuasa dicabut secara tertulis. Pencabutan tidak memengaruhi tindakan sah yang telah dilakukan sebelum pemberitahuan diterima.", "", "J", false)
	pdf.Ln(6)

	// Konfirmasi Table
	pdf.SetFont("Times", "B", 10.5)
	pdf.SetTextColor(12, 74, 110)
	pdf.CellFormat(0, 6, "KONFIRMASI PIHAK KEDUA", "", 1, "C", false, 0, "")
	pdf.Ln(2)

	drawRow("Nama Penanda Tangan", vars["{{client_signatory_name}}"])
	drawRow("Kapasitas", "Pemohon")
	drawRow("Tanggal/Waktu", vars["{{generated_at_local}}"])
	
	// Signature row
	yRowSign := pdf.GetY()
	pdf.SetFillColor(240, 249, 255)
	pdf.SetFont("Times", "B", 9.5)
	pdf.CellFormat(50, 15, "  Tanda Tangan/Afirmasi", "1", 0, "L", true, 0, "")
	
	pdf.SetFillColor(255, 255, 255)
	pdf.CellFormat(120, 15, "", "1", 1, "L", true, 0, "")
	
	// Draw a small QR Code inside the signature cell
	if err == nil {
		pdf.ImageOptions("qr_p2", 85, yRowSign + 1.5, 12, 12, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (uc *documentUsecase) cleanXml(xml string) string {
	reSpell := regexp.MustCompile(`<w:proofErr w:type="(spellStart|spellEnd)"/>`)
	xml = reSpell.ReplaceAllString(xml, "")

	// 2. Remove language tags and other formatting that can split text
	reLang := regexp.MustCompile(`<w:lang w:val="[^"]+"/>`)
	xml = reLang.ReplaceAllString(xml, "")

	// Remove RSID attributes from runs which also cause splits
	reRsid := regexp.MustCompile(` w:rsidRPr="[0-9A-F]+"`)
	xml = reRsid.ReplaceAllString(xml, "")
	reRsid2 := regexp.MustCompile(` w:rsidR="[0-9A-F]+"`)
	xml = reRsid2.ReplaceAllString(xml, "")

	// 3. Merge split text runs
	// Target: </w:t></w:r><w:r><w:t...>
	xml = strings.ReplaceAll(xml, "</w:t></w:r><w:r><w:t>", "")
	xml = strings.ReplaceAll(xml, "</w:t></w:r><w:r><w:t xml:space=\"preserve\">", "")

	return xml
}

// GenerateSPH generates a Surat Penawaran Halal (SPH) from Template_SPH.docx
// for a REGULER submission.
func (uc *documentUsecase) GenerateSPH(submissionID uuid.UUID) ([]byte, string, error) {
	submission, err := uc.SubmissionRepo.FindByID(submissionID)
	if err != nil {
		return nil, "", fmt.Errorf("submission not found: %w", err)
	}

	if submission.ServiceType != "REGULER" {
		return nil, "", fmt.Errorf("SPH hanya tersedia untuk pengajuan REGULER")
	}

	businessName := ""
	if submission.Client.BusinessName != "" {
		businessName = submission.Client.BusinessName
	} else {
		businessName = submission.Client.ClientName
	}

	vars := map[string]string{
		"[Nama Perusahaan/Usaha]": businessName,
	}

	templatePath := "templates/Template_SPH.docx"
	r, err := zip.OpenReader(templatePath)
	if err != nil {
		return nil, "", fmt.Errorf("template SPH tidak ditemukan: %w", err)
	}
	defer r.Close()

	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	for _, f := range r.File {
		fw, err := w.Create(f.Name)
		if err != nil {
			return nil, "", err
		}
		rc, err := f.Open()
		if err != nil {
			return nil, "", err
		}

		if f.Name == "word/document.xml" {
			content, err := io.ReadAll(rc)
			if err != nil {
				return nil, "", err
			}
			xmlStr := uc.cleanXml(string(content))
			for k, v := range vars {
				xmlStr = strings.ReplaceAll(xmlStr, k, v)
			}
			_, err = fw.Write([]byte(xmlStr))
		} else {
			_, err = io.Copy(fw, rc)
		}
		_ = rc.Close()
		if err != nil {
			return nil, "", err
		}
	}
	_ = w.Close()

	filename := fmt.Sprintf("SPH_%s.docx", strings.ReplaceAll(businessName, " ", "_"))
	return buf.Bytes(), filename, nil
}

// GenerateTeleAgreementPDF generates the signed agreement PDF for telemarketing.
// It embeds the QR code in the signature area.
func (uc *documentUsecase) GenerateTeleAgreementPDF(agreementID uuid.UUID) ([]byte, string, error) {
	agreement, err := uc.TeleAgreementRepo.FindByID(agreementID)
	if err != nil {
		return nil, "", fmt.Errorf("agreement not found: %w", err)
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()

	// Helper to add centered bold text
	centerBold := func(text string, size float64) {
		pdf.SetFont("Arial", "B", size)
		pdf.CellFormat(0, 7, text, "", 1, "C", false, 0, "")
	}

	// Header
	centerBold("PERJANJIAN LAYANAN PENDAMPINGAN SERTIFIKASI HALAL", 14)
	centerBold("HALALCORE", 10)
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 5, "Nomor: "+agreement.AgreementNumber, "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Body
	pdf.SetFont("Arial", "", 10)
	intro := fmt.Sprintf("Dokumen ini merupakan perjanjian yang disepakati secara elektronik pada tanggal %s oleh dan antara:",
		agreement.SignedAt.Format("02 Jan 2006 15:04 WIB"))
	pdf.MultiCell(0, 5, intro, "", "L", false)
	pdf.Ln(5)

	// PIHAK PERTAMA
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(0, 5, "PIHAK PERTAMA", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pihak1 := "HALALCORE (PT Ana Nahnu Indonesia)\nBeralamat di: Banjarsari - Ciamis - Jawa Barat"
	pdf.MultiCell(0, 5, pihak1, "", "L", false)
	pdf.Ln(4)

	// PIHAK KEDUA
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(0, 5, "PIHAK KEDUA", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(40, 5, "Nama Usaha", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+agreement.BusinessName, "0", 1, "L", false, 0, "")
	pdf.CellFormat(40, 5, "Penanggung Jawab", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+agreement.PICName, "0", 1, "L", false, 0, "")
	pdf.CellFormat(40, 5, "Alamat", "0", 0, "L", false, 0, "")
	pdf.MultiCell(0, 5, ": "+agreement.Address, "", "L", false)
	pdf.CellFormat(40, 5, "Email", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+agreement.Email, "0", 1, "L", false, 0, "")
	pdf.CellFormat(40, 5, "No. HP", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+agreement.Phone, "0", 1, "L", false, 0, "")
	pdf.Ln(10)

	pdf.MultiCell(0, 5, "Para pihak sepakat untuk mengikatkan diri dalam Perjanjian Layanan Pendampingan Sertifikasi Halal dengan rincian biaya dan persetujuan yang telah disahkan secara elektronik melalui sistem Halalcore.", "", "L", false)
	pdf.Ln(10)

	// Signatures
	yPos := pdf.GetY()

	// PIHAK PERTAMA
	pdf.SetXY(20, yPos)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(80, 5, "PIHAK PERTAMA", "0", 1, "L", false, 0, "")
	pdf.CellFormat(80, 5, "PT Ana Nahnu Indonesia", "0", 1, "L", false, 0, "")
	pdf.Ln(15)
	pdf.CellFormat(80, 5, "( ____________________ )", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(80, 5, "Halalcore Admin", "0", 1, "L", false, 0, "")

	// PIHAK KEDUA (Client) with QR Code
	pdf.SetXY(110, yPos)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(80, 5, "PIHAK KEDUA", "0", 1, "L", false, 0, "")
	pdf.CellFormat(80, 5, agreement.BusinessName, "0", 1, "L", false, 0, "")
	
	// Draw QR Code
	// Get base URL for verification link
	settings, _ := uc.SettingRepo.GetAllSettings()
	settingMap := make(map[string]string)
	for _, s := range settings {
		settingMap[s.Key] = s.Value
	}
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = os.Getenv("APP_FRONTEND_URL")
	}
	if frontendURL == "" {
		frontendURL = uc.getSetting(settingMap, "FRONTEND_URL", "https://halalcore.id")
	}
	verifyURL := fmt.Sprintf("%s/verify/agreement/%s/%s", frontendURL, agreement.ID.String(), agreement.VerificationToken)
	
	// Embed QR using fpdf RegisterImageOptions
	// Since go-qrcode outputs PNG, we can use RegisterImageOptionsReader
	qrPNG, err := uc.generateQRImageWithLogo(verifyURL, "templates/logo_halalcore.png")
	if err == nil {
		pdf.RegisterImageOptionsReader("signature_qr", fpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		// X: 110 (PIHAK KEDUA), Y: current Y + 10, W: 25, H: 25
		pdf.ImageOptions("signature_qr", 110, pdf.GetY()+2, 25, 25, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
	}

	pdf.SetY(pdf.GetY() + 30) // Move down past QR code
	pdf.SetX(110)
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(80, 5, "Ditandatangani secara elektronik oleh:", "0", 1, "L", false, 0, "")
	pdf.SetX(110)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(80, 5, agreement.PICName, "0", 1, "L", false, 0, "")

	pdf.Ln(15)
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(0, 5, "Catatan: Dokumen ini dihasilkan secara otomatis dan sah secara hukum tanpa tanda tangan basah.", "0", 1, "C", false, 0, "")
	pdf.CellFormat(0, 5, "Scan QR code untuk memverifikasi keabsahan dokumen.", "0", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, "", err
	}

	filename := fmt.Sprintf("Agreement_%s.pdf", strings.ReplaceAll(agreement.BusinessName, " ", "_"))
	return buf.Bytes(), filename, nil
}

// Helper to wrap the qrcode generation
func (uc *documentUsecase) generateQRImageWithLogo(url, logoPath string) ([]byte, error) {
	// Import "ananahnu/pkg/qrcode" in document_usecase.go
	return qrcode.GenerateWithLogo(url, logoPath)
}

// GenerateInvoicePDF generates the customized invoice PDF with a QR code signature.
func (uc *documentUsecase) GenerateInvoicePDF(submissionID uuid.UUID) ([]byte, string, error) {
	// Fetch Invoice
	invoice, err := uc.InvoiceRepo.FindBySubmissionID(submissionID)
	if err != nil || invoice == nil {
		return nil, "", fmt.Errorf("invoice not found")
	}

	// Fetch Submission to get client details
	submission, err := uc.SubmissionRepo.FindByID(submissionID)
	if err != nil {
		return nil, "", fmt.Errorf("submission not found")
	}

	// Fetch Cost Detail
	var breakdown []map[string]interface{}
	costDetail, err := uc.BillingConfigRepo.GetSubmissionCostDetail(submissionID)
	if err == nil && costDetail != nil && costDetail.CostBreakdownData != "" {
		_ = json.Unmarshal([]byte(costDetail.CostBreakdownData), &breakdown)
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// Logo
	logoPath := "templates/logo_halalcore.png"
	if _, err := os.Stat(logoPath); err == nil {
		pdf.ImageOptions(logoPath, 15, 15, 40, 0, false, fpdf.ImageOptions{ImageType: "PNG", ReadDpi: true}, 0, "")
	}

	// Header
	pdf.SetFont("Arial", "B", 24)
	pdf.SetTextColor(50, 100, 150)
	pdf.SetXY(120, 15)
	pdf.CellFormat(75, 10, "Invoice", "", 1, "R", false, 0, "")

	// Invoice Info
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetXY(120, 30)
	pdf.CellFormat(30, 5, "Referensi", "", 0, "R", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(45, 5, fmt.Sprintf("INV/%d/%04d", invoice.CreatedAt.Year(), invoice.ID), "", 1, "R", false, 0, "")

	pdf.SetXY(120, 35)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(30, 5, "Tanggal", "", 0, "R", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(45, 5, invoice.CreatedAt.Format("02/01/2006"), "", 1, "R", false, 0, "")

	pdf.SetXY(120, 40)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(30, 5, "Tgl. Jatuh Tempo", "", 0, "R", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	// Assume due date is 14 days after creation
	pdf.CellFormat(45, 5, invoice.CreatedAt.AddDate(0, 0, 14).Format("02/01/2006"), "", 1, "R", false, 0, "")

	pdf.Ln(20)

	// Company Info & Billed To
	yPos := pdf.GetY()
	
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(90, 5, "Info Perusahaan", "B", 0, "L", false, 0, "")
	pdf.CellFormat(10, 5, "", "", 0, "", false, 0, "") // spacer
	pdf.CellFormat(80, 5, "Tagihan Untuk", "B", 1, "L", false, 0, "")
	pdf.Ln(3)

	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(90, 5, "PT Ana Nahnu Indonesia", "", 0, "L", false, 0, "")
	pdf.CellFormat(10, 5, "", "", 0, "", false, 0, "")
	businessName := submission.Client.BusinessName
	if businessName == "" {
		businessName = submission.Client.ClientName
	}
	if businessName == "" {
		businessName = "Unknown Client"
	}
	pdf.CellFormat(80, 5, businessName, "", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "", 10)
	
	// Address and contact
	companyAddress := "Jl Raya Banjarsari no 153 Desa Cibadak,\nKab Ciamis,\nJawa Barat,\nTelp: 081564955280\nEmail: ananahnuindonesia@gmail.com"
	clientContact := fmt.Sprintf("Telp: %s", submission.Client.Phone)
	
	xBefore := pdf.GetX()
	yBefore := pdf.GetY()
	pdf.MultiCell(90, 5, companyAddress, "", "L", false)
	
	pdf.SetXY(xBefore+100, yBefore)
	pdf.MultiCell(80, 5, clientContact, "", "L", false)
	
	pdf.Ln(15)

	// Table Header
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(40, 50, 70) // Dark blue-grey
	pdf.SetTextColor(255, 255, 255)
	
	pdf.CellFormat(60, 8, "Produk", "", 0, "L", true, 0, "")
	pdf.CellFormat(30, 8, "Deskripsi", "", 0, "L", true, 0, "")
	pdf.CellFormat(20, 8, "Kuantitas", "", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Harga (Rp)", "", 0, "R", true, 0, "")
	pdf.CellFormat(40, 8, "Jumlah (Rp)", "", 1, "R", true, 0, "")
	
	// Table Body
	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(245, 245, 245)
	
	fill := false
	
	if len(breakdown) > 0 {
		for _, item := range breakdown {
			name := ""
			if val, ok := item["category"].(string); ok {
				name = val
			} else if val, ok := item["item_name"].(string); ok {
				name = val
			}
			
			qty := 1.0
			if val, ok := item["quantity"].(float64); ok {
				qty = val
			}
			
			price := 0.0
			if val, ok := item["amount"].(float64); ok {
				price = val
			} else if val, ok := item["unit_price"].(float64); ok {
				price = val
			}
			
			total := qty * price
			if val, ok := item["total"].(float64); ok {
				total = val
			}

			// Add row
			pdf.CellFormat(60, 8, name, "", 0, "L", fill, 0, "")
			pdf.CellFormat(30, 8, "Layanan", "", 0, "L", fill, 0, "")
			pdf.CellFormat(20, 8, fmt.Sprintf("%.0f", qty), "", 0, "C", fill, 0, "")
			pdf.CellFormat(30, 8, uc.formatIDR(price), "", 0, "R", fill, 0, "")
			pdf.CellFormat(40, 8, uc.formatIDR(total), "", 1, "R", fill, 0, "")
			
			fill = !fill
		}
	} else {
		// Fallback if no breakdown
		pdf.CellFormat(60, 8, "Biaya Layanan Sertifikasi", "", 0, "L", fill, 0, "")
		pdf.CellFormat(30, 8, "Layanan", "", 0, "L", fill, 0, "")
		pdf.CellFormat(20, 8, "1", "", 0, "C", fill, 0, "")
		pdf.CellFormat(30, 8, uc.formatIDR(invoice.Amount), "", 0, "R", fill, 0, "")
		pdf.CellFormat(40, 8, uc.formatIDR(invoice.Amount), "", 1, "R", fill, 0, "")
	}

	pdf.Ln(5)

	// Summary
	pdf.SetFont("Arial", "B", 10)
	pdf.SetX(100)
	pdf.CellFormat(40, 7, "Subtotal", "B", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(40, 7, "Rp "+uc.formatIDR(invoice.Amount), "B", 1, "R", false, 0, "")
	
	pdf.SetFont("Arial", "B", 10)
	pdf.SetX(100)
	pdf.CellFormat(40, 7, "Total", "B", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(40, 7, "Rp "+uc.formatIDR(invoice.Amount), "B", 1, "R", false, 0, "")
	
	pdf.SetFont("Arial", "B", 10)
	pdf.SetX(100)
	pdf.CellFormat(40, 7, "Sisa Tagihan", "B", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	if invoice.Status == "PAID" {
		pdf.CellFormat(40, 7, "Rp 0", "B", 1, "R", false, 0, "")
	} else {
		pdf.CellFormat(40, 7, "Rp "+uc.formatIDR(invoice.Amount), "B", 1, "R", false, 0, "")
	}

	pdf.Ln(20)

	// Keterangan & Signature
	yPos = pdf.GetY()
	
	// Keterangan
	pdf.SetXY(15, yPos)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(90, 7, "Keterangan", "B", 1, "L", false, 0, "")
	pdf.Ln(2)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(90, 5, "Transfer Bank", "", 1, "L", false, 0, "")
	pdf.CellFormat(90, 5, "Bank: BNI", "", 1, "L", false, 0, "")
	pdf.CellFormat(90, 5, "Nomor Rekening: 1825073247", "", 1, "L", false, 0, "")
	pdf.CellFormat(90, 5, "Atas Nama: PT. Ana Nahnu Indonesia", "", 1, "L", false, 0, "")
	
	// Signature (QR Code)
	pdf.SetXY(130, yPos)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(50, 7, time.Now().Format("02 Jan, 2006"), "", 1, "C", false, 0, "")
	
	// Generate QR Code for Invoice Verification
	settings, _ := uc.SettingRepo.GetAllSettings()
	settingMap := make(map[string]string)
	for _, s := range settings {
		settingMap[s.Key] = s.Value
	}
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = os.Getenv("APP_FRONTEND_URL")
	}
	if frontendURL == "" {
		frontendURL = uc.getSetting(settingMap, "FRONTEND_URL", "https://halalcore.id")
	}
	verifyURL := fmt.Sprintf("%s/verify-invoice/%s", frontendURL, submissionID.String())
	
	qrPNG, err := uc.generateQRImageWithLogo(verifyURL, "templates/logo_halalcore.png")
	if err == nil {
		pdf.RegisterImageOptionsReader("invoice_qr", fpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions("invoice_qr", 140, pdf.GetY()+2, 30, 30, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
	}

	pdf.SetY(pdf.GetY() + 35)
	pdf.SetX(130)
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(50, 5, "Validasi Elektronik", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, "", err
	}

	filename := fmt.Sprintf("Invoice_%s.pdf", strings.ReplaceAll(businessName, " ", "_"))
	return buf.Bytes(), filename, nil
}

