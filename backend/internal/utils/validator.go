package utils

import (
	"errors"
	"html"
	"regexp"
	"strings"
)

var (
	nikRegex   = regexp.MustCompile(`^[0-9]{16}$`)
	nibRegex   = regexp.MustCompile(`^[0-9]{13}$`)
	phoneRegex = regexp.MustCompile(`^(\+62|62|08)[0-9]{8,13}$`)
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	tagRegex   = regexp.MustCompile(`<[^>]*>`)
)

// SanitizeInput trims whitespace and strips HTML tags and escapes special characters
func SanitizeInput(s string) string {
	cleaned := strings.TrimSpace(s)
	cleaned = tagRegex.ReplaceAllString(cleaned, "")
	return html.EscapeString(cleaned)
}

// CleanDigits removes all non-numeric characters
func CleanDigits(s string) string {
	var sb strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			sb.WriteRune(r)
		}
	}
	return sb.String()
}

// CleanPhone removes spaces and dashes from phone numbers, keeping leading '+' if present
func CleanPhone(s string) string {
	s = strings.TrimSpace(s)
	var sb strings.Builder
	for i, r := range s {
		if (r >= '0' && r <= '9') || (r == '+' && i == 0) {
			sb.WriteRune(r)
		}
	}
	return sb.String()
}

// ValidateNIK validates that NIK is exactly 16 numeric digits
func ValidateNIK(nik string, required bool) error {
	clean := CleanDigits(nik)
	if clean == "" {
		if required {
			return errors.New("NIK wajib diisi")
		}
		return nil
	}
	if !nikRegex.MatchString(clean) {
		return errors.New("NIK harus terdiri dari tepat 16 digit angka")
	}
	return nil
}

// ValidateNIB validates that NIB is exactly 13 numeric digits (or a DRAFT prefix)
func ValidateNIB(nib string, required bool) error {
	trimmed := strings.TrimSpace(nib)
	if trimmed == "" {
		if required {
			return errors.New("NIB wajib diisi")
		}
		return nil
	}
	if strings.HasPrefix(trimmed, "DRAFT-") {
		return nil
	}
	clean := CleanDigits(trimmed)
	if !nibRegex.MatchString(clean) {
		return errors.New("NIB harus terdiri dari tepat 13 digit angka")
	}
	return nil
}

// ValidatePhone validates phone number format
func ValidatePhone(phone string, required bool) error {
	clean := CleanPhone(phone)
	if clean == "" {
		if required {
			return errors.New("nomor telepon / WhatsApp wajib diisi")
		}
		return nil
	}
	// Normalize leading 0 to 08 if valid or general phone length
	if len(clean) < 10 || len(clean) > 15 {
		return errors.New("nomor telepon harus memiliki panjang antara 10 hingga 15 digit")
	}
	if !phoneRegex.MatchString(clean) && !strings.HasPrefix(clean, "0") && !strings.HasPrefix(clean, "+") && !strings.HasPrefix(clean, "62") {
		return errors.New("format nomor telepon tidak valid")
	}
	return nil
}

// ValidateEmail validates email address format
func ValidateEmail(email string, required bool) error {
	trimmed := strings.TrimSpace(email)
	if trimmed == "" {
		if required {
			return errors.New("email wajib diisi")
		}
		return nil
	}
	if !emailRegex.MatchString(trimmed) {
		return errors.New("format email tidak valid")
	}
	return nil
}

// MaskNIK masks the middle digits of NIK for privacy protection (e.g., 3201********1234)
func MaskNIK(nik string) string {
	clean := CleanDigits(nik)
	if len(clean) < 8 {
		return clean
	}
	if len(clean) == 16 {
		return clean[:4] + "********" + clean[12:]
	}
	return clean[:2] + strings.Repeat("*", len(clean)-4) + clean[len(clean)-2:]
}

// MaskPhone masks phone number for privacy display (e.g., 0812****7890)
func MaskPhone(phone string) string {
	clean := CleanPhone(phone)
	if len(clean) < 8 {
		return clean
	}
	return clean[:4] + "****" + clean[len(clean)-4:]
}
