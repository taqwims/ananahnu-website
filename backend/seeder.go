package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"time"
)

type BusinessType struct {
	ID          int64     `gorm:"primaryKey"`
	Name        string    `gorm:"not null"`
	Description string    
	CreatedAt   time.Time 
	UpdatedAt   time.Time 
}

type ProductCategory struct {
	ID             int64        `gorm:"primaryKey"`
	BusinessTypeID *int64        
	Name           string       `gorm:"not null"`
	Description    string       
	CreatedAt      time.Time    
	UpdatedAt      time.Time    
}

type BusinessScale struct {
	ID          int64     `gorm:"primaryKey"`
	Name        string    `gorm:"not null"` 
	Description string    
	CreatedAt   time.Time 
	UpdatedAt   time.Time 
}

type BillingComponent struct {
	ID              int64     `gorm:"primaryKey"`
	Name            string    `gorm:"not null"` 
	Category        string    `gorm:"not null;default:'OPSIONAL'"` 
	Type            string    `gorm:"not null"` 
	BaseAmount      float64   `gorm:"not null"`
	IsMandatory     bool      `gorm:"default:false"`
	
	BusinessScaleID   *int64    
	ProvinceID        *int64    
	RegencyID         *int64    
	DistrictID        *int64    
	BusinessTypeID    *int64    
	ProductCategoryID *int64    
	ServiceType       string    `gorm:"default:'REGULER'"`
	
	CreatedAt         time.Time 
	UpdatedAt       time.Time 
}

type Province struct {
	ID   int64  `gorm:"primaryKey"`
	Name string 
}

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=ananahnu port=5433 sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	// 1. Seed Business Scales
	scales := []BusinessScale{
		{Name: "Mikro"},
		{Name: "Kecil"},
		{Name: "Menengah"},
		{Name: "Besar"},
	}
	for i, s := range scales {
		db.FirstOrCreate(&scales[i], BusinessScale{Name: s.Name})
	}

	// 2. Seed Business Types
	bTypes := []BusinessType{
		{Name: "Makanan & Minuman"},
		{Name: "Kosmetik"},
		{Name: "Obat-obatan"},
	}
	for i, bt := range bTypes {
		db.FirstOrCreate(&bTypes[i], BusinessType{Name: bt.Name})
	}

	// 3. Seed Product Categories
	pCats := []ProductCategory{
		{Name: "Camilan Ringan", BusinessTypeID: &bTypes[0].ID},
		{Name: "Minuman Kemasan", BusinessTypeID: &bTypes[0].ID},
		{Name: "Skincare", BusinessTypeID: &bTypes[1].ID},
	}
	for i, pc := range pCats {
		db.FirstOrCreate(&pCats[i], ProductCategory{Name: pc.Name})
	}

	// Get DKI Jakarta ID if exists
	var dki Province
	db.Where("name ILIKE ?", "%DKI JAKARTA%").First(&dki)
	var dkiId *int64
	if dki.ID != 0 {
		dkiId = &dki.ID
	}

	// 4. Seed Billing Components
	components := []BillingComponent{
		{Name: "Biaya Pendaftaran BPJPH", Category: "BPJPH", Type: "FIXED", BaseAmount: 500000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Biaya Audit LPH (Umum)", Category: "LPH", Type: "PER_CABANG", BaseAmount: 3000000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Biaya Audit LPH (Khusus Jakarta)", Category: "LPH", Type: "PER_CABANG", BaseAmount: 4500000, IsMandatory: true, ProvinceID: dkiId, ServiceType: "REGULER"},
		{Name: "Biaya Sidang MUI", Category: "MUI", Type: "FIXED", BaseAmount: 1500000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Sertifikat BPJPH", Category: "BPJPH", Type: "FIXED", BaseAmount: 1000000, IsMandatory: true, ServiceType: "REGULER"},
		{Name: "Sertifikat BPJPH (Khusus Kosmetik)", Category: "BPJPH", Type: "FIXED", BaseAmount: 2000000, IsMandatory: true, BusinessTypeID: &bTypes[1].ID, ServiceType: "REGULER"},
	}
	for _, c := range components {
		db.FirstOrCreate(&c, BillingComponent{Name: c.Name})
	}

	fmt.Println("Seed data successfully applied!")
}
