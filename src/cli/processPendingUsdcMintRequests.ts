import "dotenv/config";
import { getUsdcRequestUTxOs } from "../offchain/indexer/getUsdcRequestUTxOs";
import { Address } from "../offchain/address";
import * as helios from "@hyperionbt/helios";
import ScriptKhalani from "../onchain/scriptKhalani.hl";
import { getProgramKhalaniTokens } from "../onchain/programs";
import { getIsmParamsHelios, processInboundMessage } from "../offchain/inbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { createWallet } from "./wallet";

function getParameters() {
  const relayerWallet = createWallet();
  const ismParamsHelios = getIsmParamsHelios();
  const programKhalaniTokens = getProgramKhalaniTokens(ismParamsHelios);
  const scriptKhalaniAddress = Address.fromHex(
    `0x000000${helios.Address.fromValidatorHash(
      new ScriptKhalani({
        MP_KHALANI: programKhalaniTokens.mintingPolicyHash,
      }).compile(true).validatorHash
    ).toHex()}`
  );
  return {
    ismParamsHelios,
    programKhalaniTokens,
    scriptKhalaniAddress,
    relayerWallet,
  };
}

export async function processPendingUsdcMintRequests() {
  const { ismParamsHelios, scriptKhalaniAddress, relayerWallet } =
    getParameters();
  const utxos = await getUsdcRequestUTxOs(
    scriptKhalaniAddress.toValidatorHash()
  );
  if (utxos.length === 0) {
    console.log("No pending USDC mint requests");
    return;
  }

  for (const utxo of utxos) {
    const utxoId = `${utxo.txId.hex}#${utxo.utxoIdx}`;
    try {
      console.log(`Processing ${utxoId}`);
      const txId = await processInboundMessage(
        ismParamsHelios,
        utxo,
        relayerWallet
      );
      await waitForTxConfirmation(txId);
      console.log(`Processed ${utxoId} at tx ${txId.hex}!`);
    } catch (e) {
      console.error(`Failed to process ${utxoId}`, e);
    }
  }
}

async function main() {
  let inProgress = false;
  setInterval(async () => {
    if (inProgress) {
      return;
    }
    inProgress = true;
    console.log("Processing pending USDC mint requests");
    try {
      await processPendingUsdcMintRequests();
    } catch (e) {
      console.error("Failed to process pending USDC mint requests", e);
    } finally {
      inProgress = false;
    }
  }, 5000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
