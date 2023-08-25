import type * as helios from "@hyperionbt/helios";
import { blockfrost } from "../offchain/indexer/blockfrost";

export class Wallet {
  readonly address: helios.Address;
  readonly privateKey?: helios.PrivateKey;
  readonly emulatedWallet?: helios.Wallet;

  constructor(
    address: helios.Address,
    privateKey?: helios.PrivateKey,
    emulatedWallet?: helios.Wallet
  ) {
    this.address = address;
    this.privateKey = privateKey;
    this.emulatedWallet = emulatedWallet;
  }

  static fromEmulatedWallet(emulatedWallet: helios.WalletEmulator): Wallet {
    return new Wallet(
      emulatedWallet.address,
      emulatedWallet.privateKey,
      emulatedWallet
    );
  }

  async getUtxos(): Promise<helios.UTxO[]> {
    return await (this.emulatedWallet != null
      ? this.emulatedWallet.utxos
      : blockfrost.getUtxos(this.address));
  }

  async signTx(tx: helios.Tx): Promise<helios.Signature[]> {
    if (this.emulatedWallet != null) {
      return await this.emulatedWallet.signTx(tx);
    }
    if (this.privateKey == null) {
      throw new Error("No key to sign");
    }
    return [this.privateKey.sign(tx.bodyHash)];
  }

  async submitTx(tx: helios.Tx): Promise<helios.TxId> {
    return await (this.emulatedWallet != null
      ? this.emulatedWallet.submitTx(tx)
      : blockfrost.submitTx(tx));
  }
}
