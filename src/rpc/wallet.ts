import * as helios from "@hyperionbt/helios";
import { Address } from "../offchain/address";

export function getAddressOfWallet(_wallet: helios.Wallet): Address {
  // TODO: sender address must be derived from the wallet (param).
  return Address.fromHex(
    "0x0000000000000000000000000000000000000000000000000000000000000CA1"
  );
}
