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

	return strings.TrimSpace(terbilangRecursive(n))
}

func terbilangRecursive(n int64) string {
	if n == 0 {
		return ""
	}

	units := []string{"", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"}
	
	var result string

	if n < 12 {
		result = units[n]
	} else if n < 20 {
		result = terbilangRecursive(n-10) + " Belas"
	} else if n < 100 {
		result = terbilangRecursive(n/10) + " Puluh " + terbilangRecursive(n%10)
	} else if n < 200 {
		result = "Seratus " + terbilangRecursive(n-100)
	} else if n < 1000 {
		result = terbilangRecursive(n/100) + " Ratus " + terbilangRecursive(n%100)
	} else if n < 2000 {
		result = "Seribu " + terbilangRecursive(n-1000)
	} else if n < 1000000 {
		result = terbilangRecursive(n/1000) + " Ribu " + terbilangRecursive(n%1000)
	} else if n < 1000000000 {
		result = terbilangRecursive(n/1000000) + " Juta " + terbilangRecursive(n%1000000)
	} else if n < 1000000000000 {
		result = terbilangRecursive(n/1000000000) + " Miliar " + terbilangRecursive(n%1000000000)
	} else if n < 1000000000000000 {
		result = terbilangRecursive(n/1000000000000) + " Triliun " + terbilangRecursive(n%1000000000000)
	}

	return result
}

// TerbilangRupiah converts a number to Indonesian words with "Rupiah" suffix.
func TerbilangRupiah(n float64) string {
	intPart := int64(n)
	return fmt.Sprintf("%s Rupiah", Terbilang(intPart))
}
