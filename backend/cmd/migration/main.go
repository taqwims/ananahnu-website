package main

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/repository"
	"ananahnu/internal/usecase"
	"ananahnu/pkg/database"
	"flag"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	filePath := flag.String("file", "migration_sample.xlsx", "Path to the Excel file to import")
	flag.Parse()

	if *filePath == "" {
		log.Fatal("Please provide a file path using -file flag")
	}

	// 1. Load Env
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("../../.env"); err != nil {
             log.Println("Note: .env file not found, using system environment variables") 
        }
	}

	// 2. Connect DB
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connected successfully")

	// 3. Init Dependencies & Migrate
	db.AutoMigrate(&domain.Client{})
	clientRepo := repository.NewClientRepository(db)
	importUC := usecase.NewImportUsecase(usecase.ImportUsecaseDeps{
		ClientRepo: clientRepo,
	})

	// 4. Open File
	file, err := os.Open(*filePath)
	if err != nil {
		log.Fatalf("Failed to open file %s: %v", *filePath, err)
	}
	defer file.Close()

	// 5. Run Import
	log.Printf("Starting import from %s...", *filePath)
	if err := importUC.ImportClients(file); err != nil {
		log.Fatalf("Import FAILED: %v", err)
	}

	log.Println("Import COMPLETED successfully!")
}
