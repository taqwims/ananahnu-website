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
	trackingNum := "DRAFT"
	if submission.TrackingNumber != nil {
		trackingNum = *submission.TrackingNumber
	}
	vars["[Nomor Kontrak]"] = fmt.Sprintf("KONTRAK/%s/%s", now.Format("20060102"), trackingNum)
	vars["[hari]"] = days[now.Weekday()]
	vars["[tanggal]"] = fmt.Sprintf("%d %s %d", now.Day(), months[now.Month()], now.Year())
	vars["[kota]"] = uc.getSetting(settingMap, "COMPANY_CITY", "Ciamis")
	vars["[60]"] = uc.getSetting(settingMap, "CONTRACT_DURATION", "60")

	// Consultant Info (PT Ana Nahnu)
	vars["[Nama Perusahaan]"] = uc.getSetting(settingMap, "COMPANY_NAME", "PT Ana Nahnu Indonesia")
	vars["[Alamat Perusahaan]"] = uc.getSetting(settingMap, "COMPANY_ADDRESS", "Dusun Cikohkol, Desa Sukasari, Kecamatan Banjarsari, Kabupaten Ciamis, Jawa Barat 46383")
	vars["[Nomor NIB]"] = uc.getSetting(settingMap, "COMPANY_NIB", "1234567890")

	// Person signing for Consultant (Now using the assigned Consultant name)
	if submission.Consultant != nil {
		vars["[Nama Penandatangan]"] = submission.Consultant.FullName
		vars["[Jabatan]"] = "Advisor Halal"
	} else {
		// Fallback to Director if no consultant assigned
		vars["[Nama Penandatangan]"] = uc.getSetting(settingMap, "COMPANY_DIRECTOR_NAME", "Direktur Ana Nahnu")
		vars["[Jabatan]"] = uc.getSetting(settingMap, "COMPANY_DIRECTOR_POSITION", "Direktur Utama")
	}

	// Client Info
	client := submission.Client
	vars["[Nama Klien / Perusahaan]"] = client.BusinessName
	if vars["[Nama Klien / Perusahaan]"] == "" {
		vars["[Nama Klien / Perusahaan]"] = client.ClientName
	}
	vars["[Alamat Lengkap]"] = client.Address
	idDisplay := client.NIB
	if strings.HasPrefix(idDisplay, "DRAFT-") {
		idDisplay = ""
	}
	if client.NIK != "" {
		if idDisplay != "" {
			idDisplay = fmt.Sprintf("%s / %s", client.NIK, idDisplay)
		} else {
			idDisplay = client.NIK
		}
	}
	vars["[Nomor Identitas]"] = idDisplay
	vars["[Perusahaan jika ada]"] = client.BusinessName

	// Billing Info
	amount := 0.0
	if submission.CostDetail != nil {
		amount = submission.CostDetail.TotalAmount
	}
	vars["[Nominal]"] = uc.formatIDR(amount)
	vars["[Terbilang]"] = utils.TerbilangRupiah(amount)

	// 2. Generate File
	filename := fmt.Sprintf("Kontrak_%s", strings.ReplaceAll(vars["[Nama Klien / Perusahaan]"], " ", "_"))

	switch format {
	case "docx":
		buf, err := uc.generateDocx(vars)
		if err != nil {
			return nil, "", err
		}
		return buf, filename + ".docx", nil
	case "pdf":
		buf, err := uc.generatePDF(vars)
		if err != nil {
			return nil, "", err
		}
		return buf, filename + ".pdf", nil
	}

	return nil, "", fmt.Errorf("unsupported format: %s", format)
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
		rc.Close()
		if err != nil {
			return nil, err
		}
	}
	w.Close()
	return buf.Bytes(), nil
}

func (uc *documentUsecase) generatePDF(vars map[string]string) ([]byte, error) {
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
	centerBold("Nomor: "+vars["[Nomor Kontrak]"], 12)
	pdf.Ln(10)

	// Body
	pdf.SetFont("Arial", "", 10)
	intro := fmt.Sprintf("Pada hari ini, %s, tanggal %s, bertempat di %s, telah dibuat dan disepakati Perjanjian Layanan Pendampingan Sertifikasi Halal (“Perjanjian”) oleh dan antara:",
		vars["[hari]"], vars["[tanggal]"], vars["[kota]"])
	pdf.MultiCell(0, 5, intro, "", "L", false)
	pdf.Ln(5)

	// PIHAK PERTAMA
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(0, 5, "PIHAK PERTAMA", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pihak1 := vars["[Nama Perusahaan]"] + "\nBeralamat di: " + vars["[Alamat Perusahaan]"] + "\nNIB: " + vars["[Nomor NIB]"]
	pdf.MultiCell(0, 5, pihak1, "", "L", false)
	pdf.Ln(1)
	pdf.MultiCell(0, 5, fmt.Sprintf("Dalam hal ini diwakili oleh: %s, selaku %s, bertindak untuk dan atas nama %s", vars["[Nama Penandatangan]"], vars["[Jabatan]"], vars["[Nama Perusahaan]"]), "", "L", false)
	pdf.SetFont("Arial", "I", 10)
	pdf.CellFormat(0, 5, "Selanjutnya disebut: “KONSULTAN”", "0", 1, "L", false, 0, "")
	pdf.Ln(4)

	// PIHAK KEDUA
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(0, 5, "PIHAK KEDUA", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(40, 5, "Nama", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+vars["[Nama Klien / Perusahaan]"], "0", 1, "L", false, 0, "")
	pdf.CellFormat(40, 5, "Alamat", "0", 0, "L", false, 0, "")
	pdf.MultiCell(0, 5, ": "+vars["[Alamat Lengkap]"], "", "L", false)
	pdf.CellFormat(40, 5, "NIK/NIB", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, ": "+vars["[Nomor Identitas]"], "0", 1, "L", false, 0, "")
	pdf.Ln(2)
	pdf.MultiCell(0, 5, "Dalam hal ini bertindak untuk dan atas nama: "+vars["[Perusahaan jika ada]"], "", "L", false)
	pdf.SetFont("Arial", "I", 10)
	pdf.CellFormat(0, 5, "Selanjutnya disebut: “KLIEN”", "0", 1, "L", false, 0, "")
	pdf.Ln(10)

	// Articles (Summary for brevity, in real case we would add all)
	articles := []struct{ Title, Content string }{
		{"PASAL 1 - MAKSUD DAN TUJUAN", "Perjanjian ini dibuat untuk mengatur kerja sama dalam layanan pendampingan proses sertifikasi halal produk KLIEN sesuai ketentuan peraturan perundang-undangan yang berlaku di Indonesia."},
		{"PASAL 5 - NILAI KONTRAK DAN PEMBAYARAN", fmt.Sprintf("Nilai jasa sebesar: %s (%s). Termasuk biaya yang harus dibayarkan ke BPJPH, MUI, LPH dan biaya pelatihan (jika ada) sesuai rincian invoice yang terlampir.", vars["[Nominal]"], vars["[Terbilang]"])},
		{"PASAL 6 - JANGKA WAKTU", fmt.Sprintf("Perjanjian berlaku sejak tanggal ditandatangani. Estimasi penyelesaian maksimal: %s hari kerja sejak dokumen dinyatakan lengkap.", vars["[60]"])},
	}

	for _, art := range articles {
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(0, 5, art.Title, "0", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.MultiCell(0, 5, art.Content, "", "J", false)
		pdf.Ln(5)
	}

	// Signatures
	pdf.Ln(10)
	yPos := pdf.GetY()

	// PIHAK PERTAMA (Consultant)
	pdf.SetXY(20, yPos)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(80, 5, "PIHAK PERTAMA", "0", 1, "L", false, 0, "")
	pdf.CellFormat(80, 5, strings.ToUpper(vars["[Nama Perusahaan]"]), "0", 1, "L", false, 0, "")
	pdf.Ln(15)
	pdf.CellFormat(80, 5, "( ____________________ )", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(80, 5, "Nama: "+vars["[Nama Penandatangan]"], "0", 1, "L", false, 0, "")

	// PIHAK KEDUA (Client)
	pdf.SetXY(110, yPos)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(80, 5, "PIHAK KEDUA", "0", 1, "L", false, 0, "")
	pdf.Ln(5) // Placeholder line
	pdf.Ln(20)
	pdf.CellFormat(80, 5, "( ____________________ )", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(80, 5, "Nama: "+vars["[Nama Klien / Perusahaan]"], "0", 1, "L", false, 0, "")

	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(0, 5, "Catatan: Dokumen ini dihasilkan secara otomatis oleh sistem.", "0", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (uc *documentUsecase) cleanXml(xml string) string {
	// 1. Remove spell check tags that often split placeholders
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
		rc.Close()
		if err != nil {
			return nil, "", err
		}
	}
	w.Close()

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

