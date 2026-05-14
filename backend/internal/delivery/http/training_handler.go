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
		g.GET("/", handler.GetTrainings)
		g.GET("/:id", handler.GetTraining)
		g.POST("/", handler.CreateTraining)
		g.PUT("/:id", handler.UpdateTraining)
		g.DELETE("/:id", handler.DeleteTraining)
		g.PUT("/:id/status", handler.UpdateStatus)

		// Participants
		g.GET("/:id/participants", handler.GetParticipants)
		g.POST("/:id/participants", handler.AddParticipant)
		g.PUT("/:id/participants/:userId", handler.UpdateParticipantStatus)
		g.DELETE("/participants/:participantId", handler.RemoveParticipant)
	}

	// User's training history
	r.GET("/user-trainings/:userId", handler.GetUserTrainings)
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
	case "KOORDINATOR":
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
