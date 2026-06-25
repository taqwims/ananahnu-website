package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"strings"
	"time"

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
	GetAvailableParticipants(search string, userID uuid.UUID, role string) ([]domain.User, error)
}

type TrainingUsecaseDeps struct {
	TrainingRepo    domain.TrainingRepository
	ParticipantRepo domain.TrainingParticipantRepository
	UserRepo        domain.UserRepository
	PromotionRepo   domain.PromotionRepository
	CommissionRepo  domain.CommissionRepository
	RoleRepo        domain.RoleRepository
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
	if err := uc.ParticipantRepo.UpdateStatus(trainingID, userID, status); err != nil {
		return err
	}

	if status == "LULUS" {
		// Find active PromotionRequest for this user
		reqs, err := uc.PromotionRepo.FindAll(map[string]interface{}{
			"user_id": userID,
		})
		if err == nil {
			var req *domain.PromotionRequest
			for i := range reqs {
				if reqs[i].Status == domain.PromotionStatusTraining {
					req = &reqs[i]
					break
				}
			}
			if req == nil {
				for i := range reqs {
					if reqs[i].Status == domain.PromotionStatusPending {
						req = &reqs[i]
						break
					}
				}
			}
			if req != nil {
				req.Status = domain.PromotionStatusPassed
				req.UpdatedAt = time.Now()
				_ = uc.PromotionRepo.Update(req)
			}
		}

		// Update user's role to HALAL_MANAGER
		user, err := uc.UserRepo.FindByID(userID)
		if err == nil && user != nil {
			role, errRole := uc.RoleRepo.FindByName("HALAL_MANAGER")
			if errRole == nil && role != nil {
				user.RoleID = role.ID
				_ = uc.UserRepo.Update(user)

				// Calculate structural referral commission
				if user.LeaderID != nil {
					period := time.Now().Format("2006-01")
					commissions, _, _ := uc.CommissionRepo.FindAll(map[string]interface{}{
						"user_id": user.ID,
						"type":    domain.CommissionTypeDirectSales,
					}, 1, 10000)

					var totalOmset float64
					for _, c := range commissions {
						totalOmset += c.BaseOmset
					}

					if totalOmset > 0 {
						_ = uc.CommissionRepo.UpsertStructural(&domain.Commission{
							ID:         uuid.New(),
							Type:       domain.CommissionTypeReferral,
							ReferrerID: user.LeaderID,
							ReferredID: &user.ID,
							Period:     period,
							BaseOmset:  totalOmset,
							Amount:     totalOmset * 0.01,
							Status:     domain.CommissionStatusPending,
						})
					}
				}
			}
		}
	}

	return nil
}

func (uc *trainingUsecase) RemoveParticipant(id int64) error {
	return uc.ParticipantRepo.Delete(id)
}

// GetAvailableParticipants returns HALAL_ADVISOR users that can be added as participants.
// Filters only advisors with active IN_TRAINING promotion requests.
// For HALAL_MANAGER role, filters only users referred by that manager.
func (uc *trainingUsecase) GetAvailableParticipants(search string, userID uuid.UUID, role string) ([]domain.User, error) {
	// Find all HALAL_ADVISOR users
	users, _, err := uc.UserRepo.FindAll(map[string]interface{}{
		"role": "HALAL_ADVISOR",
	}, 1, 1000)
	if err != nil {
		return nil, err
	}

	var filteredUsers []domain.User
	for _, user := range users {
		// Filter out advisors who have completed/passed any training (status = LULUS)
		hasGraduated := false
		trainings, errT := uc.ParticipantRepo.FindByUser(user.ID)
		if errT == nil {
			for _, t := range trainings {
				if t.Status == "LULUS" {
					hasGraduated = true
					break
				}
			}
		}
		if hasGraduated {
			continue
		}

		if search != "" {
			searchLower := strings.ToLower(search)
			fullNameLower := strings.ToLower(user.FullName)
			emailLower := strings.ToLower(user.Email)
			if !strings.Contains(fullNameLower, searchLower) && !strings.Contains(emailLower, searchLower) {
				continue
			}
		}

		if role == "HALAL_MANAGER" {
			isReferred := (user.ReferredByID != nil && *user.ReferredByID == userID) || (user.LeaderID != nil && *user.LeaderID == userID)
			if !isReferred {
				continue
			}
		}

		filteredUsers = append(filteredUsers, user)
	}

	return filteredUsers, nil
}
