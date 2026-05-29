package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authUseCase usecase.AuthUsecase
}

func NewAuthHandler(r *gin.Engine, uc usecase.AuthUsecase) {
	handler := &AuthHandler{
		authUseCase: uc,
	}

	auth := r.Group("/auth")
	{
		auth.POST("/login", handler.Login)
		auth.POST("/register", handler.Register)
		auth.POST("/forgot-password", handler.ForgotPassword)
		auth.POST("/reset-password", handler.ResetPassword)
		auth.GET("/facilitators", handler.ListFacilitators)
	}
	
	admin := r.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.RoleMiddleware("DIRECTOR"))
	{
		admin.POST("/users/generate", handler.GenerateAccount)
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, refreshToken, user, err := h.authUseCase.Login(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Guard against unloaded Role relation
	roleName := user.Role.Name

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user": gin.H{
			"id":            user.ID,
			"email":         user.Email,
			"full_name":     user.FullName,
			"role":          roleName,
			"leader":        user.Leader,
			"referral_code": user.ReferralCode,
			"phone":         user.Phone,
			"address":       user.Address,
			"province_id":   user.ProvinceID,
			"regency_id":    user.RegencyID,
			"avatar_url":    user.AvatarURL,
		},
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input usecase.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authUseCase.Register(input); err != nil {
		// Business logic errors (email exists, invalid referral, etc.) → 400
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "account registered successfully"})
}

func (h *AuthHandler) RegisterClient(c *gin.Context) {
	h.Register(c)
}

func (h *AuthHandler) GenerateAccount(c *gin.Context) {
	var input usecase.GenerateAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	password, err := h.authUseCase.GenerateAccount(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "account created",
		"password": password, // One-time show
	})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Always return 200 regardless of whether the email exists,
	// to prevent email enumeration attacks.
	_ = h.authUseCase.ForgotPassword(input.Email)
	c.JSON(http.StatusOK, gin.H{"message": "If that email is registered, a reset link has been sent."})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authUseCase.ResetPassword(input.Token, input.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (h *AuthHandler) ListFacilitators(c *gin.Context) {
	facilitators, err := h.authUseCase.ListFacilitators()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, facilitators)
}
