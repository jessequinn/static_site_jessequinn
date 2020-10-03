.PHONY: build_all push_all

TAG    							:= $$(git rev-parse --short HEAD)

APP_NAME   					:= jessequinn
APP_IMG      				:= ${APP_NAME}:${TAG}
LATEST_APP					:= ${APP_NAME}:latest

NODE_VERSION				:= 14
APP_PORT						:= 3000

build_all: build-app
push_all: push-app

.PHONY: build-app
build-app:
	@docker build --target prod --build-arg VERSION=${NODE_VERSION} --build-arg PORT=${APP_PORT} -f Dockerfile -t ${APP_IMG} .
	@docker tag ${APP_IMG} ${LATEST_APP}
	@docker tag ${LATEST_APP} damasu/${LATEST_APP}
	@docker tag ${APP_IMG} damasu/${APP_IMG}

.PHONY: push-app
push-app:
	@docker push damasu/${LATEST_APP}
	@docker push damasu/${APP_IMG}

.PHONY: login
login:
	@docker login -u damasu
