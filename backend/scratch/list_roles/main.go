package main

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/database"
	"fmt"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatal(err)
	}

	// 1. Get TELEMARKETER role
	var teleRole domain.Role
	if err := db.Where("name = ?", "TELEMARKETER").First(&teleRole).Error; err != nil {
		log.Fatalf("No TELEMARKETER role: %v", err)
	}
	fmt.Printf("TELEMARKETER Role ID: %d\n\n", teleRole.ID)

	// 2. Find all telemarketer users
	var users []domain.User
	db.Where("role_id = ?", teleRole.ID).Find(&users)
	fmt.Printf("Found %d Telemarketer users:\n", len(users))
	for _, u := range users {
		fmt.Printf("- ID: %s, Email: %s, FullName: %s\n", u.ID, u.Email, u.FullName)
	}
	fmt.Println()

	// 3. Find all tele forms
	var forms []domain.TeleForm
	db.Order("created_at desc").Find(&forms)
	fmt.Printf("Found %d TeleForms:\n", len(forms))
	for _, f := range forms {
		teleIdStr := "nil"
		if f.TelemarketerID != nil {
			teleIdStr = f.TelemarketerID.String()
		}
		fmt.Printf("ID: %s, Name: %s, RouteType: %s, Status: %s, TelemarketerID: %s, Email: %s\n",
			f.ID, f.Name, f.RouteType, f.Status, teleIdStr, f.Email)
		fmt.Printf("  Scale: %s, UsesMeat: %t, IsCatering: %t, IsAMDK: %t\n",
			f.BusinessScale, f.UsesMeat, f.IsCatering, f.IsAMDK)
	}

	// 4. Update RouteType and assign telemarketer for existing forms that match reguler criteria
	var formsToFix []domain.TeleForm
	db.Where("route_type = ? AND (uses_meat = true OR is_catering = true OR is_amdk = true OR business_scale != ?)", "SELF_DECLARE", "mikro_kecil").Find(&formsToFix)

	fmt.Printf("\nFound %d old forms to fix:\n", len(formsToFix))
	for _, f := range formsToFix {
		f.RouteType = domain.TeleRouteTeleconference
		if len(users) > 0 {
			f.TelemarketerID = &users[0].ID // assign to first telemarketer
		}
		f.Status = domain.TeleFormStatusTeleconferenceQueued
		db.Save(&f)
		fmt.Printf("Fixed Form ID: %s, Name: %s -> RouteType: TELECONFERENCE, Assigned to: %s\n", f.ID, f.Name, users[0].Email)
	}
}
