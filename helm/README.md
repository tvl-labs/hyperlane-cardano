### Deployment
Hyperlane x Cardano integration consists of the following services:
- [Cardano RPC](cardano-rpc)
  - Indexing of the Cardano  Outbox
  - Querying UTXO, building transactions
  - Processing Cardano USDC minting requests
- [Hyperlane Validator](hyperlane-validator)
  - Validators of the `Cardano -> Khalani Chain` messages
  - Validators of the `Khalani Chain -> Cardano` messages
- [Hyperlane Relayer](hyperlane-relayer)
  - Relayer of the `Cardano -> Khalani Chain` messages
  - Relayer of the `Khalani Chain -> Cardano` messages

![agents.png](..%2Fdocs%2Fagents.png)

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
Checkpoints are saved at `$HOME/.local-hyperlane-checkpoints/<validator address>/`

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

##### (Cardano -> EVM) Deploy Cardano validators
```shell
make install-cardano-validators
```

##### (Cardano -> EVM) Deploy Cardano -> EVM relayer
```shell
make install-cardano-relayer
```

##### (EVM -> Cardano) Deploy 3 EVM validators
```shell
make install-evm-validators
```

##### (EVM -> Cardano) Announce storage locations of the 3 validators
> Note: this step is one-time per validator, and can be skipped if the validator has already been announced.

Validator saves `announcement.json` file at `$HOME/.local-hyperlane-checkpoints/<validator>/announcement.json`.

That file contains a signed storage announcement that needs to be submitted to [`ValidatorAnnounce`](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/63558af85d9cf35b4f1a14c6243aca590f77fb07/solidity/contracts/ValidatorAnnounce.sol#L68) on-chain contract.

- Check out [hyperlane-deploy](https://github.com/tvl-labs/hyperlane-deploy/tree/cardano) `cardano` branch.
- Update the file at `<hyperlane-deploy>/config/announcement.json`
- Run `announce-validator.sh` script

##### (EVM -> Cardano) Deploy EVM -> Cardano relayer
```shell
make install-evm-relayer
```

### Bridge some USDC tokens from Arbitrum Fuji to Cardano
Checkout `cardano` branch of the `khalani-sdk` and run the test [cardano.bridge.e2e.test](https://github.com/tvl-labs/khalani-sdk/blob/cardano/src/e2e/cardano.bridge.e2e.test.ts).

After several minutes, this [address](https://preprod.cexplorer.io/address/addr_test1vpcvg34l9ngamtytg3ex5mxgcczgtu78dh3m3uxdk7cf5dg0scvn5) on Cardano preprod network will receive the test USDC tokens.

### Bridge Cardano USDC from Cardano to Fuji
Execute the following test script sending 2 USDC tokens from Cardano to this [address](https://testnet.snowtrace.io/address/0x2064dfa3a7dc4F6Bb6523B56Fa6C46611799058A) on Fuji. 
```shell
yarn sendCardanoToKhalaniUsdcMessage
```

### Demo
See the [demo](https://drive.google.com/file/d/1yC4fffr4d75NoN6YyrpU7SxcETPxLv4J/view?usp=drive_link)