import "dotenv/config";
import { createWallet } from "./wallet";
import createOutbox from "../offchain/tx/createOutbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";

export async function deployNewOutbox() {
  const wallet = createWallet();
  const { utxo, outboxAuthToken } = await createOutbox(wallet);
  await waitForTxConfirmation(utxo.txId);
  console.log(`Created Outbox at tx ${utxo.txId.hex}`);
  console.log(`Outbox OUTBOX_AUTH_TOKEN ${outboxAuthToken}`);
}

async function main() {
  await deployNewOutbox();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
