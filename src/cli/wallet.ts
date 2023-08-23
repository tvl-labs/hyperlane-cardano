import { Wallet } from '../offchain/wallet';
import * as helios from '@hyperionbt/helios';

export function createWallet(): Wallet {
  if (
    typeof process.env.WALLET_ADDRESS !== "string" ||
    typeof process.env.WALLET_PRIVATE_KEY !== "string"
  ) {
    throw new Error("Invalid wallet");
  }
  return new Wallet(
    new helios.Address(process.env.WALLET_ADDRESS),
    new helios.PrivateKey(process.env.WALLET_PRIVATE_KEY)
  );
}
