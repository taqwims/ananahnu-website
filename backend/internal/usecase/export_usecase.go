package usecase

import (
	"ananahnu/internal/domain"
	_ "embed"
	"fmt"
	"bytes"

	"github.com/xuri/excelize/v2"
	"github.com/go-pdf/fpdf"
)

type ExportUsecase interface {
	ExportClients(filter map[string]interface{}, format string) ([]byte, error)
}

type exportUsecase struct {
	clientRepo domain.ClientRepository
}

func NewExportUsecase(c domain.ClientRepository) ExportUsecase {
	return &exportUsecase{clientRepo: c}
}

func (uc *exportUsecase) ExportClients(filter map[string]interface{}, format string) ([]byte, error) {
	// 1. Fetch Data (No pagination limits for export)
	clients, _, err := uc.clientRepo.FindAll(filter, 1, -1) // -1 limit hack implies all? Repo needs to support it.
	if err != nil {
		return nil, err
	}

	if format == "xlsx" {
		return uc.generateExcel(clients)
	} else if format == "pdf" {
		return uc.generatePDF(clients)
	}
	return nil, fmt.Errorf("unsupported format: %s", format)
}

func (uc *exportUsecase) generateExcel(clients []domain.Client) ([]byte, error) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	f.SetSheetName("Sheet1", sheet)

	// Header
	headers := []string{"NIB", "Business Name", "Address", "Phone", "Product", "Service Type"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	// Data
	for i, c := range clients {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), c.NIB)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), c.BusinessName)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), c.Address)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), c.Phone)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), c.ProductName)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), c.ServiceType)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (uc *exportUsecase) generatePDF(clients []domain.Client) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Client Report")
	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "NIB")
	pdf.Cell(60, 10, "Business Name")
	pdf.Cell(50, 10, "Service Type")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 12)
	for _, c := range clients {
		pdf.Cell(40, 10, c.NIB)
		pdf.Cell(60, 10, c.BusinessName)
		pdf.Cell(50, 10, c.ServiceType)
		pdf.Ln(10)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
