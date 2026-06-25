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

type TrainingHandler struct {
	trainingUC usecase.TrainingUsecase
}

func NewTrainingHandler(r *gin.Engine, uc usecase.TrainingUsecase) {
	handler := &TrainingHandler{trainingUC: uc}

	g := r.Group("/trainings")
	g.Use(middleware.AuthMiddleware())
	{
		// GET boleh diakses semua role yang login
		g.GET("/", handler.GetTrainings)
		g.GET("/:id", handler.GetTraining)
		g.GET("/:id/participants", handler.GetParticipants)

		// Write — hanya role yang relevan (role check lebih detail ada di handler)
		writeRoles := middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_PELATIHAN", "HALAL_MANAGER", "HALAL_DIRECTOR")
		g.POST("/", writeRoles, handler.CreateTraining)
		g.PUT("/:id", writeRoles, handler.UpdateTraining)
		g.DELETE("/:id", middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_PELATIHAN"), handler.DeleteTraining)
		g.PUT("/:id/status", middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_PELATIHAN"), handler.UpdateStatus)

		// Participants
		g.POST("/:id/participants", writeRoles, handler.AddParticipant)
		g.PUT("/:id/participants/:userId", middleware.RoleMiddleware("DIRECTOR", "MANAGER", "ADMIN_PELATIHAN"), handler.UpdateParticipantStatus)
		g.DELETE("/participants/:participantId", writeRoles, handler.RemoveParticipant)

		// List users available to be added as participants (HALAL_ADVISOR)
		g.GET("/available-participants", writeRoles, handler.ListAvailableParticipants)
	}

	// User's training history — semua user bisa lihat history sendiri
	r.GET("/user-trainings/:userId", middleware.AuthMiddleware(), handler.GetUserTrainings)
}

func (h *TrainingHandler) GetTrainings(c *gin.Context) {
	filter := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if proposedBy := c.Query("proposed_by"); proposedBy != "" {
		filter["proposed_by"] = proposedBy
	}

	trainings, err := h.trainingUC.GetTrainings(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, trainings)
}

func (h *TrainingHandler) GetTraining(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	training, err := h.trainingUC.GetTraining(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "training not found"})
		return
	}
	c.JSON(http.StatusOK, training)
}

func (h *TrainingHandler) CreateTraining(c *gin.Context) {
	var input domain.Training
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := middleware.GetUserRole(c)
	userID := middleware.GetUserID(c)

	switch role {
	case "HALAL_MANAGER", "HALAL_DIRECTOR":
		input.Status = "PENDING"
		input.ProposedBy = &userID
	case "ADMIN_PELATIHAN", "MANAGER", "DIRECTOR":
		input.Status = "APPROVED"
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "only coordinator or admin can create training"})
		return
	}

	if err := h.trainingUC.CreateTraining(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

func (h *TrainingHandler) UpdateStatus(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input struct {
		Status string `json:"status" binding:"required"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := middleware.GetUserRole(c)
	if role != "ADMIN_PELATIHAN" && role != "MANAGER" && role != "DIRECTOR" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admin can update training status"})
		return
	}

	if err := h.trainingUC.UpdateTrainingStatus(id, input.Status, input.Reason); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

func (h *TrainingHandler) UpdateTraining(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input domain.Training
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	if err := h.trainingUC.UpdateTraining(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "training updated"})
}

func (h *TrainingHandler) DeleteTraining(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.trainingUC.DeleteTraining(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "training deleted"})
}

func (h *TrainingHandler) GetParticipants(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	participants, err := h.trainingUC.GetParticipants(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, participants)
}

func (h *TrainingHandler) AddParticipant(c *gin.Context) {
	trainingID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input struct {
		UserID string `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}
	if err := h.trainingUC.AddParticipant(trainingID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "participant added"})
}

func (h *TrainingHandler) UpdateParticipantStatus(c *gin.Context) {
	trainingID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.trainingUC.UpdateParticipantStatus(trainingID, userID, input.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

func (h *TrainingHandler) RemoveParticipant(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("participantId"), 10, 64)
	if err := h.trainingUC.RemoveParticipant(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "participant removed"})
}

func (h *TrainingHandler) GetUserTrainings(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}
	trainings, err := h.trainingUC.GetUserTrainings(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, trainings)
}

// ListAvailableParticipants returns users (HALAL_ADVISOR) that can be added to a training.
// Accessible by ADMIN_PELATIHAN, MANAGER, DIRECTOR, HALAL_MANAGER.
func (h *TrainingHandler) ListAvailableParticipants(c *gin.Context) {
	search := c.Query("search")
	userIDVal, existsUserID := c.Get("userID")
	roleVal, existsRole := c.Get("role")

	var userID uuid.UUID
	var role string

	if existsUserID {
		if id, ok := userIDVal.(uuid.UUID); ok {
			userID = id
		}
	}
	if existsRole {
		if r, ok := roleVal.(string); ok {
			role = r
		}
	}

	users, err := h.trainingUC.GetAvailableParticipants(search, userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}
