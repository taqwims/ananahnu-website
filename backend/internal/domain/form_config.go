package domain

import (
	"time"

	"github.com/google/uuid"
)

// FormFieldConfig defines an admin-configurable field for a specific form type.
// Admin can set the input type (FILE_UPLOAD, LINK, TEXT) and whether it's required.
type FormFieldConfig struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	FormType    string    `gorm:"index;not null" json:"form_type"`    // SELF_DECLARE, REGULER, RECRUITMENT
	FieldKey    string    `gorm:"not null" json:"field_key"`          // nib, ktp, foto_produk, etc.
	FieldLabel  string    `json:"field_label"`                        // Display label
	InputType   string    `json:"input_type"`                         // FILE_UPLOAD, LINK, TEXT
	IsRequired  bool      `json:"is_required"`
	SortOrder   int       `json:"sort_order"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// FormFieldValue stores the user-submitted data for a specific form field on a submission.
type FormFieldValue struct {
	ID           int64           `gorm:"primaryKey" json:"id"`
	SubmissionID uuid.UUID       `gorm:"type:uuid;index" json:"submission_id"`
	FormFieldID  int64           `json:"form_field_id"`
	FormField    FormFieldConfig `gorm:"foreignKey:FormFieldID" json:"form_field"`
	TextValue    string          `json:"text_value,omitempty"`
	FileURL      string          `json:"file_url,omitempty"`
	LinkValue    string          `json:"link_value,omitempty"`
	UploadedBy   uuid.UUID       `gorm:"type:uuid" json:"uploaded_by"`
	CreatedAt    time.Time       `json:"created_at"`
}

type FormConfigRepository interface {
	FindByFormType(formType string) ([]FormFieldConfig, error)
	FindByID(id int64) (*FormFieldConfig, error)
	Create(config *FormFieldConfig) error
	Update(config *FormFieldConfig) error
	Delete(id int64) error
}

type FormFieldValueRepository interface {
	FindBySubmissionID(submissionID uuid.UUID) ([]FormFieldValue, error)
	Create(value *FormFieldValue) error
	CreateBulk(values []FormFieldValue) error
	DeleteBySubmissionID(submissionID uuid.UUID) error
}
