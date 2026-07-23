package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type FormConfigUsecase interface {
	// Config CRUD (admin)
	GetFormConfig(formType string, businessTypeID *int64, productCategoryID *int64, showAll bool) ([]domain.FormFieldConfig, error)
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
	ConfigRepo     domain.FormConfigRepository
	ValueRepo      domain.FormFieldValueRepository
	SubmissionRepo domain.SubmissionRepository
}

type formConfigUsecase struct {
	FormConfigUsecaseDeps
}

func NewFormConfigUsecase(deps FormConfigUsecaseDeps) FormConfigUsecase {
	return &formConfigUsecase{
		FormConfigUsecaseDeps: deps,
	}
}

func (uc *formConfigUsecase) GetFormConfig(formType string, businessTypeID *int64, productCategoryID *int64, showAll bool) ([]domain.FormFieldConfig, error) {
	configs, err := uc.ConfigRepo.FindByFormTypeAndBusinessType(formType, businessTypeID, productCategoryID, showAll)
	if err == nil && len(configs) > 0 {
		return configs, nil
	}

	// Fallback for SELF_DECLARE_MANDIRI to use regular SELF_DECLARE form
	if formType == "SELF_DECLARE_MANDIRI" {
		return uc.ConfigRepo.FindByFormTypeAndBusinessType("SELF_DECLARE", businessTypeID, productCategoryID, showAll)
	}

	return configs, err
}

func (uc *formConfigUsecase) CreateField(config *domain.FormFieldConfig) error {
	if config.FormType == "" || config.FieldKey == "" || config.InputType == "" {
		return errors.New("form_type, field_key, and input_type are required")
	}
	if config.InputType != "FILE_UPLOAD" && config.InputType != "LINK" && config.InputType != "TEXT" && config.InputType != "DATE" && config.InputType != "REPEATER" && config.InputType != "PRODUCT_LIST" && config.InputType != "INGREDIENT_LIST" && config.InputType != "INGREDIENT_MATRIX" && config.InputType != "ACTIVITY_PHOTOS" && config.InputType != "HALAL_TEAM" {
		return errors.New("input_type must be FILE_UPLOAD, LINK, TEXT, DATE, REPEATER, PRODUCT_LIST, INGREDIENT_LIST, INGREDIENT_MATRIX, ACTIVITY_PHOTOS, or HALAL_TEAM")
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
	existing.ProductCategoryID = config.ProductCategoryID

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

	if len(inputs) > 0 {
		_, err := uc.ConfigRepo.FindByID(inputs[0].FormFieldID)
		if err != nil {
			return fmt.Errorf("invalid form_field_id: %w", err)
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
	values, err := uc.ValueRepo.FindBySubmissionID(submissionID)
	if err != nil {
		return nil, err
	}

	if uc.SubmissionRepo == nil {
		return values, nil
	}

	sub, err := uc.SubmissionRepo.FindByID(submissionID)
	if err != nil || sub == nil {
		return values, nil
	}

	var subBtID *int64 = sub.BusinessTypeID
	var subPcID *int64 = sub.ProductCategoryID

	if subBtID == nil && sub.CostDetail != nil {
		subBtID = sub.CostDetail.BusinessTypeID
	}
	if subPcID == nil && sub.CostDetail != nil {
		subPcID = sub.CostDetail.ProductCategoryID
	}

	var scopedValues []domain.FormFieldValue
	for _, fv := range values {
		cfg := fv.FormField
		if cfg.ID == 0 {
			scopedValues = append(scopedValues, fv)
			continue
		}

		if cfg.BusinessTypeID != nil && *cfg.BusinessTypeID > 0 {
			if subBtID == nil || *cfg.BusinessTypeID != *subBtID {
				continue
			}
		}
		if cfg.ProductCategoryID != nil && *cfg.ProductCategoryID > 0 {
			if subPcID == nil || *cfg.ProductCategoryID != *subPcID {
				continue
			}
		}
		scopedValues = append(scopedValues, fv)
	}

	return scopedValues, nil
}
