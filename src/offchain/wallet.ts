import * as helios from "@hyperionbt/helios";
import { blockfrost } from "./blockfrost/blockfrost";

export class Wallet {
  readonly address: helios.Address;
  // To fit 32 bytes on EVM, while still act as
  // identiy for signature.
  readonly addressPubKeyOnly: helios.Address;
  readonly privateKey?: helios.PrivateKey;
  readonly emulatedWallet?: helios.Wallet;

  constructor(
    address: helios.Address,
    privateKey?: helios.PrivateKey,
    emulatedWallet?: helios.Wallet
  ) {
    if (address.pubKeyHash == null) {
      throw new Error("Unsupported wallet");
    }
    this.address = address;
    this.addressPubKeyOnly = helios.Address.fromHashes(address.pubKeyHash);
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

  async getUtxos(): Promise<helios.TxInput[]> {
    return await (this.emulatedWallet != null
      ? this.emulatedWallet.utxos
      : blockfrost.getUtxos(this.address));
  }

  calcTxFee(tx: helios.Tx): bigint {
    const inputLovelace = tx.body.inputs.reduce((sum, input) => {
      if (input.address.eq(this.address)) {
        return sum + input.value.lovelace;
      }
      return sum;
    }, 0n);
    const outputLovelace = tx.body.outputs.reduce((sum, output) => {
      if (output.address.eq(this.address)) {
        return sum + output.value.lovelace;
      }
      return sum;
    }, 0n);
    return inputLovelace - outputLovelace;
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
