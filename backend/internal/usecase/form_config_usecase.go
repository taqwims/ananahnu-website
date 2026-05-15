package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type FormConfigUsecase interface {
	// Config CRUD (admin)
	GetFormConfig(formType string, businessTypeID *int64) ([]domain.FormFieldConfig, error)
	CreateField(config *domain.FormFieldConfig) error
	UpdateField(config *domain.FormFieldConfig) error
	DeleteField(id int64) error

	// Field values (submission data)
	SubmitFieldValues(submissionID uuid.UUID, uploaderID uuid.UUID, values []FieldValueInput) error
	GetFieldValues(submissionID uuid.UUID) ([]domain.FormFieldValue, error)
}

// FieldValueInput is the input struct for submitting field values.
type FieldValueInput struct {
	FormFieldID int64  `json:"form_field_id"`
	TextValue   string `json:"text_value,omitempty"`
	FileURL     string `json:"file_url,omitempty"`
	LinkValue   string `json:"link_value,omitempty"`
}

type FormConfigUsecaseDeps struct {
	ConfigRepo domain.FormConfigRepository
	ValueRepo  domain.FormFieldValueRepository
}

type formConfigUsecase struct {
	FormConfigUsecaseDeps
}

func NewFormConfigUsecase(deps FormConfigUsecaseDeps) FormConfigUsecase {
	return &formConfigUsecase{
		FormConfigUsecaseDeps: deps,
	}
}

func (uc *formConfigUsecase) GetFormConfig(formType string, businessTypeID *int64) ([]domain.FormFieldConfig, error) {
	configs, err := uc.ConfigRepo.FindByFormTypeAndBusinessType(formType, businessTypeID)
	if err == nil && len(configs) > 0 {
		return configs, nil
	}

	// Fallback for SELF_DECLARE_MANDIRI to use regular SELF_DECLARE form
	if formType == "SELF_DECLARE_MANDIRI" {
		return uc.ConfigRepo.FindByFormTypeAndBusinessType("SELF_DECLARE", businessTypeID)
	}

	return configs, err
}

func (uc *formConfigUsecase) CreateField(config *domain.FormFieldConfig) error {
	if config.FormType == "" || config.FieldKey == "" || config.InputType == "" {
		return errors.New("form_type, field_key, and input_type are required")
	}
	if config.InputType != "FILE_UPLOAD" && config.InputType != "LINK" && config.InputType != "TEXT" {
		return errors.New("input_type must be FILE_UPLOAD, LINK, or TEXT")
	}
	return uc.ConfigRepo.Create(config)
}

func (uc *formConfigUsecase) UpdateField(config *domain.FormFieldConfig) error {
	existing, err := uc.ConfigRepo.FindByID(config.ID)
	if err != nil {
		return fmt.Errorf("field not found: %w", err)
	}

	existing.FieldKey = config.FieldKey
	existing.FieldLabel = config.FieldLabel
	existing.InputType = config.InputType
	existing.IsRequired = config.IsRequired
	existing.SortOrder = config.SortOrder
	existing.Description = config.Description
	existing.BusinessTypeID = config.BusinessTypeID

	return uc.ConfigRepo.Update(existing)
}

func (uc *formConfigUsecase) DeleteField(id int64) error {
	return uc.ConfigRepo.Delete(id)
}

// SubmitFieldValues validates and saves field values for a submission.
// It replaces any existing values (delete + re-create).
func (uc *formConfigUsecase) SubmitFieldValues(submissionID uuid.UUID, uploaderID uuid.UUID, inputs []FieldValueInput) error {
	// Build lookup of submitted values by field ID
	submittedMap := make(map[int64]FieldValueInput)
	for _, input := range inputs {
		submittedMap[input.FormFieldID] = input
	}

	// Validate required fields — we need to know the form type from any field
	if len(inputs) > 0 {
		firstField, err := uc.ConfigRepo.FindByID(inputs[0].FormFieldID)
		if err != nil {
			return fmt.Errorf("invalid form_field_id: %w", err)
		}

		configs, err := uc.ConfigRepo.FindByFormType(firstField.FormType)
		if err != nil {
			return err
		}

		for _, cfg := range configs {
			if cfg.IsRequired {
				input, ok := submittedMap[cfg.ID]
				if !ok {
					return fmt.Errorf("field '%s' is required", cfg.FieldLabel)
				}
				// Check that the value is non-empty based on input type
				switch cfg.InputType {
				case "FILE_UPLOAD":
					if input.FileURL == "" {
						return fmt.Errorf("file upload for '%s' is required", cfg.FieldLabel)
					}
				case "LINK":
					if input.LinkValue == "" {
						return fmt.Errorf("link for '%s' is required", cfg.FieldLabel)
					}
				case "TEXT":
					if input.TextValue == "" {
						return fmt.Errorf("text value for '%s' is required", cfg.FieldLabel)
					}
				}
			}
		}
	}

	// Delete existing values and re-create
	if err := uc.ValueRepo.DeleteBySubmissionID(submissionID); err != nil {
		return fmt.Errorf("failed to clear existing values: %w", err)
	}

	var values []domain.FormFieldValue
	for _, input := range inputs {
		values = append(values, domain.FormFieldValue{
			SubmissionID: submissionID,
			FormFieldID:  input.FormFieldID,
			TextValue:    input.TextValue,
			FileURL:      input.FileURL,
			LinkValue:    input.LinkValue,
			UploadedBy:   uploaderID,
		})
	}

	return uc.ValueRepo.CreateBulk(values)
}

func (uc *formConfigUsecase) GetFieldValues(submissionID uuid.UUID) ([]domain.FormFieldValue, error) {
	return uc.ValueRepo.FindBySubmissionID(submissionID)
}
