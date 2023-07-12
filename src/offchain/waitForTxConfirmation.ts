import fetch from "node-fetch";

// TODO: Give up after a certain number of tries
export async function waitForTxConfirmation(txIdHex: string) {
  console.log("Waiting for confirmation...");
  const r = await fetch(
    `${process.env.BLOCKFROST_PREFIX ?? ""}/txs/${txIdHex}`,
    {
      headers: {
        project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
      },
    }
  );
  if (r.status === 404) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await waitForTxConfirmation(txIdHex);
  }

  // Blockfrost needs time to sync even after the previous confirmation...
  await new Promise((resolve) => setTimeout(resolve, 15000));
}
