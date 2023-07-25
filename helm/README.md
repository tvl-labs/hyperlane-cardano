### Production images (built on GitHub CI)
##### Install the GHCR login secrets to grant the Docker daemon access to pull images from GitHub
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

### Deployment
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