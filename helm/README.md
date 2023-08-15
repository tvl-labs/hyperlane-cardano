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

#### Update `image:tag` tags
- `cardano-rpc` [values.yaml](cardano-rpc%2Fvalues.yaml)
- `hyperlane-relayer` [values.yaml](hyperlane-relayer%2Fvalues.yaml)
- `hyperlane-validator` [values.yaml](hyperlane-validator%2Fvalues.yaml)

##### Install the local persistent volume for checkpoints
```shell
make install-local-checkpoints-storage
```

##### Deploy Cardano RPC
```shell
make install-cardano-rpc
```

##### Deploy Cardano test network Kubernetes Config
That config is referenced by validators and relayers via `ConfigMap`
```shell
make create-cardano-test-config
```

### Cardano -> EVM

##### Deploy Cardano validator
```shell
make install-validator
```

##### Deploy Cardano -> EVM relayer
```shell
make install-cardano-relayer
```

### EVM -> Cardano
##### Deploy 3 EVM validators
```shell
make install-evm-validators
```

##### Announce storage locations of the 3 validators
> Note: this step is one-time per validator, and can be skipped if the validator has already been announced.

Validator saves `announcement.json` file at `$HOME/.local-hyperlane-checkpoints/<validator>/announcement.json`.

That file contains a signed storage announcement that needs to be submitted to [`ValidatorAnnounce`](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/63558af85d9cf35b4f1a14c6243aca590f77fb07/solidity/contracts/ValidatorAnnounce.sol#L68) on-chain contract.

- Check out [hyperlane-deploy](https://github.com/tvl-labs/hyperlane-deploy/tree/cardano) `cardano` branch.
- Update the file at `<hyperlane-deploy>/config/announcement.json`
- Run `announce-validator.sh` script

##### Deploy EVM -> Cardano relayer
```shell
make install-evm-relayer
```