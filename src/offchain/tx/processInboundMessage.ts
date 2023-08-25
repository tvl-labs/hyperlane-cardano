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

export async function processInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  // Burn the ISM token
  const ismMultiSig = getProgramIsmKhalani(ismParams);
  tx.attachScript(ismMultiSig);
  tx.mintTokens(
    ismMultiSig.mintingPolicyHash,
    [
      [
        utxoMessage.value.assets.getTokens(ismMultiSig.mintingPolicyHash)[0][0]
          .bytes,
        BigInt(-1),
      ],
    ],
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
  const scriptKhalani = getProgramKhalani(ismParams);
  tx.attachScript(scriptKhalani);

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

  tx.addSignatures(await wallet.signTx(tx));

  return await wallet.submitTx(tx);
}
