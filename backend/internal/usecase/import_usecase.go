package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type ImportUsecase interface {
	ImportClients(r io.Reader) error
}

type ImportUsecaseDeps struct {
	ClientRepo domain.ClientRepository
}

type importUsecase struct {
	ImportUsecaseDeps
}

func NewImportUsecase(deps ImportUsecaseDeps) ImportUsecase {
	return &importUsecase{
		ImportUsecaseDeps: deps,
	}
}

func (uc *importUsecase) ImportClients(r io.Reader) error {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return err
	}
	defer f.Close()

	// Get first sheet
	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return err
	}

	var clients []domain.Client

	// Skip header (row 0), start from row 1
	for i, row := range rows {
		if i == 0 {
			continue // Header
		}
		if len(row) < 5 {
			// Skip empty or malformed rows
			continue
		}

		// Expected Columns: NIB, BusinessName, Address, ProductName, Phone
		nib := row[0]
		name := row[1]
		address := row[2]
		productObj := row[3]
		phone := row[4]

		// 1. Validation Logic
		if len(nib) != 13 {
			return fmt.Errorf("row %d: NIB must be 13 digits (got %s)", i+1, nib)
		}
		if name == "" {
			return fmt.Errorf("row %d: Business Name cannot be empty", i+1)
		}

		clients = append(clients, domain.Client{
			ID:           uuid.New(),
			NIB:          nib,
			BusinessName: name,
			Address:      address,
			ProductName:  productObj,
			Phone:        phone,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		})
	}

	if len(clients) == 0 {
		return errors.New("no valid data found to import")
	}

	// 2. Transactional Insert
	return uc.ClientRepo.ImportBulk(clients)
}
