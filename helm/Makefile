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
	helm -n applications install cardano-rpc ./cardano-rpc --values ./cardano-rpc-values.yaml

upgrade-cardano-rpc:
	helm -n applications upgrade cardano-rpc ./cardano-rpc --values ./cardano-rpc-values.yaml

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
	kubectl -n applications apply -f local-checkpoints-storage/local-checkpoints-pvc.yaml

uninstall-local-checkpoints-storage:
	kubectl delete pvc local-checkpoints-pvc -n applications
	kubectl delete -f local-checkpoints-storage/local-checkpoints-pv.yaml
	kubectl delete -f local-checkpoints-storage/storage-class.yaml

# Hyperlane Validator for messages dispatched from Cardano
install-validator:
	helm -n applications install cardano-validator ./hyperlane-validator --values ./cardano-validator-values.yaml

upgrade-validator:
	helm -n applications upgrade cardano-validator ./hyperlane-validator --values ./cardano-validator-values.yaml

uninstall-validator:
	helm -n applications uninstall cardano-validator

# Hyperlane Relayer for messages dispatched from Cardano
install-cardano-relayer:
	helm -n applications install cardano-relayer ./hyperlane-relayer --values ./cardano-relayer-values.yaml

upgrade-cardano-relayer:
	helm -n applications upgrade cardano-relayer ./hyperlane-relayer --values ./cardano-relayer-values.yaml

uninstall-cardano-relayer:
	helm -n applications uninstall cardano-relayer

# Hyperlane Validators for messages dispatched from EVM to Cardano
install-evm-validators:
	helm -n applications install evm-validator-1 ./hyperlane-validator --values ./evm-validator-values-1.yaml
	helm -n applications install evm-validator-2 ./hyperlane-validator --values ./evm-validator-values-2.yaml
	helm -n applications install evm-validator-3 ./hyperlane-validator --values ./evm-validator-values-3.yaml

upgrade-evm-validators:
	helm -n applications upgrade evm-validator-1 ./hyperlane-validator --values ./evm-validator-values-1.yaml
	helm -n applications upgrade evm-validator-2 ./hyperlane-validator --values ./evm-validator-values-2.yaml
	helm -n applications upgrade evm-validator-3 ./hyperlane-validator --values ./evm-validator-values-3.yaml

uninstall-evm-validators:
	helm -n applications uninstall evm-validator-1
	helm -n applications uninstall evm-validator-2
	helm -n applications uninstall evm-validator-3

# Hyperlane Relayer for messages dispatched from EVM to Cardano, which uses Cardano RPC library to build transactions.
install-evm-relayer:
	helm -n applications install evm-relayer ./hyperlane-relayer --values ./evm-relayer-values.yaml

upgrade-evm-relayer:
	helm -n applications upgrade evm-relayer ./hyperlane-relayer --values ./evm-relayer-values.yaml

uninstall-evm-relayer:
	helm -n applications uninstall evm-relayer