package usecase

import (
	"ananahnu/internal/domain"
	"encoding/json"
	"fmt"
	"strings"
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

	var totalAmount float64
	var breakdownJSON []byte

	// Priority 1: Use SubmissionCostDetail if available
	costDetail, err := uc.BillingConfigRepo.GetSubmissionCostDetail(submissionID)
	if err == nil && costDetail != nil && costDetail.TotalAmount > 0 && costDetail.CostBreakdownData != "" {
		totalAmount = costDetail.TotalAmount
		breakdownJSON = []byte(costDetail.CostBreakdownData)
	} else {
		// Priority 2: Fallback calculation with best match per category
		filter := map[string]interface{}{}
		if submission.BusinessTypeID != nil {
			filter["business_type_id"] = *submission.BusinessTypeID
		}
		if submission.ServiceType != "" {
			filter["service_type"] = submission.ServiceType
		}

		components, err := uc.BillingConfigRepo.FindAllBillingComponents(filter)
		if err != nil {
			return nil, fmt.Errorf("failed to get billing components: %w", err)
		}

		type CostItem struct {
			Name     string  `json:"name"`
			Category string  `json:"category"`
			Type     string  `json:"type"`
			Amount   float64 `json:"amount"`
		}

		type scoredComp struct {
			comp  domain.BillingComponent
			score int
		}
		categoryMap := make(map[string]scoredComp)

		for _, comp := range components {
			if !comp.IsMandatory {
				continue // Only include mandatory for SPH
			}

			compSt := strings.TrimSpace(comp.ServiceType)
			if submission.ServiceType == "REGULER" {
				if compSt != "REGULER" && compSt != "BOTH" && compSt != "ALL" && compSt != "" {
					continue
				}
			} else if submission.ServiceType == "SELF_DECLARE_MANDIRI" {
				if compSt != "SELF_DECLARE_MANDIRI" && compSt != "BOTH" && compSt != "ALL" {
					continue
				}
				cat := strings.ToUpper(comp.Category)
				if cat == "LPH" || cat == "MUI" {
					continue
				}
			}

			if comp.ProvinceID != nil && (submission.ProvinceID == nil || *comp.ProvinceID != *submission.ProvinceID) {
				continue
			}
			if comp.RegencyID != nil && (submission.RegencyID == nil || *comp.RegencyID != *submission.RegencyID) {
				continue
			}
			if comp.DistrictID != nil && (submission.DistrictID == nil || *comp.DistrictID != *submission.DistrictID) {
				continue
			}
			if comp.BusinessTypeID != nil && (submission.BusinessTypeID == nil || *comp.BusinessTypeID != *submission.BusinessTypeID) {
				continue
			}
			if comp.ProductCategoryID != nil && (submission.ProductCategoryID == nil || *comp.ProductCategoryID != *submission.ProductCategoryID) {
				continue
			}
			if comp.BusinessScaleID != nil && (submission.BusinessScaleID == nil || *comp.BusinessScaleID != *submission.BusinessScaleID) {
				continue
			}
			if comp.SalesSchemeID != nil && (submission.SalesSchemeID == nil || *comp.SalesSchemeID != *submission.SalesSchemeID) {
				continue
			}

			score := 0
			if comp.DistrictID != nil { score += 1000 }
			if comp.RegencyID != nil { score += 100 }
			if comp.ProvinceID != nil { score += 10 }
			if comp.SalesSchemeID != nil { score += 8 }
			if comp.BusinessScaleID != nil { score += 5 }
			if comp.ProductCategoryID != nil { score += 2 }
			if comp.BusinessTypeID != nil { score += 1 }

			cat := comp.Category
			existing, exists := categoryMap[cat]
			if !exists || score > existing.score {
				categoryMap[cat] = scoredComp{comp: comp, score: score}
			}
		}

		var items []CostItem
		for _, sc := range categoryMap {
			item := CostItem{
				Name:     sc.comp.Name,
				Category: sc.comp.Category,
				Type:     sc.comp.Type,
				Amount:   sc.comp.BaseAmount,
			}
			items = append(items, item)
			totalAmount += sc.comp.BaseAmount
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

		breakdownJSON, _ = json.Marshal(items)
	}

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
