package repository

import (
	"ananahnu/internal/domain"
	"time"

	"gorm.io/gorm"
)

type expenseRepository struct {
	db *gorm.DB
}

func NewExpenseRepository(db *gorm.DB) domain.ExpenseRepository {
	return &expenseRepository{db: db}
}

func (r *expenseRepository) Create(expense *domain.Expense) error {
	return r.db.Create(expense).Error
}

func (r *expenseRepository) FindAll(filter map[string]interface{}, page, limit int) ([]domain.Expense, int64, error) {
	var expenses []domain.Expense
	var total int64

	query := r.db.Model(&domain.Expense{}).Preload("Submission.Client")

	if month, ok := filter["month"]; ok {
		query = query.Where("EXTRACT(MONTH FROM date) = ?", month)
	}
	if year, ok := filter["year"]; ok {
		query = query.Where("EXTRACT(YEAR FROM date) = ?", year)
	}
	if start, ok := filter["start_date"]; ok {
		if t, ok := start.(time.Time); ok {
			query = query.Where("date >= ?", t)
		}
	}
	if end, ok := filter["end_date"]; ok {
		if t, ok := end.(time.Time); ok {
			query = query.Where("date <= ?", t)
		}
	}
	if cat, ok := filter["category"]; ok {
		query = query.Where("category = ?", cat)
	}
	if isSub, ok := filter["is_submission_linked"]; ok {
		if isSub.(bool) {
			query = query.Where("submission_id IS NOT NULL")
		} else {
			query = query.Where("submission_id IS NULL")
		}
	}

	query.Count(&total)

	if limit > 0 {
		query = query.Offset((page - 1) * limit).Limit(limit)
	}

	err := query.Order("date DESC").Find(&expenses).Error
	return expenses, total, err
}

func (r *expenseRepository) Delete(id int64) error {
	return r.db.Delete(&domain.Expense{}, id).Error
}
