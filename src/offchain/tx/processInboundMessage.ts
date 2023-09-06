import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import { deserializeMessage } from "../message";
import { type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { parseMessagePayloadMint } from "../messagePayload";
import {
  getProgramIsmKhalani,
  getProgramKhalani,
  getProgramKhalaniTokens,
} from "../../onchain/programs";

export async function buildTxProcessInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  wallet: Wallet
): Promise<helios.Tx> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  // Burn the ISM token
  const ismMultiSig = getProgramIsmKhalani(ismParams);
  const tokens = utxoMessage.value.assets.getTokens(
    ismMultiSig.mintingPolicyHash
  );
  if (tokens.length === 0) {
    throw new Error("No ISM auth tokens attached to the UTXO, skipping");
  }
  const tokenName = tokens[0][0].bytes;

  tx.attachScript(ismMultiSig);
  tx.mintTokens(
    ismMultiSig.mintingPolicyHash,
    [[tokenName, BigInt(-1)]],
    new helios.ConstrData(2, [])
  );

  const message = deserializeMessage(
    helios.ListData.fromCbor(utxoMessage.origOutput.datum.data.toCbor())
  );

  // TODO: Specific processing depending on the message
  // Minting new Khalani tokens for now
  const programKhalaniTokens = getProgramKhalaniTokens(ismParams);
  tx.attachScript(programKhalaniTokens);
  const payloadMint = parseMessagePayloadMint(message.body);
  const mintKhalaniTokens: [number[], number][] = payloadMint.tokens.map(
    (token) => [token[0].toCardanoName(), token[1]]
  );
  tx.mintTokens(
    programKhalaniTokens.mintingPolicyHash,
    mintKhalaniTokens,
    new helios.ConstrData(0, [])
  );
  tx.addInput(utxoMessage, new helios.ConstrData(0, []));
  const programKhalani = getProgramKhalani(ismParams);
  tx.attachScript(programKhalani);

  tx.addOutput(
    new helios.TxOutput(
      new helios.Address([...payloadMint.message.toBuffer().values()]),
      new helios.Value(
        BigInt(0),
        new helios.Assets([
          [programKhalaniTokens.mintingPolicyHash, mintKhalaniTokens],
        ])
      )
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);
  return tx;
}

export async function estimateFeeProcessInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  wallet: Wallet
): Promise<bigint> {
  const tx = await buildTxProcessInboundMessage(ismParams, utxoMessage, wallet);
  console.log(wallet.address.toBech32());
  const inputLovelace = tx.body.inputs.reduce((sum, input) => {
    if (input.address === wallet.address) {
      return sum + input.value.lovelace;
    }
    return sum;
  }, 0n);
  const outputLovelace = tx.body.outputs.reduce((sum, output) => {
    if (output.address === wallet.address) {
      return sum + output.value.lovelace;
    }
    return sum;
  }, 0n);
  console.log(inputLovelace, outputLovelace);
  return inputLovelace - outputLovelace;
}

export async function processInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = await buildTxProcessInboundMessage(ismParams, utxoMessage, wallet);

  tx.addSignatures(await wallet.signTx(tx));

  return await wallet.submitTx(tx);
}
