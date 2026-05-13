package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"ananahnu/internal/domain"
	"ananahnu/pkg/database"

	"github.com/joho/godotenv"
	"gorm.io/gorm/clause"
)

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

func main() {
	fmt.Println("🚀 Memulai proses download dan sinkronisasi seluruh data wilayah Indonesia...")
	fmt.Println("Waktu estimasi: ~2-5 Menit (Tergantung koneksi internet Anda)")

	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it, using system environment variables")
	}

	// Connect to DB
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// 1. Fetch Provinces
	fmt.Println("Mengunduh data Provinsi...")
	var apiProvinces []apiProvince
	if err := fetchJSON(fmt.Sprintf("%s/provinces.json", baseURL), &apiProvinces); err != nil {
		log.Fatalf("❌ Gagal mengunduh provinsi: %v", err)
	}

	for _, p := range apiProvinces {
		prov := domain.Province{
			ID:   parseInt(p.ID),
			Name: p.Name,
		}
		db.Clauses(clause.OnConflict{DoNothing: true}).Create(&prov)
	}
	fmt.Printf("✅ %d Provinsi berhasil diunduh dan disimpan.\n", len(apiProvinces))

	// 2. Fetch Regencies & Districts per Province Concurrently
	var wg sync.WaitGroup
	sem := make(chan struct{}, 10) // Limit concurrency to 10 to avoid hammering the API

	var totalRegencies, totalDistricts int
	var mu sync.Mutex

	for idx, prov := range apiProvinces {
		wg.Add(1)
		go func(i int, p apiProvince) {
			defer wg.Done()
			sem <- struct{}{}        // Acquire
			defer func() { <-sem }() // Release

			// Fetch Regencies
			var regencies []apiRegency
			if err := fetchJSON(fmt.Sprintf("%s/regencies/%s.json", baseURL, p.ID), &regencies); err != nil {
				fmt.Printf("⚠️ Gagal mengunduh kabupaten untuk provinsi %s: %v\n", p.Name, err)
				return
			}

			// Batch Insert Regencies
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

			mu.Lock()
			totalRegencies += len(regencies)
			mu.Unlock()

			// Fetch Districts per Regency
			for _, reg := range regencies {
				var districts []apiDistrict
				if err := fetchJSON(fmt.Sprintf("%s/districts/%s.json", baseURL, reg.ID), &districts); err != nil {
					fmt.Printf("⚠️ Gagal mengunduh kecamatan untuk kabupaten %s: %v\n", reg.Name, err)
					continue
				}

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

				mu.Lock()
				totalDistricts += len(districts)
				mu.Unlock()
			}
			fmt.Printf("[%d/%d] ✅ Selesai memproses Provinsi %s (%d Kabupaten)\n", i+1, len(apiProvinces), p.Name, len(regencies))
		}(idx, prov)
	}

	wg.Wait()
	fmt.Println("\n🎉 SEEDING WILAYAH SELESAI!")
	fmt.Printf("Total Provinsi : %d\n", len(apiProvinces))
	fmt.Printf("Total Kabupaten: %d\n", totalRegencies)
	fmt.Printf("Total Kecamatan: %d\n", totalDistricts)
	fmt.Println("Silakan reload aplikasi Anda untuk melihat data lengkapnya.")
}
