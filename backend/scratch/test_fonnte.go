package main

import (
	"ananahnu/pkg/whatsapp"
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../.env")

	token := os.Getenv("FONNTE_TOKEN")
	if token == "" {
		fmt.Println("FONNTE_TOKEN not found in .env")
		return
	}

	target := "6282219512788" // Change to your testing number
	message := "Testing Fonnte Integration from Ananahnu Backend. Hello World! 🚀"

	sender := whatsapp.NewFonnteSender(func() string {
		return token
	})

	fmt.Printf("Sending WA to %s...\n", target)
	err := sender.Send(target, message)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Println("Message sent asynchronously. Check your WA in a few seconds.")
	}

	// Wait for goroutine
	time.Sleep(5 * time.Second)
}
