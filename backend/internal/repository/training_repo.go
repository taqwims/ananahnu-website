package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- TrainingRepository ---

type trainingRepository struct {
	db *gorm.DB
}

func NewTrainingRepository(db *gorm.DB) domain.TrainingRepository {
	return &trainingRepository{db: db}
}

func (r *trainingRepository) FindAll() ([]domain.Training, error) {
	var trainings []domain.Training
	if err := r.db.Order("start_date DESC").Find(&trainings).Error; err != nil {
		return nil, err
	}
	return trainings, nil
}

func (r *trainingRepository) FindByID(id int64) (*domain.Training, error) {
	var training domain.Training
	if err := r.db.Preload("Participants.User").First(&training, id).Error; err != nil {
		return nil, err
	}
	return &training, nil
}

func (r *trainingRepository) Create(training *domain.Training) error {
	return r.db.Create(training).Error
}

func (r *trainingRepository) Update(training *domain.Training) error {
	return r.db.Save(training).Error
}

func (r *trainingRepository) Delete(id int64) error {
	return r.db.Delete(&domain.Training{}, id).Error
}

// --- TrainingParticipantRepository ---

type trainingParticipantRepository struct {
	db *gorm.DB
}

func NewTrainingParticipantRepository(db *gorm.DB) domain.TrainingParticipantRepository {
	return &trainingParticipantRepository{db: db}
}

func (r *trainingParticipantRepository) FindByTraining(trainingID int64) ([]domain.TrainingParticipant, error) {
	var participants []domain.TrainingParticipant
	if err := r.db.Preload("User").Where("training_id = ?", trainingID).Find(&participants).Error; err != nil {
		return nil, err
	}
	return participants, nil
}

func (r *trainingParticipantRepository) FindByUser(userID uuid.UUID) ([]domain.TrainingParticipant, error) {
	var participants []domain.TrainingParticipant
	if err := r.db.Preload("Training").Where("user_id = ?", userID).Find(&participants).Error; err != nil {
		return nil, err
	}
	return participants, nil
}

func (r *trainingParticipantRepository) Create(participant *domain.TrainingParticipant) error {
	return r.db.Create(participant).Error
}

func (r *trainingParticipantRepository) UpdateStatus(trainingID int64, userID uuid.UUID, status string) error {
	return r.db.Model(&domain.TrainingParticipant{}).
		Where("training_id = ? AND user_id = ?", trainingID, userID).
		Update("status", status).Error
}

func (r *trainingParticipantRepository) Delete(id int64) error {
	return r.db.Delete(&domain.TrainingParticipant{}, id).Error
}
