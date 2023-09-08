# Hyperlane x Cardano
General Message-Passing (GMP) framework for Cardano (UTXO blockchain) on top of [Hyperlane](https://hyperlane.xyz/).

Read more about this project [here](https://gist.github.com/serejke/20b8a3494301577f87840f42c67dac2c)

# USDC bridge
Cardano USDC bridge is implemented on top of Khalani Protocol: `klnUSDC` from the Khalani Chain
is exported to the USDC token residing in Cardano:
- when user bridges tokens from any other chain (Ethereum, Polygon), the corresponding mirror token `USDC.fuji` 
is traded for `klnUSDC`, then `klnUSDC` is locked on Khalani Chain and the same amount of Cardano USDC is minted on Cardano
- when user bridges tokens from Cardano to any other chain, the particular amount of Cardano USDC is burned on Cardano
and the `klnUSDC` is traded to `USDC.fuji` and then exited to the destination chain.

# Technical Design

See [design.md](docs%2Fdesign.md)

# Deployment
[README.md](helm%2FREADME.md)