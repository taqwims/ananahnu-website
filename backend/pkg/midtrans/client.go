package midtrans

import (
	"crypto/sha512"
	"encoding/hex"
	"os"
	"strconv"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
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

type SnapResult struct {
	Token       string
	RedirectURL string
}

type TransactionStatus struct {
	OrderID           string
	TransactionStatus string
	FraudStatus       string
	PaymentType       string
	TransactionID     string
	GrossAmount       string
	StatusCode        string
	SignatureKey       string
}

// --- Interface ---

type PaymentGateway interface {
	CreateSnapTransaction(orderID string, amount int64, customer CustomerDetail, items []ItemDetail) (*SnapResult, error)
	VerifySignature(orderID, statusCode, grossAmount, signatureKey string) bool
	CheckTransactionStatus(orderID string) (*TransactionStatus, error)
}

// --- Implementation ---

type midtransGateway struct {
	snapClient snap.Client
	coreClient coreapi.Client
}

func NewMidtransGateway() PaymentGateway {
	var s snap.Client
	var c coreapi.Client

	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	isProd, _ := strconv.ParseBool(os.Getenv("MIDTRANS_IS_PRODUCTION"))

	env := midtrans.Sandbox
	if isProd {
		env = midtrans.Production
	}

	s.New(serverKey, env)
	c.New(serverKey, env)

	return &midtransGateway{snapClient: s, coreClient: c}
}

// CreateSnapTransaction creates a new Snap payment transaction and returns the token + redirect URL.
func (g *midtransGateway) CreateSnapTransaction(orderID string, amount int64, customer CustomerDetail, items []ItemDetail) (*SnapResult, error) {
	var snapItems []midtrans.ItemDetails
	for _, item := range items {
		snapItems = append(snapItems, midtrans.ItemDetails{
			ID:    item.ID,
			Name:  item.Name,
			Price: item.Price,
			Qty:   item.Qty,
		})
	}

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: amount,
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: customer.FirstName,
			Email: customer.Email,
			Phone: customer.Phone,
		},
		Items: &snapItems,
	}

	resp, err := g.snapClient.CreateTransaction(req)
	if err != nil {
		return nil, err
	}

	return &SnapResult{
		Token:       resp.Token,
		RedirectURL: resp.RedirectURL,
	}, nil
}

// VerifySignature verifies the Midtrans webhook notification signature.
// Formula: SHA512(order_id + status_code + gross_amount + server_key)
func (g *midtransGateway) VerifySignature(orderID, statusCode, grossAmount, signatureKey string) bool {
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	input := orderID + statusCode + grossAmount + serverKey
	hash := sha512.Sum512([]byte(input))
	generated := hex.EncodeToString(hash[:])
	return generated == signatureKey
}

// CheckTransactionStatus re-checks a transaction status via the Midtrans Core API.
// This is the recommended best practice to avoid relying solely on webhook data.
func (g *midtransGateway) CheckTransactionStatus(orderID string) (*TransactionStatus, error) {
	resp, err := g.coreClient.CheckTransaction(orderID)
	if err != nil {
		return nil, err
	}

	return &TransactionStatus{
		OrderID:           resp.OrderID,
		TransactionStatus: resp.TransactionStatus,
		FraudStatus:       resp.FraudStatus,
		PaymentType:       resp.PaymentType,
		TransactionID:     resp.TransactionID,
		GrossAmount:       resp.GrossAmount,
		StatusCode:        resp.StatusCode,
		SignatureKey:       resp.SignatureKey,
	}, nil
}
