package usecase

import (
	"ananahnu/internal/domain"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var romanMonths = []string{
	"", "I", "II", "III", "IV", "V", "VI",
	"VII", "VIII", "IX", "X", "XI", "XII",
}

type SPHUsecase interface {
	GenerateSPH(submissionID uuid.UUID) (*domain.SPH, error)
	GetSPH(id int64) (*domain.SPH, error)
	GetSPHBySubmission(submissionID uuid.UUID) (*domain.SPH, error)
	ListSPH(filter map[string]interface{}, page, limit int) ([]domain.SPH, int64, error)
	ApproveSPH(id int64) error
}

type SPHUsecaseDeps struct {
	SPHRepo           domain.SPHRepository
	SubmissionRepo    domain.SubmissionRepository
	BillingConfigRepo domain.BillingConfigRepository
}

type sphUsecase struct {
	SPHUsecaseDeps
}

func NewSPHUsecase(deps SPHUsecaseDeps) SPHUsecase {
	return &sphUsecase{SPHUsecaseDeps: deps}
}

// GenerateSPH creates an SPH document for a submission, fetching costs from master biaya.
func (uc *sphUsecase) GenerateSPH(submissionID uuid.UUID) (*domain.SPH, error) {
	// Check if SPH already exists
	if existing, _ := uc.SPHRepo.FindBySubmissionID(submissionID); existing != nil && existing.ID > 0 {
		return existing, nil // Idempotent
	}

	submission, err := uc.SubmissionRepo.FindByID(submissionID)
	if err != nil {
		return nil, fmt.Errorf("submission not found: %w", err)
	}

	// Build cost breakdown from master biaya (BillingComponents)
	filter := map[string]interface{}{}
	if submission.BusinessTypeID != nil {
		filter["business_type_id"] = *submission.BusinessTypeID
	}

	components, err := uc.BillingConfigRepo.FindAllBillingComponents(filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get billing components: %w", err)
	}

	// Calculate total and build breakdown
	type CostItem struct {
		Name     string  `json:"name"`
		Category string  `json:"category"`
		Type     string  `json:"type"`
		Amount   float64 `json:"amount"`
	}

	var items []CostItem
	var totalAmount float64

	for _, comp := range components {
		if !comp.IsMandatory {
			continue // Only include mandatory for SPH
		}
		item := CostItem{
			Name:     comp.Name,
			Category: comp.Category,
			Type:     comp.Type,
			Amount:   comp.BaseAmount,
		}
		items = append(items, item)
		totalAmount += comp.BaseAmount
	}

	// Also include configured scheme prices if submission has a sales scheme
	if submission.SalesSchemeID != nil {
		priceFilter := map[string]interface{}{
			"sales_scheme_id": *submission.SalesSchemeID,
		}
		if submission.BusinessTypeID != nil {
			priceFilter["business_type_id"] = *submission.BusinessTypeID
		}

		prices, _ := uc.BillingConfigRepo.FindAllSalesSchemePrices(priceFilter)
		for _, p := range prices {
			if !p.IsActive {
				continue
			}
			desc := p.Description
			if desc == "" {
				desc = "Biaya Skema"
			}
			item := CostItem{
				Name:     desc,
				Category: "SKEMA",
				Type:     "FIXED",
				Amount:   p.BasePrice,
			}
			items = append(items, item)
			totalAmount += p.BasePrice
		}
	}

	breakdownJSON, _ := json.Marshal(items)

	// Generate SPH number
	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	seq, err := uc.SPHRepo.GetNextSequence(month, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get sequence: %w", err)
	}

	// Format: {sequence}/hc-sph/{bulan_romawi}/{tahun}
	sphNumber := fmt.Sprintf("%03d/hc-sph/%s/%d", seq, romanMonths[month], year)

	sph := &domain.SPH{
		SubmissionID:   submissionID,
		SPHNumber:      sphNumber,
		SequenceNumber: seq,
		Month:          month,
		Year:           year,
		TotalAmount:    totalAmount,
		CostBreakdown:  string(breakdownJSON),
		Status:         "DRAFT",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := uc.SPHRepo.Create(sph); err != nil {
		return nil, fmt.Errorf("failed to create SPH: %w", err)
	}

	return sph, nil
}

func (uc *sphUsecase) GetSPH(id int64) (*domain.SPH, error) {
	return uc.SPHRepo.FindByID(id)
}

func (uc *sphUsecase) GetSPHBySubmission(submissionID uuid.UUID) (*domain.SPH, error) {
	return uc.SPHRepo.FindBySubmissionID(submissionID)
}

func (uc *sphUsecase) ListSPH(filter map[string]interface{}, page, limit int) ([]domain.SPH, int64, error) {
	return uc.SPHRepo.FindAll(filter, page, limit)
}

func (uc *sphUsecase) ApproveSPH(id int64) error {
	sph, err := uc.SPHRepo.FindByID(id)
	if err != nil {
		return err
	}
	if sph.Status != "DRAFT" {
		return fmt.Errorf("SPH sudah dalam status %s", sph.Status)
	}
	sph.Status = "ISSUED"
	now := time.Now()
	sph.IssuedAt = &now
	sph.UpdatedAt = now
	return uc.SPHRepo.Update(sph)
}
