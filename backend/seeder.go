package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"time"
)

type SalesScheme struct {
	ID          int64     `gorm:"primaryKey"`
	Name        string    `gorm:"not null"`
	Description string    
	CreatedAt   time.Time 
	UpdatedAt   time.Time 
}

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
	
	CreatedAt       time.Time 
	UpdatedAt       time.Time 
}

type SalesSchemePrice struct {
	ID                int64        `gorm:"primaryKey"`
	SalesSchemeID     int64        `gorm:"not null;index"`
	ProductCategoryID *int64       
	BusinessTypeID    *int64       
	BusinessScaleID   *int64       
	DataSource        string       `gorm:"not null;default:'ORGANIK'"` 
	BasePrice         float64      `gorm:"not null"`
	DiscountPercent   float64      `gorm:"default:0"` 
	Description       string       
	IsActive          bool         `gorm:"default:true"`
	CreatedAt         time.Time    
	UpdatedAt         time.Time    
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

	// 4. Seed Sales Schemes
	schemes := []SalesScheme{
		{Name: "Direct Sale"},
		{Name: "Partnership"},
	}
	for i, s := range schemes {
		db.FirstOrCreate(&schemes[i], SalesScheme{Name: s.Name})
	}

	// Get DKI Jakarta ID if exists
	var dki Province
	db.Where("name ILIKE ?", "%DKI JAKARTA%").First(&dki)
	var dkiId *int64
	if dki.ID != 0 {
		dkiId = &dki.ID
	}

	// 5. Seed Billing Components
	components := []BillingComponent{
		{Name: "Biaya Registrasi Dasar", Category: "REGISTRASI", Type: "FIXED", BaseAmount: 500000, IsMandatory: true},
		{Name: "Biaya Audit LPH (Umum)", Category: "LPH", Type: "FIXED", BaseAmount: 3000000, IsMandatory: true},
		{Name: "Biaya Audit LPH (Khusus Jakarta)", Category: "LPH", Type: "FIXED", BaseAmount: 4500000, IsMandatory: true, ProvinceID: dkiId},
		{Name: "Biaya Sidang MUI", Category: "MUI", Type: "FIXED", BaseAmount: 1500000, IsMandatory: true},
		{Name: "Sertifikat BPJPH", Category: "BPJPH", Type: "FIXED", BaseAmount: 1000000, IsMandatory: true},
		{Name: "Sertifikat BPJPH (Khusus Kosmetik)", Category: "BPJPH", Type: "FIXED", BaseAmount: 2000000, IsMandatory: true, BusinessTypeID: &bTypes[1].ID},
	}
	for _, c := range components {
		db.FirstOrCreate(&c, BillingComponent{Name: c.Name})
	}

	// 6. Seed Sales Scheme Prices
	prices := []SalesSchemePrice{
		// Default generic price for Direct Sale (5 juta)
		{SalesSchemeID: schemes[0].ID, BasePrice: 5000000, DataSource: "ORGANIK", Description: "Harga Dasar Umum"},
		// Specific price for Direct Sale -> Makanan -> Skala Mikro (3 juta)
		{SalesSchemeID: schemes[0].ID, BusinessTypeID: &bTypes[0].ID, BusinessScaleID: &scales[0].ID, BasePrice: 3000000, DataSource: "ORGANIK", Description: "Promo Makanan Mikro"},
		// Specific price for Direct Sale -> Kosmetik -> Semua Skala (8 juta)
		{SalesSchemeID: schemes[0].ID, BusinessTypeID: &bTypes[1].ID, BasePrice: 8000000, DataSource: "ORGANIK", Description: "Harga Dasar Kosmetik"},
		// Partnership generic price (4 juta, with 10% discount on LPH via frontend logic)
		{SalesSchemeID: schemes[1].ID, BasePrice: 4000000, DataSource: "MARKETING", Description: "Harga Dasar Partnership"},
	}
	for _, p := range prices {
		db.FirstOrCreate(&p, SalesSchemePrice{Description: p.Description})
	}

	fmt.Println("Seed data successfully applied!")
}
