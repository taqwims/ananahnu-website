package http

import (
	"ananahnu/internal/delivery/middleware"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MediaHandler struct{}

func NewMediaHandler(r *gin.Engine) {
	handler := &MediaHandler{}

	g := r.Group("/media")
	g.Use(middleware.AuthMiddleware())
	{
		g.POST("/upload", handler.Upload)
	}
}

func (h *MediaHandler) Upload(c *gin.Context) {
	fmt.Printf("[UPLOAD] Request Content-Type: %s\n", c.GetHeader("Content-Type"))

	// 1. Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		fmt.Printf("[UPLOAD] FormFile error: %v\n", err)
		// Try to parse multipart form manually if FormFile fails
		if multipartErr := c.Request.ParseMultipartForm(32 << 20); multipartErr != nil {
			fmt.Printf("[UPLOAD] ParseMultipartForm error: %v\n", multipartErr)
		} else {
			fmt.Printf("[UPLOAD] Multipart form parsed. Keys: %v\n", c.Request.MultipartForm.File)
		}
		
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// 2. Validate size (Max 2MB)
	if file.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 2MB limit"})
		return
	}

	// 3. Determine folder
	subfolder := c.Query("subfolder")
	if subfolder == "" {
		subfolder = "general"
	}
	
	// Sanitize subfolder to prevent path traversal
	subfolder = filepath.Base(subfolder) 

	var folderPath string
	if subfolder == "paymentproof" || subfolder == "consultant" {
		// Special folders at root level as requested
		folderPath = subfolder
	} else {
		// Default behavior: uploads/subfolder/year-month
		now := time.Now()
		folderPath = filepath.Join("uploads", subfolder, now.Format("2006-01"))
	}
	
	// Create folder if not exists
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		fmt.Printf("[UPLOAD] Failed to create directory %s: %v\n", folderPath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// 4. Create unique filename
	ext := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	dst := filepath.Join(folderPath, newFileName)

	// 5. Save file
	if err := c.SaveUploadedFile(file, dst); err != nil {
		fmt.Printf("[UPLOAD] Failed to save file to %s: %v\n", dst, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// 6. Return relative URL (with forward slashes for web)
	var url string
	if subfolder == "consultant" {
		url = "/consultant-docs/" + newFileName
	} else {
		url = "/" + filepath.ToSlash(dst)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"url":      url,
		"filename": file.Filename,
		"size":     file.Size,
	})
}
