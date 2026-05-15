package utils

import (
	"fmt"
	"strings"
)

// Terbilang converts a number to Indonesian words.
func Terbilang(n int64) string {
	if n == 0 {
		return "Nol"
	}

	units := []string{"", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"}
	
	var result string

	if n < 12 {
		result = units[n]
	} else if n < 20 {
		result = Terbilang(n-10) + " Belas"
	} else if n < 100 {
		result = Terbilang(n/10) + " Puluh " + Terbilang(n%10)
	} else if n < 200 {
		result = "Seratus " + Terbilang(n-100)
	} else if n < 1000 {
		result = Terbilang(n/100) + " Ratus " + Terbilang(n%100)
	} else if n < 2000 {
		result = "Seribu " + Terbilang(n-1000)
	} else if n < 1000000 {
		result = Terbilang(n/1000) + " Ribu " + Terbilang(n%1000)
	} else if n < 1000000000 {
		result = Terbilang(n/1000000) + " Juta " + Terbilang(n%1000000)
	} else if n < 1000000000000 {
		result = Terbilang(n/1000000000) + " Miliar " + Terbilang(n%1000000000)
	} else if n < 1000000000000000 {
		result = Terbilang(n/1000000000000) + " Triliun " + Terbilang(n%1000000000000)
	}

	return strings.TrimSpace(result)
}

// TerbilangRupiah converts a number to Indonesian words with "Rupiah" suffix.
func TerbilangRupiah(n float64) string {
	intPart := int64(n)
	return fmt.Sprintf("%s Rupiah", Terbilang(intPart))
}
