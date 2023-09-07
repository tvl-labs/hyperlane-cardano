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
  utxoMessage: helios.TxInput,
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

  if (utxoMessage.origOutput.datum?.data == null) {
    throw new Error("Missing datum");
  }
  const message = deserializeMessage(
    JSON.parse(utxoMessage.origOutput.datum.data.toSchemaJson()).list
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
  utxoMessage: helios.TxInput,
  wallet: Wallet
): Promise<bigint> {
  const tx = await buildTxProcessInboundMessage(ismParams, utxoMessage, wallet);
  return wallet.calcTxFee(tx);
}

export async function processInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.TxInput,
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = await buildTxProcessInboundMessage(ismParams, utxoMessage, wallet);

  tx.addSignatures(await wallet.signTx(tx));

  return await wallet.submitTx(tx);
}
