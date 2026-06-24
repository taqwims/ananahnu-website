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

	// Verification URL for client agreement
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = os.Getenv("APP_FRONTEND_URL")
	}
	if frontendURL == "" {
		frontendURL = uc.getSetting(settingMap, "FRONTEND_URL", "https://halalcore.id")
	}
	// We can use the submission ID as the agreement validation ID for public checks
	vars["[Verification URL]"] = fmt.Sprintf("%s/verify-agreement/%s", frontendURL, submission.ID.String())

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
	
	// Define header with logo on all pages
	pdf.SetHeaderFunc(func() {
		logoPath := "templates/logo_halalcore_header.png"
		if _, err := os.Stat(logoPath); err == nil {
			// X: 20, Y: 10, W: 50.6, H: 17.6
			pdf.ImageOptions(logoPath, 20, 10, 50.6, 17.6, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
		}
	})

	// Set Margins: Left: 20mm, Top: 32mm (to prevent text overlap with header), Right: 20mm
	pdf.SetMargins(20, 32, 20)
	
	// Add Page 1
	pdf.AddPage()

	// Helper to add centered bold text
	pasalTitle := func(title string) {
		pdf.SetFont("Times", "B", 12)
		pdf.CellFormat(0, 6, title, "", 1, "C", false, 0, "")
	}

	pasalContent := func(content string) {
		pdf.SetFont("Times", "", 12)
		pdf.MultiCell(0, 5.5, content, "", "J", false)
		pdf.Ln(3)
	}

	// === PAGE 1 ===
	pdf.SetFont("Times", "B", 12)
	pdf.CellFormat(0, 6, "PERJANJIAN LAYANAN PENDAMPINGAN SERTIFIKASI HALAL SECARA", "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 6, "ELEKTRONIK", "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 6, "Nomor: "+vars["[Nomor Kontrak]"], "", 1, "C", false, 0, "")
	pdf.Ln(6)

	// Intro
	pdf.SetFont("Times", "", 12)
	pdf.MultiCell(0, 5.5, "Perjanjian ini merupakan perjanjian elektronik yang dibuat dan disepakati melalui Platform HalalCore antara:", "", "J", false)
	pdf.Ln(4)

	// Parties
	p1Text := "PT Ana Nahnu Indonesia selaku penyedia layanan pendampingan sertifikasi halal, selanjutnya disebut \"HALALCORE\"; dan"
	pdf.MultiCell(0, 5.5, p1Text, "", "J", false)
	pdf.Ln(4)

	p2Text := fmt.Sprintf("%s yang telah melakukan registrasi akun, mengisi data usaha, menyetujui syarat dan ketentuan layanan, serta melakukan pembayaran melalui Platform HalalCore, selanjutnya disebut \"KLIEN\".", vars["[Nama Klien / Perusahaan]"])
	pdf.MultiCell(0, 5.5, p2Text, "", "J", false)
	pdf.Ln(4)

	p3Text := "Kedua belah pihak sepakat untuk terikat pada seluruh ketentuan dalam Perjanjian Elektronik ini."
	pdf.MultiCell(0, 5.5, p3Text, "", "J", false)
	pdf.Ln(6)

	// Pasal 1
	pasalTitle("PASAL 1")
	pasalTitle("MAKSUD DAN TUJUAN")
	pasalContent("Perjanjian ini dibuat untuk mengatur kerja sama dalam layanan pendampingan proses sertifikasi halal produk KLIEN sesuai ketentuan peraturan perundang-undangan yang berlaku di Indonesia.")

	// Pasal 2
	pasalTitle("PASAL 2")
	pasalTitle("PERSETUJUAN ELEKTRONIK")
	pasalContent("1. KLIEN menyatakan telah membaca, memahami, dan menyetujui seluruh isi Perjanjian ini sebelum melakukan pembayaran.\n" +
		"2. Persetujuan KLIEN diberikan secara elektronik melalui:\n" +
		"   a. pembuatan akun pada Platform HalalCore;\n" +
		"   b. pengisian data usaha;\n" +
		"   c. pemberian tanda persetujuan (checkbox) pada syarat dan ketentuan layanan;\n" +
		"   d. verifikasi akun melalui sarana elektronik yang disediakan sistem; dan\n" +
		"   e. pembayaran biaya layanan.\n" +
		"3. Persetujuan sebagaimana dimaksud pada ayat (2) memiliki kekuatan hukum yang sama dengan tanda tangan konvensional sesuai ketentuan peraturan perundang-undangan yang berlaku.\n" +
		"4. Catatan elektronik yang tersimpan dalam sistem HalalCore merupakan alat bukti yang sah dan mengikat para pihak.")

	// === PAGE 2 ===
	pdf.AddPage()

	// Pasal 3
	pasalTitle("PASAL 3")
	pasalTitle("RUANG LINGKUP LAYANAN")
	pasalContent("HalalCore memberikan layanan meliputi:\n" +
		"1. Analisis kesiapan sertifikasi halal;\n" +
		"2. Penyusunan dan/atau review dokumen Sistem Jaminan Produk Halal (SJPH);\n" +
		"3. Pendampingan pendaftaran melalui sistem SIHALAL;\n" +
		"4. Pendampingan pemenuhan dokumen persyaratan;\n" +
		"5. Simulasi audit halal (pre-audit);\n" +
		"6. Koordinasi administratif dengan lembaga terkait;\n" +
		"7. Monitoring proses hingga terbit keputusan dari pihak berwenang.")

	// Pasal 4
	pasalTitle("PASAL 4")
	pasalTitle("BATAS TANGGUNG JAWAB")
	pasalContent("1. HalalCore bertanggung jawab pada proses pendampingan administrasi dan teknis.\n" +
		"2. Keputusan penerbitan sertifikat halal sepenuhnya merupakan kewenangan:\n" +
		"   a) BPJPH;\n" +
		"   b) MUI;\n" +
		"   c) LPH;\n" +
		"3. HalalCore tidak bertanggung jawab atas:\n" +
		"   a. penolakan akibat data tidak benar dari KLIEN;\n" +
		"   b. ketidaklengkapan dokumen;\n" +
		"   c. perubahan regulasi;\n" +
		"   d. keterlambatan pihak ketiga.")

	// Pasal 5
	pasalTitle("PASAL 5")
	pasalTitle("KEWAJIBAN KLIEN")
	pdf.SetFont("Times", "", 12)
	pdf.MultiCell(0, 5.5, "KLIEN wajib:\n" +
		"1. Menyediakan data dan dokumen yang benar dan lengkap;\n" +
		"2. Menjamin kehalalan bahan dan proses produksi;\n" +
		"3. Menunjuk PIC selama proses pendampingan;", "", "J", false)
	pdf.Ln(3)

	// === PAGE 3 ===
	pdf.AddPage()

	pdf.SetFont("Times", "", 12)
	pdf.MultiCell(0, 5.5, "4. Memberikan akses yang diperlukan untuk proses verifikasi;\n" +
		"5. Melakukan pembayaran sesuai ketentuan.", "", "J", false)
	pdf.Ln(4)

	// Pasal 6
	pasalTitle("PASAL 6")
	pasalTitle("NILAI KONTRAK DAN PEMBAYARAN")
	pasalContent(fmt.Sprintf("1. Nilai jasa sebesar:\n   Rp. %s (%s)\n   Termasuk biaya yang harus dibayarkan ke BPJPH, MUI, LPH dan biaya pelatihan (jika ada) sesuai rincian invoice yang terlampir.\n"+
		"2. Skema pembayaran:\n"+
		"   a. 70%% dibayarkan di awal sebelum pekerjaan dimulai;\n"+
		"   b. 30%% dibayarkan sebelum pengajuan final ke sistem SIHALAL.\n"+
		"3. Pembayaran dilakukan ke:\n"+
		"   Bank: BNI\n"+
		"   No. Rekening: 1825073247\n"+
		"   Atas Nama: PT Ana Nahnu Indonesia\n"+
		"4. Pembayaran dianggap sah setelah dana diterima pada rekening HalalCore.\n"+
		"5. Pembayaran yang berhasil diverifikasi oleh sistem HalalCore dianggap sebagai penerimaan dan persetujuan KLIEN terhadap seluruh isi Perjanjian ini.", vars["[Nominal]"], vars["[Terbilang]"]))

	// Pasal 7
	pasalTitle("PASAL 7")
	pasalTitle("JANGKA WAKTU")
	pasalContent(fmt.Sprintf("1. Perjanjian berlaku sejak sistem HalalCore mengonfirmasi pembayaran KLIEN dan tetap berlaku sampai seluruh layanan selesai dilaksanakan.\n"+
		"2. Estimasi penyelesaian maksimal: %s hari kerja sejak dokumen dinyatakan lengkap.\n"+
		"3. Keterlambatan dari pihak KLIEN memperpanjang jangka waktu secara otomatis.", vars["[60]"]))

	// === PAGE 4 ===
	pdf.AddPage()

	// Pasal 8
	pasalTitle("PASAL 8")
	pasalTitle("KERAHASIAAN")
	pasalContent("Kedua pihak wajib menjaga kerahasiaan seluruh informasi yang diperoleh selama pelaksanaan Perjanjian ini, termasuk namun tidak terbatas pada data usaha, formula produk, dan dokumen internal.")

	// Pasal 9
	pasalTitle("PASAL 9")
	pasalTitle("WANPRESTASI")
	pdf.SetFont("Times", "", 12)
	pdf.MultiCell(0, 5.5, "KLIEN dinyatakan wanprestasi apabila:\n" +
		"1. Tidak melakukan pembayaran sesuai ketentuan;\n" +
		"2. Memberikan data tidak benar;\n" +
		"3. Tidak kooperatif dalam proses pendampingan.\n" +
		"Dalam hal wanprestasi:\n" +
		"- HalalCore berhak menghentikan layanan;\n" +
		"- Pembayaran yang telah dilakukan tidak dapat diminta kembali.", "", "J", false)
	pdf.Ln(4)

	// Pasal 10
	pasalTitle("PASAL 10")
	pasalTitle("PEMBATALAN")
	pasalContent("1. Pembatalan oleh KLIEN setelah kontrak berjalan dikenakan biaya minimal 50% dari nilai kontrak.\n" +
		"2. Pembayaran yang telah dilakukan bersifat non-refundable.")

	// Pasal 11
	pasalTitle("PASAL 11")
	pasalTitle("FORCE MAJEURE")
	pdf.SetFont("Times", "", 12)
	pdf.MultiCell(0, 5.5, "Yang dimaksud force majeure meliputi:\n" +
		"- bencana alam;\n" +
		"- gangguan sistem nasional;\n" +
		"- kebijakan pemerintah;\n" +
		"- kondisi di luar kendali para pihak.\n" +
		"Dalam kondisi tersebut, kewajiban para pihak ditangguhkan sementara.", "", "J", false)
	pdf.Ln(3)

	// === PAGE 5 ===
	pdf.AddPage()

	// Pasal 12
	pasalTitle("PASAL 12")
	pasalTitle("PENYELASAIAN SENGKETA")
	pasalContent("1. Diselesaikan secara musyawarah terlebih dahulu;\n" +
		"2. Jika tidak tercapai, diselesaikan melalui Pengadilan Negeri Ciamis.")

	// Pasal 13 - Rekam Jejak
	pasalTitle("PASAL 13")
	pasalTitle("REKAM JEJAK ELEKTRONIK")
	pasalContent("1. HalalCore menyimpan seluruh rekam jejak elektronik yang berkaitan dengan transaksi dan pelaksanaan layanan, termasuk namun tidak terbatas pada:\n" +
		"   a. identitas akun pengguna;\n" +
		"   b. waktu registrasi;\n" +
		"   c. waktu persetujuan perjanjian;\n" +
		"   d. alamat IP perangkat;\n" +
		"   e. riwayat komunikasi;\n" +
		"   f. bukti pembayaran;\n" +
		"   g. dokumen yang diunggah KLIEN.\n" +
		"2. Rekam jejak elektronik tersebut merupakan bagian yang tidak terpisahkan dari Perjanjian ini dan dapat digunakan sebagai alat bukti yang sah apabila terjadi sengketa.")

	// Pasal 13 - Penutup
	pasalTitle("PASAL 13")
	pasalTitle("PENUTUP")
	pasalContent("Perjanjian Elektronik ini dibuat, disetujui, dan disimpan secara digital melalui Platform HalalCore. Dengan melakukan registrasi, menyetujui syarat dan ketentuan, serta melakukan pembayaran layanan, KLIEN menyatakan setuju dan terikat secara hukum terhadap seluruh ketentuan dalam Perjanjian ini. Perjanjian ini memiliki kekuatan hukum yang sama dengan perjanjian tertulis yang ditandatangani secara manual sesuai peraturan perundang-undangan yang berlaku.")

	// Add Signatures with Verification QR Code if possible
	pdf.Ln(5)
	yPos := pdf.GetY()

	// Ensure signature block isn't orphans on a new page without headers
	if yPos > 240 {
		pdf.AddPage()
		yPos = pdf.GetY()
	}

	// PIHAK PERTAMA
	pdf.SetXY(20, yPos)
	pdf.SetFont("Times", "B", 12)
	pdf.CellFormat(80, 5.5, "HALALCORE", "0", 1, "L", false, 0, "")
	pdf.CellFormat(80, 5.5, "PT Ana Nahnu Indonesia", "0", 1, "L", false, 0, "")
	pdf.Ln(15)
	pdf.CellFormat(80, 5.5, "( ____________________ )", "0", 1, "L", false, 0, "")
	pdf.SetFont("Times", "", 12)
	pdf.CellFormat(80, 5.5, "Nama: "+vars["[Nama Penandatangan]"], "0", 1, "L", false, 0, "")

	// PIHAK KEDUA (Client) with verification QR Code if we can construct the link
	pdf.SetXY(110, yPos)
	pdf.SetFont("Times", "B", 12)
	pdf.CellFormat(80, 5.5, "KLIEN", "0", 1, "L", false, 0, "")
	pdf.CellFormat(80, 5.5, vars["[Nama Klien / Perusahaan]"], "0", 1, "L", false, 0, "")

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

	verifyURL := vars["[Verification URL]"]
	if verifyURL == "" {
		verifyURL = frontendURL
	}

	qrPNG, err := uc.generateQRImageWithLogo(verifyURL, "templates/logo_halalcore.png")
	if err == nil {
		pdf.RegisterImageOptionsReader("contract_qr", fpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions("contract_qr", 110, yPos+12, 25, 25, false, fpdf.ImageOptions{ImageType: "PNG"}, 0, "")
		
		pdf.SetY(yPos + 38)
	} else {
		pdf.Ln(15)
		pdf.CellFormat(80, 5.5, "( ____________________ )", "0", 1, "L", false, 0, "")
	}

	pdf.SetX(110)
	pdf.SetFont("Times", "", 12)
	pdf.CellFormat(80, 5.5, "Ditandatangani secara elektronik", "0", 1, "L", false, 0, "")
	
	pdf.Ln(10)
	pdf.SetFont("Times", "I", 9)
	pdf.CellFormat(0, 5.5, "Catatan: Dokumen ini dihasilkan secara otomatis dan sah secara hukum tanpa tanda tangan basah.", "0", 1, "C", false, 0, "")

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

