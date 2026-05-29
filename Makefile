.PHONY: run docker-up docker-down migrate-up migrate-down seed

run:
	cd backend && go run cmd/api/main.go

seed:
	cd backend && go run cmd/seed_features/main.go

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

migrate-up:
	@echo "Running migrations up..."
	# commands to run migrations (will use golang-migrate or GORM auto-migrate later)

migrate-down:
	@echo "Running migrations down..."
