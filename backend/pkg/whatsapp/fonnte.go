package whatsapp

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type fonnteSender struct {
	tokenProvider func() string
	httpClient    *http.Client
}

func NewFonnteSender(tokenProvider func() string) WhatsAppSender {
	return &fonnteSender{
		tokenProvider: tokenProvider,
		httpClient:    &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *fonnteSender) Send(target string, message string) error {
	// Simple goroutine to send asynchronously and avoid blocking
	go func() {
		token := s.tokenProvider()
		if token == "" {
			fmt.Println("Fonnte token is empty, skipping WA notification")
			return
		}

		// Prepare form data
		data := url.Values{}
		data.Set("target", target)
		data.Set("message", message)
		data.Set("delay", "2") // Anti-spam delay (seconds)

		req, err := http.NewRequest("POST", "https://api.fonnte.com/send", strings.NewReader(data.Encode()))
		if err != nil {
			fmt.Printf("Error creating Fonnte request: %v\n", err)
			return
		}

		req.Header.Add("Authorization", token)
		req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		resp, err := s.httpClient.Do(req)
		if err != nil {
			fmt.Printf("Error sending Fonnte message: %v\n", err)
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK {
			fmt.Printf("Fonnte API error: status %d, body %s\n", resp.StatusCode, string(body))
			return
		}

		var result map[string]interface{}
		if err := json.Unmarshal(body, &result); err == nil {
			if status, ok := result["status"].(bool); ok && !status {
				fmt.Printf("Fonnte API returned false status: %v\n", result["reason"])
			}
		}
	}()

	return nil
}
