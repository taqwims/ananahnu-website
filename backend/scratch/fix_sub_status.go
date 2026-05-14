package main

import (
	"ananahnu/internal/domain"
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=ananahnu port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	trackingNo := "AN-2605-6722"
	var sub domain.Submission
	if err := db.Preload("Client").Preload("Payments").First(&sub, "tracking_number = ?", trackingNo).Error; err != nil {
		log.Fatal("Submission not found: ", err)
	}

	fmt.Printf("Submission ID: %s\n", sub.ID)
	fmt.Printf("Current Status: %s\n", sub.Status)
	fmt.Printf("DataSource: %s\n", sub.DataSource)
	fmt.Printf("ServiceType: %s\n", sub.ServiceType)
	fmt.Printf("ConsultantID: %v\n", sub.ConsultantID)
	
	fmt.Println("\nPayments:")
	for _, p := range sub.Payments {
		fmt.Printf("- ID: %d, Amount: %.2f, Status: %s, Method: %s, ExternalID: %s\n", 
			p.ID, p.Amount, p.Status, p.Method, p.ExternalID)
	}

	// Fix it: Move to QC_OFFICER if paid (or if user says they paid)
	// We'll trust the user and force the status to QC_OFFICER for this specific case
	fmt.Println("\nFORCING UPDATE to QC_OFFICER...")
	
	// Update Submission Status
	if err := db.Model(&sub).Update("status", "QC_OFFICER").Error; err != nil {
		log.Fatal("Failed to update status: ", err)
	}

	// Also ensure DataSource is MARKETING
	if err := db.Model(&sub).Update("data_source", "MARKETING").Error; err != nil {
		log.Fatal("Failed to update data_source: ", err)
	}

	fmt.Println("Success! Submission is now in QC_OFFICER status.")
}
