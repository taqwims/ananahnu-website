package usecase

import (
	"ananahnu/internal/domain"
	
	"github.com/google/uuid"
)

type ClientUsecase interface {
	GetClients(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error)
	GetClient(id uuid.UUID) (*domain.Client, error)
	CreateClient(client *domain.Client) error
	UpdateClient(client *domain.Client) error
}

type clientUsecase struct {
	clientRepo domain.ClientRepository
}

func NewClientUsecase(r domain.ClientRepository) ClientUsecase {
	return &clientUsecase{clientRepo: r}
}

func (uc *clientUsecase) GetClients(filter map[string]interface{}, page, limit int) ([]domain.Client, int64, error) {
	return uc.clientRepo.FindAll(filter, page, limit)
}

func (uc *clientUsecase) GetClient(id uuid.UUID) (*domain.Client, error) {
	return uc.clientRepo.FindByID(id)
}

func (uc *clientUsecase) CreateClient(client *domain.Client) error {
	// Check if NIB already exists
	existing, _ := uc.clientRepo.FindByNIB(client.NIB)
	if existing != nil {
		return domain.ErrNIBExists
	}

	client.ID = uuid.New()
	return uc.clientRepo.Create(client)
}

func (uc *clientUsecase) UpdateClient(client *domain.Client) error {
	return uc.clientRepo.Update(client)
}
