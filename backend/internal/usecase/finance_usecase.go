package usecase

import (
	"ananahnu/internal/domain"
	"bytes"
	"fmt"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
)

// FinanceDashboardData holds all financial summary data.
type FinanceDashboardData struct {
	TotalIncome           float64            `json:"total_income"`
	NetBalance            float64            `json:"net_balance"`
	CommissionPaid        float64            `json:"commission_paid"`
	CommissionPending     float64            `json:"commission_pending"`
	TotalExpense          float64            `json:"total_expense"`
	TotalExpenseSub       float64            `json:"total_expense_sub"`
	TotalExpenseOp        float64            `json:"total_expense_op"`
	IncomeReguler         float64            `json:"income_reguler"`
	IncomeSelfDeclarePaid float64            `json:"income_self_declare_paid"`
	CountSelfDeclareFree  int                `json:"count_self_declare_free"`
	CountSelfDeclarePaid  int                `json:"count_self_declare_paid"`
	CountReguler          int                `json:"count_reguler"`
	ExpenseByBusiness     map[string]float64 `json:"expense_by_business"` // linked to submission
	ExpenseOperational    map[string]float64 `json:"expense_operational"` // free text operational
	IncomeByBusiness      map[string]float64 `json:"income_by_business"`   // linked to submission/client business type
	IncomeBPJPHPaid       float64            `json:"income_bpjph_paid"`
	IncomeBPJPHPending    float64            `json:"income_bpjph_pending"`
	CountBPJPHPaid        int                `json:"count_bpjph_paid"`
	CountBPJPHUnpaid      int                `json:"count_bpjph_unpaid"`
}

type FeeConfigItem struct {
	Key   string  `json:"key"`
	Label string  `json:"label"`
	Value float64 `json:"value"` // percentage
}

type FinanceUsecase interface {
	GetDashboard(month, year int) (*FinanceDashboardData, error)
	GetFeeConfig() ([]FeeConfigItem, error)
	UpdateFeeConfig(key string, value float64) error
	GetCommissions(page, limit int, status, commType string) ([]domain.Commission, int64, error)
	PayCommission(id uuid.UUID) error
	GenerateCommissionSlip(commissionID uuid.UUID) ([]byte, string, error)
	SendCommissionSlipWA(commissionID uuid.UUID) error
	GetAgentList(page, limit int) ([]domain.User, int64, error)
	GetClientList(page, limit int) ([]domain.Client, int64, error)
	GetSubmissionList(page, limit int, serviceType string) ([]domain.Submission, int64, error)
	GetManagerList(page, limit int) ([]domain.User, int64, error)

	// Expenses
	CreateExpense(expense *domain.Expense) error
	GetExpenses(filter map[string]interface{}, page, limit int) ([]domain.Expense, int64, error)
	DeleteExpense(id int64) error

	// BPJPH Payment
	UpdateBPJPHPayment(id uuid.UUID, status string, amount float64) error
	UpdateBPJPHPaymentBulk(ids []uuid.UUID, status string, amount float64) error
}

type FinanceUsecaseDeps struct {
	InvoiceRepo    domain.InvoiceRepository
	CommissionRepo domain.CommissionRepository
	UserRepo       domain.UserRepository
	ClientRepo     domain.ClientRepository
	SubmissionRepo domain.SubmissionRepository
	SettingRepo    domain.SystemSettingRepository
	ExpenseRepo    domain.ExpenseRepository
	NotifUC        NotificationUsecase
	RoleRepo       domain.RoleRepository
}

type financeUsecase struct {
	FinanceUsecaseDeps
}

func NewFinanceUsecase(deps FinanceUsecaseDeps) FinanceUsecase {
	return &financeUsecase{FinanceUsecaseDeps: deps}
}

func (uc *financeUsecase) GetDashboard(month, year int) (*FinanceDashboardData, error) {
	dashboard := &FinanceDashboardData{
		ExpenseByBusiness:  make(map[string]float64),
		ExpenseOperational: make(map[string]float64),
		IncomeByBusiness:   make(map[string]float64),
	}

	// 1. Calculate Incomes
	allInvoices, _, err := uc.InvoiceRepo.FindAll(map[string]interface{}{}, 1, 100000)
	if err != nil {
		return nil, err
	}

	for _, inv := range allInvoices {
		if month > 0 && year > 0 {
			if inv.CreatedAt.Month() != time.Month(month) || inv.CreatedAt.Year() != year {
				continue
			}
		} else if year > 0 {
			if inv.CreatedAt.Year() != year {
				continue
			}
		}

		if inv.Status == domain.InvoiceStatusPaid {
			dashboard.TotalIncome += inv.Amount
			if inv.Submission.BusinessType != nil {
				dashboard.IncomeByBusiness[inv.Submission.BusinessType.Name] += inv.Amount
			} else {
				dashboard.IncomeByBusiness["Lainnya"] += inv.Amount
			}
		}

		switch inv.ServiceType {
		case "REGULER":
			if inv.Status == domain.InvoiceStatusPaid {
				dashboard.IncomeReguler += inv.Amount
			}
			dashboard.CountReguler++
		case "SELF_DECLARE":
			if inv.Amount > 0 {
				if inv.Status == domain.InvoiceStatusPaid {
					dashboard.IncomeSelfDeclarePaid += inv.Amount
				}
				dashboard.CountSelfDeclarePaid++
			} else {
				dashboard.CountSelfDeclareFree++
			}
		}
	}

	// 1b. Calculate BPJPH Incomes for SELF_DECLARE submissions
	sdSubmissions, err := uc.SubmissionRepo.FindAll(map[string]interface{}{"service_type": "SELF_DECLARE"})
	if err == nil {
		for _, sub := range sdSubmissions {
			if month > 0 && year > 0 {
				if sub.CreatedAt.Month() != time.Month(month) || sub.CreatedAt.Year() != year {
					continue
				}
			} else if year > 0 {
				if sub.CreatedAt.Year() != year {
					continue
				}
			}

			if sub.BPJPHPaymentStatus == "PAID" {
				dashboard.IncomeBPJPHPaid += sub.BPJPHAmount
				dashboard.TotalIncome += sub.BPJPHAmount // Add to total paid income
				dashboard.CountBPJPHPaid++
				
				// Group by business type for paid self declare
				if sub.BusinessType != nil {
					dashboard.IncomeByBusiness[sub.BusinessType.Name] += sub.BPJPHAmount
				} else {
					dashboard.IncomeByBusiness["Lainnya"] += sub.BPJPHAmount
				}
			} else {
				amount := sub.BPJPHAmount
				if amount == 0 {
					amount = 150000 // default estimate
				}
				dashboard.IncomeBPJPHPending += amount
				dashboard.CountBPJPHUnpaid++
			}
		}
	}

	// 2. Calculate Commissions
	allCommissions, _, _ := uc.CommissionRepo.FindAll(map[string]interface{}{}, 1, 100000)
	for _, c := range allCommissions {
		if month > 0 && year > 0 {
			if c.CreatedAt.Month() != time.Month(month) || c.CreatedAt.Year() != year {
				continue
			}
		} else if year > 0 {
			if c.CreatedAt.Year() != year {
				continue
			}
		}

		if c.Status == domain.CommissionStatusPaid {
			dashboard.CommissionPaid += c.Amount
		} else {
			dashboard.CommissionPending += c.Amount
		}
	}

	// 3. Calculate Expenses
	allExpenses, _, _ := uc.ExpenseRepo.FindAll(map[string]interface{}{}, 1, 100000)
	for _, e := range allExpenses {
		if month > 0 && year > 0 {
			if e.Date.Month() != time.Month(month) || e.Date.Year() != year {
				continue
			}
		} else if year > 0 {
			if e.Date.Year() != year {
				continue
			}
		}

		dashboard.TotalExpense += e.Amount
		if e.SubmissionID != nil {
			dashboard.TotalExpenseSub += e.Amount
			// Group by business type
			if e.Submission != nil && e.Submission.BusinessType != nil {
				dashboard.ExpenseByBusiness[e.Submission.BusinessType.Name] += e.Amount
			} else {
				dashboard.ExpenseByBusiness["Lainnya"] += e.Amount
			}
		} else {
			dashboard.TotalExpenseOp += e.Amount
			// Group by free text category
			dashboard.ExpenseOperational[e.Category] += e.Amount
		}
	}

	// Calculate Net Balance (Total Income - Commission Paid - Total Expense)
	dashboard.NetBalance = dashboard.TotalIncome - dashboard.CommissionPaid - dashboard.TotalExpense

	return dashboard, nil
}

func (uc *financeUsecase) CreateExpense(expense *domain.Expense) error {
	expense.Date = time.Now()
	return uc.ExpenseRepo.Create(expense)
}

func (uc *financeUsecase) GetExpenses(filter map[string]interface{}, page, limit int) ([]domain.Expense, int64, error) {
	return uc.ExpenseRepo.FindAll(filter, page, limit)
}

func (uc *financeUsecase) DeleteExpense(id int64) error {
	return uc.ExpenseRepo.Delete(id)
}


func (uc *financeUsecase) GetFeeConfig() ([]FeeConfigItem, error) {
	feeKeys := []struct {
		Key   string
		Label string
		Default float64
	}{
		{"fee_referral_percent", "Fee Referral (%)", 1.0},
		{"fee_override_percent", "Fee Override Halal Manager (%)", 5.0},
		{"fee_direct_sales_percent", "Fee Insentif Pendampingan (%)", 25.0},
		{"fee_structural_percent", "Fee Struktural Upline Advisor (%)", 1.0},
		{"fee_director_percent", "Fee Halal Director (%)", 2.5},
	}

	var items []FeeConfigItem
	for _, fk := range feeKeys {
		setting, err := uc.SettingRepo.GetSetting(fk.Key)
		val := fk.Default
		if err == nil && setting != nil && setting.Value != "" {
			fmt.Sscanf(setting.Value, "%f", &val)
		}
		items = append(items, FeeConfigItem{
			Key:   fk.Key,
			Label: fk.Label,
			Value: val,
		})
	}
	return items, nil
}

func (uc *financeUsecase) UpdateFeeConfig(key string, value float64) error {
	return uc.SettingRepo.UpdateSetting(&domain.SystemSetting{
		Key:       key,
		Value:     fmt.Sprintf("%.2f", value),
		UpdatedAt: time.Now(),
	})
}

func (uc *financeUsecase) GetCommissions(page, limit int, status, commType string) ([]domain.Commission, int64, error) {
	filter := map[string]interface{}{}
	if status != "" {
		filter["status"] = status
	}
	if commType != "" {
		filter["type"] = commType
	}
	return uc.CommissionRepo.FindAll(filter, page, limit)
}

func (uc *financeUsecase) PayCommission(id uuid.UUID) error {
	now := time.Now()
	return uc.CommissionRepo.UpdateStatus(id, domain.CommissionStatusPaid, &now)
}

// GenerateCommissionSlip generates a PDF slip for a commission payment.
func (uc *financeUsecase) GenerateCommissionSlip(commissionID uuid.UUID) ([]byte, string, error) {
	commissions, _, err := uc.CommissionRepo.FindAll(map[string]interface{}{"id": commissionID}, 1, 1)
	if err != nil || len(commissions) == 0 {
		return nil, "", fmt.Errorf("commission not found")
	}
	comm := commissions[0]

	// Get user
	var recipientName string
	if comm.UserID != nil {
		user, _ := uc.UserRepo.FindByID(*comm.UserID)
		if user != nil {
			recipientName = user.FullName
		}
	} else if comm.ReferrerID != nil {
		user, _ := uc.UserRepo.FindByID(*comm.ReferrerID)
		if user != nil {
			recipientName = user.FullName
		}
	}

	pdf := fpdf.New("P", "mm", "A5", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(0, 8, "SLIP PEMBAYARAN KOMISI", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 6, "PT Ana Nahnu Indonesia", "", 1, "C", false, 0, "")
	pdf.Ln(8)

	pdf.SetDrawColor(200, 200, 200)
	pdf.Line(15, pdf.GetY(), 133, pdf.GetY())
	pdf.Ln(5)

	// Body
	labelW := 45.0
	pdf.SetFont("Arial", "", 10)

	rows := []struct{ Label, Value string }{
		{"Penerima", recipientName},
		{"Tipe Komisi", string(comm.Type)},
		{"Periode", comm.Period},
		{"Jumlah", fmt.Sprintf("Rp %s", formatIDRSimple(comm.Amount))},
		{"Status", string(comm.Status)},
	}
	if comm.PaidAt != nil {
		rows = append(rows, struct{ Label, Value string }{
			"Tanggal Bayar", comm.PaidAt.Format("02 Jan 2006"),
		})
	}

	for _, row := range rows {
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(labelW, 6, row.Label, "", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.CellFormat(0, 6, ": "+row.Value, "", 1, "L", false, 0, "")
	}

	pdf.Ln(10)
	pdf.Line(15, pdf.GetY(), 133, pdf.GetY())
	pdf.Ln(5)

	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(0, 5, fmt.Sprintf("Dicetak pada: %s", time.Now().Format("02 Jan 2006 15:04")), "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 5, "Dokumen ini dihasilkan secara otomatis oleh sistem Ana Nahnu.", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, "", err
	}

	filename := fmt.Sprintf("Slip_Komisi_%s.pdf", recipientName)
	return buf.Bytes(), filename, nil
}

func (uc *financeUsecase) SendCommissionSlipWA(commissionID uuid.UUID) error {
	commissions, _, err := uc.CommissionRepo.FindAll(map[string]interface{}{"id": commissionID}, 1, 1)
	if err != nil || len(commissions) == 0 {
		return fmt.Errorf("commission not found")
	}
	comm := commissions[0]

	var recipientID uuid.UUID
	if comm.UserID != nil {
		recipientID = *comm.UserID
	} else if comm.ReferrerID != nil {
		recipientID = *comm.ReferrerID
	}

	if recipientID == uuid.Nil {
		return fmt.Errorf("no recipient found")
	}

	msg := fmt.Sprintf(
		"*Slip Pembayaran Komisi*\n\nTipe: %s\nPeriode: %s\nJumlah: Rp %s\nStatus: %s\n\nTerima kasih atas kontribusi Anda.\n— PT Ana Nahnu Indonesia",
		comm.Type, comm.Period, formatIDRSimple(comm.Amount), comm.Status,
	)

	return uc.NotifUC.CreateNotification(recipientID, "Slip Komisi", msg, uuid.Nil)
}

func (uc *financeUsecase) GetAgentList(page, limit int) ([]domain.User, int64, error) {
	return uc.UserRepo.FindAll(map[string]interface{}{"role_name": "HALAL_ADVISOR"}, page, limit)
}

func (uc *financeUsecase) GetClientList(page, limit int) ([]domain.Client, int64, error) {
	return uc.ClientRepo.FindAll(map[string]interface{}{}, page, limit)
}

func (uc *financeUsecase) GetSubmissionList(page, limit int, serviceType string) ([]domain.Submission, int64, error) {
	filter := map[string]interface{}{}
	if serviceType != "" {
		filter["service_type"] = serviceType
	}
	filter["preload_invoice"] = true
	filter["preload_expenses"] = true
	submissions, err := uc.SubmissionRepo.FindAll(filter)
	total := int64(len(submissions))
	// Simple pagination
	start := (page - 1) * limit
	end := start + limit
	if start > len(submissions) {
		return []domain.Submission{}, total, nil
	}
	if end > len(submissions) {
		end = len(submissions)
	}
	return submissions[start:end], total, err
}

func (uc *financeUsecase) GetManagerList(page, limit int) ([]domain.User, int64, error) {
	return uc.UserRepo.FindAll(map[string]interface{}{"role_name": "HALAL_MANAGER"}, page, limit)
}

func formatIDRSimple(amount float64) string {
	s := fmt.Sprintf("%.0f", amount)
	var res []string
	for i := len(s); i > 0; i -= 3 {
		start := i - 3
		if start < 0 {
			start = 0
		}
		res = append([]string{s[start:i]}, res...)
	}
	result := ""
	for i, part := range res {
		if i > 0 {
			result += "."
		}
		result += part
	}
	return result
}

func (uc *financeUsecase) UpdateBPJPHPayment(id uuid.UUID, status string, amount float64) error {
	var paidAt *time.Time
	if status == "PAID" {
		now := time.Now()
		paidAt = &now
	}
	return uc.SubmissionRepo.UpdateBPJPHPayment(id, status, amount, paidAt)
}

func (uc *financeUsecase) UpdateBPJPHPaymentBulk(ids []uuid.UUID, status string, amount float64) error {
	var paidAt *time.Time
	if status == "PAID" {
		now := time.Now()
		paidAt = &now
	}
	return uc.SubmissionRepo.UpdateBPJPHPaymentBulk(ids, status, amount, paidAt)
}
