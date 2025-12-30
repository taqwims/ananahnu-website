package main

import (
	"fmt"
	"github.com/xuri/excelize/v2"
	"log"
	"os"
)

func main() {
	f := excelize.NewFile()
	sheet := "Sheet1"
	
	// Create Dir
	os.MkdirAll("data_samples", 0755)

	// Headers
	headers := []string{"NIB", "Business Name", "Address", "Product", "Phone"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	// Data
	data := [][]string{
		{"1234567890123", "Warung Berkah", "Jl. Sudirman No 1", "Nasi Goreng", "081234567890"},
		{"9876543210987", "CV Maju Jaya", "Jl. Thamrin No 2", "Frozen Food", "081987654321"},
		{"1111111111111", "Toko Sejahtera", "Jl. Gatot Subroto", "Keripik", "08111111111"},
	}

	for i, row := range data {
		r := i + 2
		for j, val := range row {
			cell, _ := excelize.CoordinatesToCellName(j+1, r)
			f.SetCellValue(sheet, cell, val)
		}
	}

	path := "data_samples/November2025.xlsx"
	if err := f.SaveAs(path); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Sample Excel created at:", path)
}
