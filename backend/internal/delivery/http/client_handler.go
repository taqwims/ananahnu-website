package http

import (
	"ananahnu/internal/domain"
	"ananahnu/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ClientHandler struct {
	clientUC usecase.ClientUsecase
}

func NewClientHandler(r *gin.Engine, uc usecase.ClientUsecase) {
	handler := &ClientHandler{clientUC: uc}

	g := r.Group("/clients")
	// Auth middleware needed here
	{
		g.POST("", handler.Create)
		g.GET("", handler.GetList)
		g.GET("/:id", handler.GetDetail)
		g.PUT("/:id", handler.Update)
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

	clients, total, err := h.clientUC.GetClients(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  clients,
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

	if err := h.clientUC.CreateClient(&input); err != nil {
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

	var input domain.Client
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id // Ensure ID matches

	if err := h.clientUC.UpdateClient(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}
