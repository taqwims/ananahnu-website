package repository

import (
	"ananahnu/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type sphRepository struct {
	db *gorm.DB
}

func NewSPHRepository(db *gorm.DB) domain.SPHRepository {
	return &sphRepository{db: db}
}

func (r *sphRepository) Create(sph *domain.SPH) error {
	return r.db.Create(sph).Error
}

func (r *sphRepository) FindByID(id int64) (*domain.SPH, error) {
	var sph domain.SPH
	err := r.db.Preload("Submission.Client").Preload("Submission.CostDetail").First(&sph, id).Error
	return &sph, err
}

func (r *sphRepository) FindBySubmissionID(submissionID uuid.UUID) (*domain.SPH, error) {
	var sph domain.SPH
	err := r.db.Preload("Submission.Client").Where("submission_id = ?", submissionID).First(&sph).Error
	return &sph, err
}

func (r *sphRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.SPH, int64, error) {
	var sphs []domain.SPH
	var total int64

	query := r.db.Model(&domain.SPH{}).Preload("Submission.Client")

	if status, ok := filter["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if month, ok := filter["month"]; ok {
		query = query.Where("month = ?", month)
	}
	if year, ok := filter["year"]; ok {
		query = query.Where("year = ?", year)
	}

	query.Count(&total)

	if limit > 0 {
		query = query.Offset((page - 1) * limit).Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&sphs).Error
	return sphs, total, err
}

func (r *sphRepository) GetNextSequence(month, year int) (int, error) {
	var maxSeq int
	err := r.db.Model(&domain.SPH{}).
		Where("month = ? AND year = ?", month, year).
		Select("COALESCE(MAX(sequence_number), 0)").
		Scan(&maxSeq).Error
	return maxSeq + 1, err
}

func (r *sphRepository) Update(sph *domain.SPH) error {
	return r.db.Save(sph).Error
}

// CompanyTarget repository
type companyTargetRepository struct {
	db *gorm.DB
}

func NewCompanyTargetRepository(db *gorm.DB) domain.CompanyTargetRepository {
	return &companyTargetRepository{db: db}
}

func (r *companyTargetRepository) FindByPeriod(period string) (*domain.CompanyTarget, error) {
	var target domain.CompanyTarget
	err := r.db.Where("period = ?", period).First(&target).Error
	return &target, err
}

func (r *companyTargetRepository) FindAll() ([]domain.CompanyTarget, error) {
	var targets []domain.CompanyTarget
	err := r.db.Order("period DESC").Find(&targets).Error
	return targets, err
}

func (r *companyTargetRepository) Save(target *domain.CompanyTarget) error {
	return r.db.Save(target).Error
}

func (r *companyTargetRepository) Delete(id int64) error {
	return r.db.Delete(&domain.CompanyTarget{}, id).Error
}
