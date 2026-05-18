package usecase

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/utils"
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
)

type DocumentUsecase interface {
	GenerateContract(submissionID uuid.UUID, format string) ([]byte, string, error)
}

type DocumentUsecaseDeps struct {
	SubmissionRepo domain.SubmissionRepository
	SettingRepo    domain.SystemSettingRepository
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
		vars["[Jabatan]"] = "Konsultan Halal"
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
