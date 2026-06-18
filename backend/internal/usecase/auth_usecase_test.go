package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"testing"

	"github.com/google/uuid"
)

type mockUserRepository struct {
	existingCodes map[string]bool
}

func (m *mockUserRepository) FindByReferralCode(code string) (*domain.User, error) {
	if _, exists := m.existingCodes[code]; exists {
		return &domain.User{ReferralCode: code}, nil
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepository) Create(user *domain.User) error { return nil }
func (m *mockUserRepository) FindByEmail(email string) (*domain.User, error) { return nil, nil }
func (m *mockUserRepository) FindByID(id uuid.UUID) (*domain.User, error) { return nil, nil }
func (m *mockUserRepository) FindByReferredByID(id uuid.UUID) ([]domain.User, error) { return nil, nil }
func (m *mockUserRepository) GetAllReferralAnalytics() ([]map[string]interface{}, error) { return nil, nil }
func (m *mockUserRepository) FindByLeaderID(leaderID uuid.UUID) ([]domain.User, error) { return nil, nil }
func (m *mockUserRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.User, int64, error) { return nil, 0, nil }
func (m *mockUserRepository) Update(user *domain.User) error { return nil }
func (m *mockUserRepository) Delete(id uuid.UUID) error { return nil }

func TestGenerateReferralCode(t *testing.T) {
	tests := []struct {
		name          string
		fullName      string
		existingCodes []string
		expectedCode  string
	}{
		{
			name:         "Standard name: John Doe",
			fullName:     "John Doe",
			expectedCode: "JHND",
		},
		{
			name:         "Standard name: Dewi Advisor",
			fullName:     "Dewi Advisor",
			expectedCode: "DWDVSR",
		},
		{
			name:         "Standard name: Siti Aminah",
			fullName:     "Siti Aminah",
			expectedCode: "STMNH",
		},
		{
			name:         "Single name: Budi",
			fullName:     "Budi",
			expectedCode: "BD",
		},
		{
			name:         "All vowels name",
			fullName:     "Aiuo",
			expectedCode: "RF",
		},
		{
			name:          "Duplicate code once",
			fullName:      "John Doe",
			existingCodes: []string{"JHND"},
			expectedCode:  "JHND2",
		},
		{
			name:          "Duplicate code multiple times",
			fullName:      "John Doe",
			existingCodes: []string{"JHND", "JHND2", "JHND3"},
			expectedCode:  "JHND4",
		},
		{
			name:          "Duplicate all-vowels name",
			fullName:      "Aiuo",
			existingCodes: []string{"RF"},
			expectedCode:  "RF2",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := &mockUserRepository{
				existingCodes: make(map[string]bool),
			}
			for _, code := range tt.existingCodes {
				mockRepo.existingCodes[code] = true
			}

			uc := &authUsecase{
				AuthUsecaseDeps: AuthUsecaseDeps{
					UserRepo: mockRepo,
				},
			}

			result := uc.generateReferralCode(tt.fullName, uuid.Nil)
			if result != tt.expectedCode {
				t.Errorf("generateReferralCode(%q) = %q; want %q", tt.fullName, result, tt.expectedCode)
			}
		})
	}
}
