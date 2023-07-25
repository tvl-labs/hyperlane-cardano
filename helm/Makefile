create-namespace-applications:
	kubectl create namespace applications

# Local Docker registry
install-local-docker-registry:
	docker run -d -p 5000:5000 --name=registry registry:2

uninstall-local-docker-registry:
	docker stop registry
	docker rm registry

# Cardano RPC
install-cardano-rpc:
	helm -n applications install cardano-rpc ./cardano-rpc

upgrade-cardano-rpc:
	helm -n applications upgrade cardano-rpc ./cardano-rpc

uninstall-cardano-rpc:
	helm -n applications uninstall cardano-rpc

# Hyperlane Cardano test network configuration
create-cardano-test-config:
	kubectl -n applications create configmap cardano-test-config --from-file=cardano-test-config.json

delete-cardano-test-config:
	kubectl -n applications delete configmap cardano-test-config

# Local checkpoints storage
install-local-checkpoints-storage:
	kubectl apply -f local-checkpoints-storage/storage-class.yaml
	sed "s|HOME_PLACEHOLDER|$(HOME)|g" local-checkpoints-storage/local-checkpoints-pv.yaml | kubectl apply -f -

uninstall-local-checkpoints-storage:
	kubectl delete -f local-checkpoints-storage/local-checkpoints-pv.yaml
	kubectl delete -f local-checkpoints-storage/storage-class.yaml

# Hyperlane Validator for messages dispatched from Cardano
install-validator:
	helm -n applications install cardano-validator ./hyperlane-validator

upgrade-validator:
	helm -n applications upgrade cardano-validator ./hyperlane-validator

uninstall-validator:
	helm -n applications uninstall cardano-validator