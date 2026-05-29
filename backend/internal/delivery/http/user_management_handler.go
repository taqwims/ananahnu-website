package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserManagementHandler struct {
	userMgmtUC usecase.UserManagementUsecase
}

func NewUserManagementHandler(r *gin.Engine, uc usecase.UserManagementUsecase) {
	handler := &UserManagementHandler{userMgmtUC: uc}

	g := r.Group("/admin/users")
	g.Use(middleware.AuthMiddleware())
	{
		// Endpoint lookup untuk dropdown/assignment — bisa diakses role operasional
		g.GET("/coordinators", handler.ListCoordinators)
		g.GET("/drafters", handler.ListDrafters)
		g.GET("/consultants", handler.ListConsultants)

		// Semua operasi user management hanya DIRECTOR
		directorOnly := g.Group("")
		directorOnly.Use(middleware.RoleMiddleware("DIRECTOR"))
		{
			directorOnly.POST("", handler.CreateUser)
			directorOnly.PUT("/:id", handler.UpdateUser)
			directorOnly.DELETE("/:id", handler.DeleteUser)
			directorOnly.PUT("/:id/reset-password", handler.ResetPassword)
		}

		// List & detail user — DIRECTOR + ADMIN_PELATIHAN (untuk lihat daftar pendaftar HALAL_ADVISOR)
		readRoles := middleware.RoleMiddleware("DIRECTOR", "ADMIN_PELATIHAN")
		g.GET("", readRoles, handler.ListUsers)
		g.GET("/:id", readRoles, handler.GetUser)

		// Referral analytics — DIRECTOR + ADMIN_PELATIHAN + ADMIN_KEUANGAN
		g.GET("/referrals/analytics",
			middleware.RoleMiddleware("DIRECTOR", "ADMIN_PELATIHAN", "ADMIN_KEUANGAN"),
			handler.GetAllReferralAnalytics,
		)
	}

	// Roles list (for dropdowns)
	r.GET("/admin/roles", middleware.AuthMiddleware(), handler.ListRoles)

	// Profile
	profile := r.Group("/profile")
	profile.Use(middleware.AuthMiddleware())
	{
		profile.GET("", handler.GetProfile)
		profile.PUT("", handler.UpdateProfile)
		profile.GET("/referrals", handler.GetReferrals)
		profile.GET("/commissions", handler.GetCommissions)
		profile.POST("/referral/regenerate", handler.RegenerateReferralCode)
	}
}

func (h *UserManagementHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := make(map[string]interface{})
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}
	if roleID := c.Query("role_id"); roleID != "" {
		filter["role_id"] = roleID
	}
	if roleName := c.Query("role"); roleName != "" {
		filter["role"] = roleName
	}
	if noLeader := c.Query("no_leader"); noLeader == "true" {
		filter["no_leader"] = true
	}

	users, total, err := h.userMgmtUC.ListUsers(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *UserManagementHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	user, err := h.userMgmtUC.GetUser(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserManagementHandler) CreateUser(c *gin.Context) {
	var input usecase.CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, password, err := h.userMgmtUC.CreateUser(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":     user,
		"password": password,
		"message":  "user created successfully",
	})
}

func (h *UserManagementHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input usecase.UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userMgmtUC.UpdateUser(id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user updated"})
}

func (h *UserManagementHandler) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userMgmtUC.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserManagementHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input usecase.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userMgmtUC.UpdateProfile(userID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func (h *UserManagementHandler) GetReferrals(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	referrals, err := h.userMgmtUC.GetReferrals(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, referrals)
}

func (h *UserManagementHandler) GetCommissions(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	commissions, err := h.userMgmtUC.GetMyCommissions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, commissions)
}

func (h *UserManagementHandler) GetAllReferralAnalytics(c *gin.Context) {
	analytics, err := h.userMgmtUC.GetAllReferralAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *UserManagementHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.userMgmtUC.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}

func (h *UserManagementHandler) ResetPassword(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	password, err := h.userMgmtUC.ResetUserPassword(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"password": password,
		"message":  "password reset successfully",
	})
}

func (h *UserManagementHandler) ListRoles(c *gin.Context) {
	roles, err := h.userMgmtUC.ListRoles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

func (h *UserManagementHandler) ListCoordinators(c *gin.Context) {
	filter := map[string]interface{}{"role_name": "HALAL_MANAGER"}
	users, _, err := h.userMgmtUC.ListUsers(filter, 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserManagementHandler) ListDrafters(c *gin.Context) {
	filter := map[string]interface{}{"role_name": "DRAFTER"}
	users, _, err := h.userMgmtUC.ListUsers(filter, 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserManagementHandler) ListConsultants(c *gin.Context) {
	filter := map[string]interface{}{"roles": []string{"HALAL_ADVISOR", "HALAL_MANAGER", "MARKETING"}}
	users, _, err := h.userMgmtUC.ListUsers(filter, 1, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserManagementHandler) RegenerateReferralCode(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	newCode, err := h.userMgmtUC.RegenerateReferralCode(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"referral_code": newCode,
		"message":       "referral code regenerated successfully",
	})
}
