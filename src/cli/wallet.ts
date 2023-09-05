import { Wallet } from "../offchain/wallet";
import * as helios from "@hyperionbt/helios";
import { requireEnv } from "../offchain/env.utils";

export function createWallet(
  walletAddress: string | undefined = undefined,
  walletPrivateKey: string | undefined = undefined
): Wallet {
  if (walletAddress === undefined) {
    walletAddress = requireEnv(process.env.WALLET_ADDRESS);
  }
  if (walletPrivateKey === undefined) {
    walletPrivateKey = requireEnv(process.env.WALLET_PRIVATE_KEY);
  }
  return new Wallet(
    new helios.Address(walletAddress),
    new helios.PrivateKey(walletPrivateKey)
  );
}
