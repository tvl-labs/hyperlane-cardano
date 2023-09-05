import "dotenv/config";
import { createWallet } from "./wallet";
import createOutbox from "../offchain/tx/createOutbox";
import { waitForTxConfirmation } from "../offchain/blockfrost/waitForTxConfirmation";
import { getIsmParamsHelios } from "../offchain/inbox";

export async function deployNewOutbox() {
  const wallet = createWallet();
  const ismParamsHelios = getIsmParamsHelios();
  const { utxoOutbox, outboxAuthToken } = await createOutbox(
    wallet,
    ismParamsHelios
  );
  await waitForTxConfirmation(utxoOutbox.txId);
  console.log(`Created Outbox at tx ${utxoOutbox.txId.hex}`);
  console.log(`Outbox OUTBOX_AUTH_TOKEN ${outboxAuthToken}`);
}

async function main() {
  await deployNewOutbox();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
