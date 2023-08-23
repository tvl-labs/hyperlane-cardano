import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { Address } from "../offchain/address";
import { Wallet } from "../offchain/wallet";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { type ValidatorStorageLocation } from "../offchain/validatorStorageLocation";
import announceValidatorStorageLocation from "../offchain/tx/announceValidatorStorageLocation";
import * as fs from "fs";

function createWallet(): Wallet {
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

async function parseValidatorAnnouncementFile(): Promise<ValidatorStorageLocation> {
  const argv = await yargs(hideBin(process.argv)).option("announcement-file", {
    type: "string",
    demandOption: true,
    describe: "Path to the announcement JSON file",
  }).argv;

  const json = JSON.parse(fs.readFileSync(argv.announcementFile, "utf-8"));
  return {
    validator: Address.fromEvmAddress(json.value.validator),
    mailboxAddress: Address.fromHex(json.value.mailbox_address),
    mailboxDomain: parseInt(json.value.mailbox_domain),
    storageLocation: json.value.storage_location,
    signature: json.serialized_signature,
  };
}

async function main() {
  const wallet = createWallet();
  const validatorStorageLocation = await parseValidatorAnnouncementFile();
  console.log(validatorStorageLocation);
  const txId = await announceValidatorStorageLocation(
    wallet,
    validatorStorageLocation
  );
  console.log(`Announced validator storage location at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId);
}

await main();
