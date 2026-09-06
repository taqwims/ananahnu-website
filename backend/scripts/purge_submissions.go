package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"ananahnu/internal/repository"
	"ananahnu/pkg/database"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	fmt.Println("==================================================")
	fmt.Println("⚠️  PERINGATAN: RESET / PURGE DATA PENGAJUAN (DEV)")
	fmt.Println("==================================================")
	fmt.Println("Perintah ini akan MENGHAPUS SEMUA DATA PENGAJUAN:")
	fmt.Println("- Form field values (isian dokumen)")
	fmt.Println("- Submission files (lampiran dokumen)")
	fmt.Println("- Submission cost details (rincian biaya)")
	fmt.Println("- SPH (surat pengajuan halal)")
	fmt.Println("- Invoices & Payments (tagihan dan riwayat bayar)")
	fmt.Println("- Commissions & Expenses pengajuan")
	fmt.Println("- Audit logs terkait pengajuan")
	fmt.Println("- Seluruh data pengajuan (termasuk SH Terbit)")
	fmt.Println("==================================================")
	fmt.Print("Ketik 'PURGE-DEV' untuk melanjutkan: ")

	reader := bufio.NewReader(os.Stdin)
	text, _ := reader.ReadString('\n')
	text = strings.TrimSpace(text)

	if text != "PURGE-DEV" {
		fmt.Println("Dibatalkan. Tidak ada data yang dihapus.")
		return
	}

	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("Gagal koneksi ke database: %v", err)
	}

	subRepo := repository.NewSubmissionRepository(db)
	if err := subRepo.PurgeAll(); err != nil {
		log.Fatalf("Gagal membersihkan data pengajuan: %v", err)
	}

	fmt.Println("\n✅ BERHASIL: Seluruh data pengajuan dan relasinya telah dibersihkan sepenuhnya!")
}
