import { Wallet } from "../offchain/wallet";
import * as helios from "@hyperionbt/helios";
import { H256 } from "../offchain/h256";

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

export function getRecipientAddressAndHash() {
  const recipientAddress = new helios.Address(
    "addr_test1vpcvg34l9ngamtytg3ex5mxgcczgtu78dh3m3uxdk7cf5dg0scvn5"
  );
  const recipientAddressHash = H256.from(
    Buffer.from(
      helios.bytesToHex(helios.Crypto.blake2b(recipientAddress.bytes)),
      "hex"
    )
  );
  return {
    recipientAddress,
    recipientAddressHash,
  };
}
