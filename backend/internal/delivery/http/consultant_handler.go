package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ConsultantHandler struct {
	consultantUC usecase.ConsultantUsecase
}

func NewConsultantHandler(r *gin.Engine, uc usecase.ConsultantUsecase) {
	handler := &ConsultantHandler{consultantUC: uc}

	g := r.Group("/consultant")
	g.Use(middleware.AuthMiddleware())
	{
		// Semua user login bisa lihat & update profil sendiri
		g.GET("/profile/:userId", handler.GetProfile)
		g.PUT("/profile",
			middleware.RoleMiddleware("HALAL_ADVISOR", "HALAL_MANAGER"),
			handler.UpdateProfile,
		)

		// Verifikasi & list semua profil — ADMIN_PELATIHAN, DIRECTOR, HALAL_MANAGER
		adminOnly := g.Group("")
		adminOnly.Use(middleware.RoleMiddleware("ADMIN_PELATIHAN", "DIRECTOR", "HALAL_MANAGER"))
		{
			adminOnly.GET("/profiles", handler.GetAllProfiles)
			adminOnly.PUT("/profiles/:userId/verify", handler.VerifyProfile)
		}
	}
}

// GetProfile returns the consultant profile for a given user.
func (h *ConsultantHandler) GetProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	profile, err := h.consultantUC.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile creates or updates a consultant profile.
func (h *ConsultantHandler) UpdateProfile(c *gin.Context) {
	var input domain.ConsultantProfile
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Extract userID from JWT context
	userID := middleware.GetUserID(c)
	input.UserID = userID

	if err := h.consultantUC.UpdateProfile(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

// GetAllProfiles lists all consultant profiles (for Halal Manager/Admin).
func (h *ConsultantHandler) GetAllProfiles(c *gin.Context) {
	profiles, err := h.consultantUC.GetAllProfiles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profiles)
}

// VerifyProfile approves/rejects a consultant's recruitment profile.
func (h *ConsultantHandler) VerifyProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	var input struct {
		Verified bool       `json:"verified"`
		LeaderID *uuid.UUID `json:"leader_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.consultantUC.VerifyProfile(userID, input.Verified, input.LeaderID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "verification updated"})
}
