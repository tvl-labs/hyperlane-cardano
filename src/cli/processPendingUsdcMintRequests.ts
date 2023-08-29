import "dotenv/config";
import { getUsdcRequestUTxOs } from "../offchain/indexer/getUsdcRequestUTxOs";
import { Address } from "../offchain/address";
import { getProgramKhalani, getProgramKhalaniTokens } from "../onchain/programs";
import { getIsmParamsHelios, processInboundMessage } from "../offchain/inbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { createWallet } from "./wallet";
import { type IsmParamsHelios } from '../offchain/inbox/ismParams';
import { type UplcProgram } from '@hyperionbt/helios';
import { type Wallet } from '../offchain/wallet';

interface ScriptParameters {
  ismParamsHelios: IsmParamsHelios,
  programKhalaniTokens: UplcProgram,
  khalaniScriptAddress: Address,
  relayerWallet: Wallet,
}

function getParameters(): ScriptParameters {
  const relayerWallet = createWallet();
  const ismParamsHelios = getIsmParamsHelios();
  const programKhalaniTokens = getProgramKhalaniTokens(ismParamsHelios);
  const programKhalani = getProgramKhalani(ismParamsHelios);
  const khalaniScriptAddress = Address.fromValidatorHash(programKhalani.validatorHash);
  console.log(`Khalani Script Address: ${khalaniScriptAddress.toHex()}`);
  return {
    ismParamsHelios,
    programKhalaniTokens,
    khalaniScriptAddress,
    relayerWallet,
  };
}

export async function processPendingUsdcMintRequests(parameters: ScriptParameters) {
  const { khalaniScriptAddress, ismParamsHelios, relayerWallet } = parameters;
  const utxos = await getUsdcRequestUTxOs(khalaniScriptAddress);
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
  const parameters = getParameters();
  let inProgress = false;
  setInterval(async () => {
    if (inProgress) {
      return;
    }
    inProgress = true;
    console.log("Processing pending USDC mint requests");
    try {
      await processPendingUsdcMintRequests(parameters);
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
