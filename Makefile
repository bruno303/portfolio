SHELL := /bin/bash

.PHONY: init web api build check lint test helm-lint cv-pdf compose-up compose-down

## install dependencies
init:
	cd web && npm install
	cd api && go mod download

## run the web app on http://localhost:3000
web:
	cd web && npm run dev

## run the api on http://localhost:8080
api:
	cd api && go run ./cmd/api

## build both components
build:
	cd web && npm run build
	cd api && go build -o bin/api ./cmd/api

## typecheck and run unit tests
check:
	cd web && npm run typecheck && npm test
	cd api && go vet ./... && go test ./...

lint:
	cd web && npm run lint
	cd api && golangci-lint run

helm-lint:
	helm lint helm/portfolio

## regenerate the CV PDF (needs the web dev server and a local Chromium)
cv-pdf:
	cd web && npm run cv:pdf

compose-up:
	docker compose up --build

compose-down:
	docker compose down -v
