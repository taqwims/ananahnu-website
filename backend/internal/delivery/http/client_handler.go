package http

import (
	"ananahnu/internal/delivery/middleware"
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ClientHandler struct {
	clientUC usecase.ClientUsecase
	userRepo domain.UserRepository
}

func NewClientHandler(r *gin.Engine, uc usecase.ClientUsecase, userRepo domain.UserRepository) {
	handler := &ClientHandler{clientUC: uc, userRepo: userRepo}

	g := r.Group("/clients")
	g.Use(middleware.AuthMiddleware())
	{
		g.POST("", handler.Create)
		g.GET("", handler.GetList)
		g.GET("/:id", handler.GetDetail)
		g.PUT("/:id", handler.Update)
		g.GET("/by-team/:coordinatorId", handler.GetByTeam)
	}
}

func (h *ClientHandler) GetList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := make(map[string]interface{})
	if q := c.Query("search"); q != "" {
		filter["search"] = q
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if facilitatorID := c.Query("facilitator_id"); facilitatorID != "" {
		filter["facilitator_id"] = facilitatorID
	}

	// If the logged-in user is KOORDINATOR, auto-filter to their team
	role := middleware.GetUserRole(c)
	userID := middleware.GetUserID(c)
	if role == "KOORDINATOR" {
		teamMembers, err := h.userRepo.FindByLeaderID(userID)
		if err == nil && len(teamMembers) > 0 {
			ids := make([]string, len(teamMembers))
			for i, m := range teamMembers {
				ids[i] = m.ID.String()
			}
			filter["facilitator_ids"] = ids
		}
	} else if role == "HALAL_KONSULTAN" || role == "MARKETING" {
		// Konsultan and Marketing only see their own clients
		filter["facilitator_id"] = userID.String()
	}

	clients, total, err := h.clientUC.GetClients(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": clients,
		"meta": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func (h *ClientHandler) Create(c *gin.Context) {
	var input domain.Client
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto-set facilitator_id and created_by from JWT if not provided
	userID := middleware.GetUserID(c)
	if input.FacilitatorID == uuid.Nil {
		input.FacilitatorID = userID
	}
	if input.CreatedBy == uuid.Nil {
		input.CreatedBy = userID
	}

	if err := h.clientUC.CreateClient(&input); err != nil {
		if err == domain.ErrNIBExists {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": input.ID, "message": "created"})
}

func (h *ClientHandler) GetDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	client, err := h.clientUC.GetClient(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// Fetch the existing client first
	existing, err := h.clientUC.GetClient(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
		return
	}

	// Only bind the editable fields from the request body
	var input struct {
		BusinessName  string `json:"business_name"`
		ClientName    string `json:"client_name"`
		NIB           string `json:"nib"`
		NIK           string `json:"nik"`
		ProductName   string `json:"product_name"`
		Address       string `json:"address"`
		ContactPerson string `json:"contact_person"`
		Phone         string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Apply editable fields to the existing client
	existing.BusinessName = input.BusinessName
	existing.ClientName = input.ClientName
	existing.NIB = input.NIB
	existing.NIK = input.NIK
	existing.ProductName = input.ProductName
	existing.Address = input.Address
	existing.ContactPerson = input.ContactPerson
	existing.Phone = input.Phone

	if err := h.clientUC.UpdateClient(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// GetByTeam returns all clients belonging to consultants under a coordinator.
func (h *ClientHandler) GetByTeam(c *gin.Context) {
	coordinatorID, err := uuid.Parse(c.Param("coordinatorId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid coordinator id"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	// Get team members
	teamMembers, err := h.userRepo.FindByLeaderID(coordinatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(teamMembers) == 0 {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "meta": gin.H{"total": 0}})
		return
	}

	ids := make([]string, len(teamMembers))
	for i, m := range teamMembers {
		ids[i] = m.ID.String()
	}

	filter := map[string]interface{}{
		"facilitator_ids": ids,
	}

	clients, total, err := h.clientUC.GetClients(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": clients,
		"meta": gin.H{"page": page, "limit": limit, "total": total},
	})
}
