package main

import (
	"ananahnu/internal/domain"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=ananahnu port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// 1. Find the CLIENT role
	var role domain.Role
	if err := db.Where("name = ?", "CLIENT").First(&role).Error; err != nil {
		fmt.Printf("Role CLIENT not found or already deleted: %v\n", err)
	} else {
		// 2. Delete users with this role
		res := db.Where("role_id = ?", role.ID).Delete(&domain.User{})
		fmt.Printf("Deleted %d users with role CLIENT\n", res.RowsAffected)

		// 3. Delete the role itself
		db.Delete(&role)
		fmt.Printf("Role CLIENT deleted\n")
	}

	fmt.Println("Cleanup finished.")
}
