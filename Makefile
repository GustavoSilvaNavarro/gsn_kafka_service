#!make
PORT = 8080
SERVICE_NAME = gsn_expenses_tracker
CONTAINER_NAME = $(SERVICE_NAME)
DOCKER_COMPOSE_TAG = $(SERVICE_NAME)_1
TICKET_PREFIX := $(shell git branch --show-current | cut -d '_' -f 1)

KUSTOMIZE_VERSION := $(shell test -e /usr/local/bin/kustomize && /usr/local/bin/kustomize version | cut -f2 -d/ | cut -f1 -d' ')
KUBEVAL_VERSION := $(shell test -e /usr/local/bin/kubeval && /usr/local/bin/kubeval --version | grep Version | cut -f2 -d' ')

.PHONY: prisma-init

# Prisma DB Migration Commands
prisma-init:
	@echo "🔥 Initiating prisma..."
	npx prisma init

prisma-apply-migration:
	npm run migration:up

prisma-migration-down:
	npm run migration:down

prisma-create-migration:
	npx prisma migrate dev --name $(name)

prisma-manual-migration:
	npx prisma migrate dev --create-only --name $(name)

# DB Commands
migrate:
	npm run typeorm -- migration:run -d ./src/adapters/db/typeorm/migrationDataSource.ts

migrate-revert:
	set -a; . ./.env; npm run typeorm -- migration:revert -d ./src/adapters/db/typeorm/migrationDataSource.ts

create-migration:
	set -a; . ./.env; npm run typeorm -- migration:generate -d ./src/adapters/db/typeorm/migrationDataSource.ts \
	./src/adapters/db/typeorm/migrations/$(filename)

# Run Local DB
local-db:
	docker run -d --name timescale_db -p 5432:5432 -e POSTGRES_PASSWORD=password123 -e POSTGRES_USER=postgres \
	-e POSTGRES_DB=data_manager timescale/timescaledb-ha:pg14-latest

test-db:
	docker run -d --name timescale_test_db -p 5432:5432 -e POSTGRES_PASSWORD=password123 -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=test_data_manager timescale/timescaledb-ha:pg14-latest

# Pipeline commands
setup:
	npm install

unit:
	npm run test

uncached-unit:
	npm run-script clear-cache; npm run-script test

integration: down-rm up
	docker compose -f ./docker-compose.yml run integration_tests jest -c jest.integration.config.ts ./ -i --forceExit --detectOpenHandles --no-cache

integration-dev:
	docker compose -f ./docker-compose.dev.yml -f ./docker-compose.inf.yml up --exit-code-from integration_tests integration_tests

scan:
	npx better-npm-audit audit --production --level=high

lint:
	npm run lint

lint-fix:
	npm run lint:fix

check:
	npm run check

format:
	npm run format

generate-swagger:
	npm run swagger:generate -- $(URL)

commitready: format unit integration

prready: scan format uncached-unit integration

check-format: check format

health-check:
	curl --location 'http://localhost:$(PORT)/healthz' --verbose

commit-prefix:
	git commit -m '$(TICKET_PREFIX) $(m)'

# External services
run-external-services:
	docker compose -f ./docker-compose.inf.yml up -d db zookeeper kafka kafka-ui

# Docker commands
build-base:
	@DOCKER_BUILDKIT=1 docker buildx build -f Dockerfile.base -t $(SERVICE_NAME)_base .

# up: build-base
# 	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml build --parallel
# 	docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml up -d --force-recreate --scale integration_tests=0
up: build-base
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml build --parallel
	docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml up -d --force-recreate

up-integration:
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml up --build -d

down:
	docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml down --remove-orphans

down-rm:
	docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml down --remove-orphans --rmi all --volumes

downup: down up

dev-up: build-base
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker-compose.dev.yml -f ./docker-compose.inf.yml build
	docker compose -f ./docker-compose.dev.yml -f ./docker-compose.inf.yml up -d --force-recreate --scale integration_tests=0

dev-down:
	docker compose -f ./docker-compose.dev.yml -f ./docker-compose.inf.yml down --remove-orphans

dev-downup: dev-down dev-up

infra-up:
	docker compose -f ./docker-compose.inf.yml build
	docker compose -f ./docker-compose.inf.yml up -d --force-recreate

infra-down:
	docker compose -f ./docker-compose.inf.yml down --remove-orphans

infra-downup: infra-down infra-up

rebuild:
	docker compose -f ./docker-compose.yml -f ./docker-compose.inf.yml up --build --force-recreate --no-deps $(SERVICE_NAME)

run: rebuild
	docker run  -p $(PORT):$(PORT) --name $(DOCKER_COMPOSE_TAG) -it $(DOCKER_COMPOSE_TAG) /bin/sh

exec-shell:
	docker exec -it $(DOCKER_COMPOSE_TAG) /bin/bash

docker-build:
	docker build -t $(SERVICE_NAME) .

docker-run: docker-build
	docker run  -p $(PORT):$(PORT) --name $(SERVICE_NAME) -it $(SERVICE_NAME)

docker-exec-shell:
	docker exec -it $(SERVICE_NAME) /bin/bash

just-integration:
	docker compose -f ./docker-compose.yml run integration_tests jest -c jest.integration.config.ts ./ --detectOpenHandles --forceExit

docker-kill-all:
	docker kill $(shell docker ps -q)

# Manifest Validators
validate_manifest:
	rm -f .manifest
	kustomize build .deploy/$(TARGET_ENVIRONMENT) >> .manifest
	[ -s .manifest ] || (echo "Manifest is Empty" ; exit 2)
	kubeval .manifest --kubernetes-version 1.18.0 --ignore-missing-schemas
	echo "Manifest Validated"
	rm -rf .manifest

validate_manifest_if_changed:
	if test -n "$(shell git ls-files -m .deploy/)"; \
		then make validate_manifest; \
		else echo deploy/ files unchanged; \
	fi

install_validate_manifest:
ifneq ($(KUSTOMIZE_VERSION), v5.6.0)
	curl -o kustomize.tar.gz --location https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize/v5.6.0/kustomize_v5.6.0_linux_amd64.tar.gz
	tar -xzvf kustomize.tar.gz kustomize
	chmod u+x kustomize
	sudo mv kustomize /usr/local/bin/
	rm kustomize.tar.gz
endif
ifneq ($(KUBEVAL_VERSION), 0.15.0)
	wget -O kubeval-linux-amd64.tar.gz https://github.com/instrumenta/kubeval/releases/latest/download/kubeval-linux-amd64.tar.gz
	tar xf kubeval-linux-amd64.tar.gz kubeval
	chmod u+x kubeval
	sudo mv kubeval /usr/local/bin/
	rm kubeval-linux-amd64.tar.gz
endif
