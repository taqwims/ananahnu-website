package usecase

import (
	"ananahnu/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type TrainingUsecase interface {
	GetTrainings() ([]domain.Training, error)
	GetTraining(id int64) (*domain.Training, error)
	CreateTraining(training *domain.Training) error
	UpdateTraining(training *domain.Training) error
	DeleteTraining(id int64) error

	GetParticipants(trainingID int64) ([]domain.TrainingParticipant, error)
	GetUserTrainings(userID uuid.UUID) ([]domain.TrainingParticipant, error)
	AddParticipant(trainingID int64, userID uuid.UUID) error
	UpdateParticipantStatus(trainingID int64, userID uuid.UUID, status string) error
	RemoveParticipant(id int64) error
}

type trainingUsecase struct {
	trainingRepo    domain.TrainingRepository
	participantRepo domain.TrainingParticipantRepository
}

func NewTrainingUsecase(t domain.TrainingRepository, p domain.TrainingParticipantRepository) TrainingUsecase {
	return &trainingUsecase{trainingRepo: t, participantRepo: p}
}

func (uc *trainingUsecase) GetTrainings() ([]domain.Training, error) {
	return uc.trainingRepo.FindAll()
}

func (uc *trainingUsecase) GetTraining(id int64) (*domain.Training, error) {
	return uc.trainingRepo.FindByID(id)
}

func (uc *trainingUsecase) CreateTraining(training *domain.Training) error {
	if training.Title == "" {
		return errors.New("title is required")
	}
	return uc.trainingRepo.Create(training)
}

func (uc *trainingUsecase) UpdateTraining(training *domain.Training) error {
	return uc.trainingRepo.Update(training)
}

func (uc *trainingUsecase) DeleteTraining(id int64) error {
	return uc.trainingRepo.Delete(id)
}

func (uc *trainingUsecase) GetParticipants(trainingID int64) ([]domain.TrainingParticipant, error) {
	return uc.participantRepo.FindByTraining(trainingID)
}

func (uc *trainingUsecase) GetUserTrainings(userID uuid.UUID) ([]domain.TrainingParticipant, error) {
	return uc.participantRepo.FindByUser(userID)
}

func (uc *trainingUsecase) AddParticipant(trainingID int64, userID uuid.UUID) error {
	p := &domain.TrainingParticipant{
		TrainingID: trainingID,
		UserID:     userID,
		Status:     "PESERTA",
	}
	return uc.participantRepo.Create(p)
}

func (uc *trainingUsecase) UpdateParticipantStatus(trainingID int64, userID uuid.UUID, status string) error {
	if status != "PESERTA" && status != "LULUS" {
		return errors.New("status must be PESERTA or LULUS")
	}
	return uc.participantRepo.UpdateStatus(trainingID, userID, status)
}

func (uc *trainingUsecase) RemoveParticipant(id int64) error {
	return uc.participantRepo.Delete(id)
}
