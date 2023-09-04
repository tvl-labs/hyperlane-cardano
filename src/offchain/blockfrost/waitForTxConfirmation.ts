import type * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";

const NO_CONFIRMATIONS = 3;

// TODO: Give up after a certain number of tries
export async function waitForTxConfirmation(txId: helios.TxId) {
  console.log("Waiting for confirmation...");
  const blockfrostPrefix = process.env.BLOCKFROST_PREFIX ?? "";
  const projectId = process.env.BLOCKFROST_PROJECT_ID ?? "";
  const block: any = await fetch(`${blockfrostPrefix}/blocks/latest`, {
    headers: {
      project_id: projectId,
    },
  }).then(async (r) => await r.json());
  const r = await fetch(`${blockfrostPrefix}/txs/${txId.hex}`, {
    headers: {
      project_id: projectId,
    },
  });
  if (r.status === 200) {
    const tx: any = await r.json();
    if (block.height - tx.block_height >= NO_CONFIRMATIONS) {
      return;
    }
  }

  // Blockfrost needs time to sync even after the previous confirmation...
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await waitForTxConfirmation(txId);
}