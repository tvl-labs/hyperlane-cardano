import { Wallet } from "../offchain/wallet";
import * as helios from "@hyperionbt/helios";

export function createWallet(
  walletAddress: string | undefined = process.env.WALLET_ADDRESS,
  walletPrivateKey: string | undefined = process.env.WALLET_PRIVATE_KEY
): Wallet {
  if (
    typeof walletAddress !== "string" ||
    typeof walletPrivateKey !== "string"
  ) {
    throw new Error("Invalid wallet");
  }
  return new Wallet(
    new helios.Address(walletAddress),
    new helios.PrivateKey(walletPrivateKey)
  );
}
