package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type TrainingUsecase interface {
	GetTrainings(filter map[string]interface{}) ([]domain.Training, error)
	GetTraining(id int64) (*domain.Training, error)
	CreateTraining(training *domain.Training) error
	UpdateTraining(training *domain.Training) error
	UpdateTrainingStatus(id int64, status string, reason string, approverID *uuid.UUID) error
	DeleteTraining(id int64) error

	GetParticipants(trainingID int64) ([]domain.TrainingParticipant, error)
	GetUserTrainings(userID uuid.UUID) ([]domain.TrainingParticipant, error)
	AddParticipant(trainingID int64, targetUserID uuid.UUID, actorUserID uuid.UUID, actorRole string) error
	UpdateParticipantStatus(trainingID int64, userID uuid.UUID, status string) error
	RemoveParticipant(id int64) error
	ResendParticipantSchedule(trainingID int64, userID uuid.UUID) error
	BroadcastTrainingSchedule(trainingID int64) (int, error)

	// GetAvailableParticipants returns users eligible to be added as training participants
	GetAvailableParticipants(search string, userID uuid.UUID, role string, trainingID int64) ([]domain.User, error)
}

type TrainingUsecaseDeps struct {
	TrainingRepo    domain.TrainingRepository
	ParticipantRepo domain.TrainingParticipantRepository
	UserRepo        domain.UserRepository
	PromotionRepo   domain.PromotionRepository
	CommissionRepo  domain.CommissionRepository
	RoleRepo        domain.RoleRepository
	NotifUC         NotificationUsecase
}

type trainingUsecase struct {
	TrainingUsecaseDeps
}

func NewTrainingUsecase(deps TrainingUsecaseDeps) TrainingUsecase {
	return &trainingUsecase{
		TrainingUsecaseDeps: deps,
	}
}

func (uc *trainingUsecase) sendTrainingNotification(training *domain.Training, user *domain.User, isUpdate bool) {
	if uc.NotifUC == nil || user == nil {
		return
	}

	startDateStr := training.StartDate.Format("02 Jan 2006")
	endDateStr := training.EndDate.Format("02 Jan 2006")
	dateDisplay := startDateStr
	if startDateStr != endDateStr {
		dateDisplay = fmt.Sprintf("%s s/d %s", startDateStr, endDateStr)
	}

	loc := strings.TrimSpace(training.Location)
	if loc == "" {
		loc = "Akan diinformasikan lebih lanjut"
	}

	prefix := "Jadwal Pelatihan"
	if isUpdate {
		prefix = "Pembaruan Jadwal Pelatihan"
	}

	title := fmt.Sprintf("%s: %s", prefix, training.Title)
	msg := fmt.Sprintf(
		"Halo *%s*,\n\nAnda terdaftar pada agenda pelatihan resmi HalalCore:\n📚 *%s*\n📅 Tanggal: *%s*\n📍 Lokasi: *%s*\n\nKeterangan:\n%s\n\nMohon persiapkan diri dan hadir tepat waktu. Informasi materi dan sertifikasi dapat dilihat melalui dashboard HalalCore Anda.\n\nTerima kasih.",
		user.FullName,
		training.Title,
		dateDisplay,
		loc,
		training.Description,
	)

	// 1. In-App Notification (fail-safe)
	_ = uc.NotifUC.CreateNotification(user.ID, title, msg, uuid.Nil)

	// 2. WhatsApp Notification (asynchronous & fail-safe)
	phone := strings.TrimSpace(user.Phone)
	if phone != "" {
		go func(targetPhone, textMsg string) {
			_ = uc.NotifUC.SendWhatsAppNotification(targetPhone, textMsg)
		}(phone, msg)
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
	existing, _ := uc.TrainingRepo.FindByID(training.ID)
	if err := uc.TrainingRepo.Update(training); err != nil {
		return err
	}

	// Jika ada perubahan tanggal atau lokasi pada pelatihan APPROVED, kirim notifikasi pembaruan ke peserta
	if existing != nil && existing.Status == "APPROVED" && training.Status == "APPROVED" {
		dateChanged := !existing.StartDate.Equal(training.StartDate) || !existing.EndDate.Equal(training.EndDate)
		locationChanged := existing.Location != training.Location
		if dateChanged || locationChanged {
			participants, errP := uc.ParticipantRepo.FindByTraining(training.ID)
			if errP == nil {
				for _, p := range participants {
					var u *domain.User
					if p.User.ID != uuid.Nil {
						u = &p.User
					} else {
						u, _ = uc.UserRepo.FindByID(p.UserID)
					}
					if u != nil {
						uc.sendTrainingNotification(training, u, true)
					}
				}
			}
		}
	}
	return nil
}

func (uc *trainingUsecase) UpdateTrainingStatus(id int64, status string, reason string, approverID *uuid.UUID) error {
	if status != "APPROVED" && status != "REJECTED" && status != "PENDING" {
		return errors.New("invalid status")
	}
	if err := uc.TrainingRepo.UpdateStatus(id, status, reason, approverID); err != nil {
		return err
	}

	// Jika status berubah menjadi APPROVED, broadcast jadwal pelatihan ke seluruh peserta yang terdaftar
	if status == "APPROVED" {
		training, err := uc.TrainingRepo.FindByID(id)
		if err == nil && training != nil {
			participants, errP := uc.ParticipantRepo.FindByTraining(id)
			if errP == nil {
				for _, p := range participants {
					var u *domain.User
					if p.User.ID != uuid.Nil {
						u = &p.User
					} else {
						u, _ = uc.UserRepo.FindByID(p.UserID)
					}
					if u != nil {
						uc.sendTrainingNotification(training, u, false)
					}
				}
			}
		}
	}

	return nil
}

func (uc *trainingUsecase) BroadcastTrainingSchedule(trainingID int64) (int, error) {
	training, err := uc.TrainingRepo.FindByID(trainingID)
	if err != nil || training == nil {
		return 0, errors.New("pelatihan tidak ditemukan")
	}
	participants, errP := uc.ParticipantRepo.FindByTraining(trainingID)
	if errP != nil {
		return 0, errP
	}

	sentCount := 0
	for _, p := range participants {
		var u *domain.User
		if p.User.ID != uuid.Nil {
			u = &p.User
		} else {
			u, _ = uc.UserRepo.FindByID(p.UserID)
		}
		if u != nil {
			uc.sendTrainingNotification(training, u, false)
			sentCount++
		}
	}
	return sentCount, nil
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

func (uc *trainingUsecase) ResendParticipantSchedule(trainingID int64, userID uuid.UUID) error {
	training, err := uc.TrainingRepo.FindByID(trainingID)
	if err != nil || training == nil {
		return errors.New("pelatihan tidak ditemukan")
	}
	user, errUser := uc.UserRepo.FindByID(userID)
	if errUser != nil || user == nil {
		return errors.New("peserta tidak ditemukan")
	}
	uc.sendTrainingNotification(training, user, false)
	return nil
}

func (uc *trainingUsecase) AddParticipant(trainingID int64, targetUserID uuid.UUID, actorUserID uuid.UUID, actorRole string) error {
	// Validate training is not expired
	training, err := uc.TrainingRepo.FindByID(trainingID)
	if err != nil {
		return errors.New("pelatihan tidak ditemukan")
	}
	if time.Now().After(training.EndDate) {
		return errors.New("pelatihan sudah kadaluarsa, tidak dapat menambah peserta")
	}

	targetUser, errUser := uc.UserRepo.FindByID(targetUserID)
	if errUser != nil || targetUser == nil {
		return errors.New("peserta tidak ditemukan")
	}

	// Strictly restrict HALAL_MANAGER and HALAL_DIRECTOR: they can ONLY add participants from their own referral/team!
	if actorRole == "HALAL_MANAGER" || actorRole == "HALAL_DIRECTOR" {
		isReferred := (targetUser.ReferredByID != nil && *targetUser.ReferredByID == actorUserID) || (targetUser.LeaderID != nil && *targetUser.LeaderID == actorUserID)
		if !isReferred {
			return errors.New("Anda hanya dapat mendaftarkan peserta yang mendaftar menggunakan kode referral Anda atau anggota tim binaan Anda sendiri")
		}
	}

	p := &domain.TrainingParticipant{
		TrainingID: trainingID,
		UserID:     targetUserID,
		Status:     "PESERTA",
	}
	if err := uc.ParticipantRepo.Create(p); err != nil {
		return err
	}

	// Otomatis kirim jadwal ke peserta jika pelatihan sudah aktif/APPROVED
	if training.Status == "APPROVED" {
		uc.sendTrainingNotification(training, targetUser, false)
	}

	return nil
}

func (uc *trainingUsecase) UpdateParticipantStatus(trainingID int64, userID uuid.UUID, status string) error {
	if status != "PESERTA" && status != "LULUS" && status != "TIDAK_LULUS" {
		return errors.New("status must be PESERTA, LULUS, or TIDAK_LULUS")
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
	}

	return nil
}

func (uc *trainingUsecase) RemoveParticipant(id int64) error {
	return uc.ParticipantRepo.Delete(id)
}

// GetAvailableParticipants returns HALAL_ADVISOR users that can be added as participants.
// Filters only advisors with active IN_TRAINING promotion requests.
// For HALAL_MANAGER and HALAL_DIRECTOR roles, filters only users referred by or in team of that manager/director.
func (uc *trainingUsecase) GetAvailableParticipants(search string, userID uuid.UUID, role string, trainingID int64) ([]domain.User, error) {
	// Find all HALAL_ADVISOR users
	users, _, err := uc.UserRepo.FindAll(map[string]interface{}{
		"role": "HALAL_ADVISOR",
	}, 1, 1000)
	if err != nil {
		return nil, err
	}

	// If trainingID is specified, fetch existing participants in this training to exclude them
	existingMap := make(map[uuid.UUID]bool)
	if trainingID != 0 {
		participants, errP := uc.ParticipantRepo.FindByTraining(trainingID)
		if errP == nil {
			for _, p := range participants {
				existingMap[p.UserID] = true
			}
		}
	}

	var filteredUsers []domain.User
	for _, user := range users {
		// Filter out users who are already participants in this training batch
		if existingMap[user.ID] {
			continue
		}

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

		if role == "HALAL_MANAGER" || role == "HALAL_DIRECTOR" {
			isReferred := (user.ReferredByID != nil && *user.ReferredByID == userID) || (user.LeaderID != nil && *user.LeaderID == userID)
			if !isReferred {
				continue
			}
		}

		filteredUsers = append(filteredUsers, user)
	}

	return filteredUsers, nil
}
