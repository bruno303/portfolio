.PHONY: run build test lint fmt tidy docker-build

## run the api locally (http://localhost:8080)
run:
	go run ./cmd/api

build:
	CGO_ENABLED=0 go build -trimpath -o bin/api ./cmd/api

test:
	go test ./... -race -count=1

lint:
	golangci-lint run

fmt:
	golangci-lint fmt

tidy:
	go mod tidy

docker-build:
	docker build -t portfolio-api:local .
