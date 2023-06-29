import * as helios from "@hyperionbt/helios";

export const TOKEN_NAME_AUTH = helios.textToBytes("auth");

export const BLOCKFROST_PREFIX = "https://cardano-preview.blockfrost.io/api/v0";

export type WalletInfo = {
  baseAddress: helios.Address;
  utxos: helios.UTxO[];
};

export async function getWalletInfo(
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<WalletInfo> {
  let baseAddress = (await relayerWallet.usedAddresses)[0];
  if (!baseAddress) baseAddress = (await relayerWallet.unusedAddresses)[0];

  const utxos = await (blockfrost
    ? blockfrost.getUtxos(baseAddress)
    : relayerWallet.utxos);

  return {
    baseAddress,
    utxos,
  };
}
