import { ethers } from "ethers";

async function main() {
  const hdNodeWallet = ethers.Wallet.createRandom();
  console.log(`Address: ${hdNodeWallet.address}`);
  console.log(`Private key: ${hdNodeWallet.privateKey}`);
  console.log(`Public key: ${hdNodeWallet.publicKey}`);
}

await main();
