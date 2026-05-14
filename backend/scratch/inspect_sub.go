package main

import (
	"ananahnu/internal/domain"
	"fmt"
	"log"
	"os"

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

	idStr := "a533493d-eb60-4a4b-8c92-90adc9f334c3"
	if len(os.Args) > 1 {
		idStr = os.Args[1]
	}

	id, _ := uuid.Parse(idStr)
	var sub domain.Submission
	if err := db.Preload("Client").First(&sub, "id = ?", id).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Printf("ID: %s\n", sub.ID)
	fmt.Printf("Status: %s\n", sub.Status)
	fmt.Printf("DataSource: %s\n", sub.DataSource)
	fmt.Printf("ConsultantID: %v\n", sub.ConsultantID)
	fmt.Printf("ServiceType: %s\n", sub.ServiceType)
}
