package main

import (
	"log"

	"github.com/joho/godotenv"

	"ananahnu/internal/seeder"
	"ananahnu/pkg/database"
)

func main() {
	log.Println("Running database reset and seed from CLI...")

	// 1. Load Env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	// 2. Connect DB
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 3. Perform seeding
	if err := seeder.PerformResetAndSeed(db); err != nil {
		log.Fatalf("Seeder failed: %v", err)
	}

	log.Println("Database reset and seed completed successfully!")
}
