package qrcode

import (
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/png"
	"os"

	"github.com/skip2/go-qrcode"
)

// GenerateWithLogo generates a QR code containing the provided URL, and overlays a logo at the center.
func GenerateWithLogo(url string, logoPath string) ([]byte, error) {
	// 1. Generate QR Code
	qr, err := qrcode.New(url, qrcode.Medium)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	qrImage := qr.Image(256)

	// 2. Load Logo
	logoFile, err := os.Open(logoPath)
	if err != nil {
		// If logo is not found, fallback to just QR code
		var buf bytes.Buffer
		if err := png.Encode(&buf, qrImage); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	}
	defer logoFile.Close()

	logoImage, _, err := image.Decode(logoFile)
	if err != nil {
		return nil, fmt.Errorf("failed to decode logo image: %w", err)
	}

	// 3. Resize logo proportionally (max 20% of QR size to preserve readability)
	qrBounds := qrImage.Bounds()

	targetSize := qrBounds.Dx() / 5
	// Simple nearest-neighbor scaling for simplicity (since logo is presumably small/simple)
	// Alternatively, we could just rely on the logo already being small enough, but let's scale it.
	
	// Create a new blank image
	resultImage := image.NewRGBA(qrBounds)
	draw.Draw(resultImage, qrBounds, qrImage, image.Point{}, draw.Src)

	// Calculate center offset
	offsetX := (qrBounds.Dx() - targetSize) / 2
	offsetY := (qrBounds.Dy() - targetSize) / 2

	// We scale the logo while drawing
	scaledLogo := scaleImage(logoImage, targetSize)

	// Overlay logo
	draw.Draw(resultImage, image.Rect(offsetX, offsetY, offsetX+targetSize, offsetY+targetSize), scaledLogo, image.Point{}, draw.Over)

	// Encode to PNG
	var buf bytes.Buffer
	if err := png.Encode(&buf, resultImage); err != nil {
		return nil, fmt.Errorf("failed to encode result image: %w", err)
	}

	return buf.Bytes(), nil
}

// Simple nearest neighbor scaler
func scaleImage(img image.Image, size int) image.Image {
	bounds := img.Bounds()
	scaled := image.NewRGBA(image.Rect(0, 0, size, size))
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			srcX := bounds.Min.X + (x * bounds.Dx() / size)
			srcY := bounds.Min.Y + (y * bounds.Dy() / size)
			scaled.Set(x, y, img.At(srcX, srcY))
		}
	}
	return scaled
}
