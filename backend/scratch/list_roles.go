package main

import (
	"ananahnu/internal/domain"
	"ananahnu/pkg/database"
	"fmt"
	"log"
)

func main() {
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatal(err)
	}

	var roles []domain.Role
	db.Find(&roles)

	fmt.Println("Roles in database:")
	for _, r := range roles {
		fmt.Printf("- '%s'\n", r.Name)
	}
}
