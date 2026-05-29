package usecase

import (
	"ananahnu/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type TrainingUsecase interface {
	GetTrainings(filter map[string]interface{}) ([]domain.Training, error)
	GetTraining(id int64) (*domain.Training, error)
	CreateTraining(training *domain.Training) error
	UpdateTraining(training *domain.Training) error
	UpdateTrainingStatus(id int64, status string, reason string) error
	DeleteTraining(id int64) error

	GetParticipants(trainingID int64) ([]domain.TrainingParticipant, error)
	GetUserTrainings(userID uuid.UUID) ([]domain.TrainingParticipant, error)
	AddParticipant(trainingID int64, userID uuid.UUID) error
	UpdateParticipantStatus(trainingID int64, userID uuid.UUID, status string) error
	RemoveParticipant(id int64) error

	// GetAvailableParticipants returns users eligible to be added as training participants
	GetAvailableParticipants(search string) ([]domain.User, error)
}

type TrainingUsecaseDeps struct {
	TrainingRepo    domain.TrainingRepository
	ParticipantRepo domain.TrainingParticipantRepository
	UserRepo        domain.UserRepository
}

type trainingUsecase struct {
	TrainingUsecaseDeps
}

func NewTrainingUsecase(deps TrainingUsecaseDeps) TrainingUsecase {
	return &trainingUsecase{
		TrainingUsecaseDeps: deps,
	}
}

func (uc *trainingUsecase) GetTrainings(filter map[string]interface{}) ([]domain.Training, error) {
	return uc.TrainingRepo.FindAll(filter)
}

func (uc *trainingUsecase) GetTraining(id int64) (*domain.Training, error) {
	return uc.TrainingRepo.FindByID(id)
}

func (uc *trainingUsecase) CreateTraining(training *domain.Training) error {
	if training.Title == "" {
		return errors.New("title is required")
	}
	return uc.TrainingRepo.Create(training)
}

func (uc *trainingUsecase) UpdateTraining(training *domain.Training) error {
	return uc.TrainingRepo.Update(training)
}

func (uc *trainingUsecase) UpdateTrainingStatus(id int64, status string, reason string) error {
	if status != "APPROVED" && status != "REJECTED" && status != "PENDING" {
		return errors.New("invalid status")
	}
	return uc.TrainingRepo.UpdateStatus(id, status, reason)
}

func (uc *trainingUsecase) DeleteTraining(id int64) error {
	return uc.TrainingRepo.Delete(id)
}

func (uc *trainingUsecase) GetParticipants(trainingID int64) ([]domain.TrainingParticipant, error) {
	return uc.ParticipantRepo.FindByTraining(trainingID)
}

func (uc *trainingUsecase) GetUserTrainings(userID uuid.UUID) ([]domain.TrainingParticipant, error) {
	return uc.ParticipantRepo.FindByUser(userID)
}

func (uc *trainingUsecase) AddParticipant(trainingID int64, userID uuid.UUID) error {
	p := &domain.TrainingParticipant{
		TrainingID: trainingID,
		UserID:     userID,
		Status:     "PESERTA",
	}
	return uc.ParticipantRepo.Create(p)
}

func (uc *trainingUsecase) UpdateParticipantStatus(trainingID int64, userID uuid.UUID, status string) error {
	if status != "PESERTA" && status != "LULUS" {
		return errors.New("status must be PESERTA or LULUS")
	}
	return uc.ParticipantRepo.UpdateStatus(trainingID, userID, status)
}

func (uc *trainingUsecase) RemoveParticipant(id int64) error {
	return uc.ParticipantRepo.Delete(id)
}

// GetAvailableParticipants returns HALAL_ADVISOR users that can be added as participants.
// Optionally filter by name/email via search string.
func (uc *trainingUsecase) GetAvailableParticipants(search string) ([]domain.User, error) {
	filter := map[string]interface{}{
		"role": "HALAL_ADVISOR",
	}
	if search != "" {
		filter["search"] = search
	}
	users, _, err := uc.UserRepo.FindAll(filter, 1, 1000)
	return users, err
}
