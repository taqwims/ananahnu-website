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
		_, _ = s.SendSync(target, message)
	}()

	return nil
}

func (s *fonnteSender) SendSync(target string, message string) (string, error) {
	token := s.tokenProvider()
	if token == "" {
		errMsg := "Fonnte API Token belum diatur di Pengaturan Sistem"
		fmt.Println(errMsg)
		return "", fmt.Errorf("%s", errMsg)
	}

	// Prepare form data
	data := url.Values{}
	data.Set("target", target)
	data.Set("message", message)
	data.Set("delay", "1")

	req, err := http.NewRequest("POST", "https://api.fonnte.com/send", strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Printf("Error creating Fonnte request: %v\n", err)
		return "", err
	}

	req.Header.Add("Authorization", token)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		fmt.Printf("Error sending Fonnte message: %v\n", err)
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		errStr := fmt.Sprintf("Fonnte API error: HTTP %d, body: %s", resp.StatusCode, string(body))
		fmt.Println(errStr)
		return "", fmt.Errorf("%s", errStr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err == nil {
		if status, ok := result["status"].(bool); ok && !status {
			reason := fmt.Sprintf("%v", result["reason"])
			return "", fmt.Errorf("fonnte: %s", reason)
		}
	}

	return string(body), nil
}
