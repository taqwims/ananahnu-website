package mayar

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// --- Types ---

type CustomerDetail struct {
	FirstName string
	Email     string
	Phone     string
}

type ItemDetail struct {
	ID    string
	Name  string
	Price int64
	Qty   int32
}

type MayarItem struct {
	Quantity    int32  `json:"quantity"`
	Rate        int64  `json:"rate"`
	Description string `json:"description"`
}

type MayarInvoiceRequest struct {
	Name        string            `json:"name"`
	Email       string            `json:"email"`
	Mobile      string            `json:"mobile"`
	RedirectURL string            `json:"redirectUrl,omitempty"`
	Description string            `json:"description"`
	ExpiredAt   string            `json:"expiredAt,omitempty"`
	Items       []MayarItem       `json:"items"`
	ExtraData   map[string]string `json:"extraData,omitempty"`
}

type MayarInvoiceResponse struct {
	ID            string `json:"id"`
	TransactionID string `json:"transactionId"`
	Link          string `json:"link"`
	Status        string `json:"status"`
}

type MayarInvoiceStatus struct {
	ID            string `json:"id"`
	TransactionID string `json:"transactionId"`
	Status        string `json:"status"`
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"paymentMethod"`
	PaidAt        string `json:"paidAt"`
}

// --- Interface ---

type PaymentGateway interface {
	CreateInvoice(req MayarInvoiceRequest, apiKeyOverride string, isProdOverride *bool) (*MayarInvoiceResponse, error)
	GetInvoiceStatus(invoiceID string, apiKeyOverride string, isProdOverride *bool) (*MayarInvoiceStatus, error)
}

// --- Implementation ---

type mayarGateway struct {
	httpClient *http.Client
}

func NewMayarGateway() PaymentGateway {
	return &mayarGateway{
		httpClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (g *mayarGateway) getBaseURL(isProdOverride *bool) string {
	isProd := false
	if isProdOverride != nil {
		isProd = *isProdOverride
	} else {
		isProd, _ = strconv.ParseBool(os.Getenv("MAYAR_IS_PRODUCTION"))
	}

	if isProd {
		return "https://api.mayar.id/hl/v1"
	}
	return "https://api.mayar.io/hl/v1"
}

func (g *mayarGateway) getAPIKey(apiKeyOverride string) string {
	if strings.TrimSpace(apiKeyOverride) != "" {
		return strings.TrimSpace(apiKeyOverride)
	}
	return strings.TrimSpace(os.Getenv("MAYAR_API_KEY"))
}

// CreateInvoice calls POST /hl/v1/invoice/create to generate a Mayar payment invoice
func (g *mayarGateway) CreateInvoice(req MayarInvoiceRequest, apiKeyOverride string, isProdOverride *bool) (*MayarInvoiceResponse, error) {
	apiKey := g.getAPIKey(apiKeyOverride)
	if apiKey == "" {
		return nil, errors.New("mayar API Key is not configured (check System Settings or MAYAR_API_KEY env)")
	}

	baseURL := g.getBaseURL(isProdOverride)
	url := fmt.Sprintf("%s/invoice/create", baseURL)

	bodyBytes, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to encode request body: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	resp, err := g.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("mayar request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read mayar response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("mayar API error (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	var apiResp struct {
		StatusCode int                  `json:"statusCode"`
		Messages   interface{}          `json:"messages"`
		Data       MayarInvoiceResponse `json:"data"`
	}

	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse mayar response: %w", err)
	}

	return &apiResp.Data, nil
}

// GetInvoiceStatus calls GET /hl/v1/invoice/{id} to check invoice payment status
func (g *mayarGateway) GetInvoiceStatus(invoiceID string, apiKeyOverride string, isProdOverride *bool) (*MayarInvoiceStatus, error) {
	apiKey := g.getAPIKey(apiKeyOverride)
	if apiKey == "" {
		return nil, errors.New("mayar API Key is not configured")
	}

	baseURL := g.getBaseURL(isProdOverride)
	url := fmt.Sprintf("%s/invoice/%s", baseURL, invoiceID)

	httpReq, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	resp, err := g.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("mayar status request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read mayar status response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("mayar API error (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	var apiResp struct {
		StatusCode int                    `json:"statusCode"`
		Data       map[string]interface{} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse mayar status response: %w", err)
	}

	status, _ := apiResp.Data["status"].(string)
	txID, _ := apiResp.Data["transactionId"].(string)
	id, _ := apiResp.Data["id"].(string)
	payMethod, _ := apiResp.Data["paymentMethod"].(string)
	paidAt, _ := apiResp.Data["paidAt"].(string)

	var amount int64
	if amtVal, ok := apiResp.Data["amount"].(float64); ok {
		amount = int64(amtVal)
	}

	return &MayarInvoiceStatus{
		ID:            id,
		TransactionID: txID,
		Status:        status,
		Amount:        amount,
		PaymentMethod: payMethod,
		PaidAt:        paidAt,
	}, nil
}
