### Development
In order to locally develop Hyperlane x Cardano integration, we need to deploy at least the following services:
- Cardano RPC service, from this repository.
- Validator agent, from the TVL [hyperlane-monorepo](https://github.com/tvl-labs/hyperlane-monorepo/tree/cardano)
- Relayer agent (coming soon), from the TVL [hyperlane-monorepo](https://github.com/tvl-labs/hyperlane-monorepo/tree/cardano)

This folder contains the following Helm charts:
- [cardano-rpc](cardano-rpc) — to deploy the Cardano RPC
- [hyperlane-validator](hyperlane-validator) — to deploy the Hyperlane validator

### Images built on GitHub CI
By default, the Docker images built on GitHub CI are used:
- `cardano-rpc` [values.yaml](cardano-rpc%2Fvalues.yaml) see `image:`
- `hyperlane-validator` [values.yaml](hyperlane-validator%2Fvalues.yaml) see `image`

To make the local Kubernetes cluster be able to download the built images, you need to install the GHCR Docker login by running
```shell
./ghcr-login-secret/install.sh
```

### Locally built images
Docker images for the Hyperlane agents and RPC are pushed to the local Docker registry.
Kubernetes can pull the image from that local registry using URL `host.docker.internal:5000/<image>`.

##### Start local Docker registry
```shell
make install-local-docker-registry
```

##### Build and push images
- `cardano-rpc` [build-local-docker-image.sh](..%2Fbuild-local-docker-image.sh)
- `hyperlane-monorepo` [build-docker-image-local.sh](https://github.com/tvl-labs/hyperlane-monorepo/blob/cardano/rust/build-docker-image-local.sh)

##### Install the local persistent volume for checkpoints
```shell
make install-local-checkpoints-storage
```

##### Deploy Cardano RPC
```shell
make install-cardano-rpc
```

##### Deploy Cardano test network Kubernetes Config
```shell
make create-cardano-test-config
```

##### Deploy validator
```shell
make install-validator
```

##### Deploy relayer
```shell
make install-cardano-relayer
```