import "dotenv/config";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { Address } from "../offchain/address";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { type ValidatorStorageLocation } from "../offchain/validatorStorageLocation";
import announceValidatorStorageLocation from "../offchain/tx/announceValidatorStorageLocation";
import * as fs from "fs";
import { createWallet } from "./wallet";

async function parseValidatorAnnouncementFile(): Promise<ValidatorStorageLocation> {
  const argv = await yargs(hideBin(process.argv)).option("announcement-file", {
    type: "string",
    demandOption: true,
    describe: "Path to the announcement JSON file",
  }).argv;

  const json = JSON.parse(fs.readFileSync(argv.announcementFile, "utf-8"));
  console.log('Read announcement file', json);
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
