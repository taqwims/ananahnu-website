package midtrans

import (
	"os"
	"strconv"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

type PaymentGateway interface {
	GenerateSnapToken(orderID string, amount int64, customerEmail string) (string, error)
}

type midtransGateway struct {
	client snap.Client
}

func NewMidtransGateway() PaymentGateway {
	var c snap.Client
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	isProd, _ := strconv.ParseBool(os.Getenv("MIDTRANS_IS_PRODUCTION"))

	env := midtrans.Sandbox
	if isProd {
		env = midtrans.Production
	}

	c.New(serverKey, env)
	return &midtransGateway{client: c}
}

func (g *midtransGateway) GenerateSnapToken(orderID string, amount int64, customerEmail string) (string, error) {
	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: amount,
		},
		CustomerDetail: &midtrans.CustomerDetails{
			Email: customerEmail,
		},
	}
	
	resp, err := g.client.CreateTransaction(req)
	if err != nil {
		return "", err
	}
	return resp.Token, nil
}
