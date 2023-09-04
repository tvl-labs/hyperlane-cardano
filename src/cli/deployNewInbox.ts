import "dotenv/config";
import createInbox from "../offchain/tx/createInbox";
import { waitForTxConfirmation } from "../offchain/blockfrost/waitForTxConfirmation";
import { createWallet } from "./wallet";

export async function deployNewInbox() {
  const wallet = createWallet();
  const { inboxOutputId, utxoInbox } = await createInbox(wallet);
  await waitForTxConfirmation(utxoInbox.txId);
  console.log(`Created inbox at tx ${utxoInbox.txId.hex}!`);
  console.log(
    `Inbox OUTPUT_ID ${inboxOutputId.txId.hex}#${inboxOutputId.utxoIdx}`
  );
}

async function main() {
  await deployNewInbox();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
