import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptKhalani from "../../onchain/scriptKhalani.hl";
import { deserializeMessage } from "../message";
import { type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { parseMessagePayloadMint } from "../messagePayload";
import { getProgramKhalaniTokens } from "../../onchain/programs";

export async function processInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  hashMap: Record<string, string>, // better type here?
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  // Burn the ISM token
  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
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
    (token) => [helios.hexToBytes(token[0].substring(2)), token[1]]
  );
  tx.mintTokens(
    programKhalaniTokens.mintingPolicyHash,
    mintKhalaniTokens,
    new helios.MapData(
      Object.entries(hashMap).map(([k, v]) => [
        new helios.ByteArray(k)._toUplcData(),
        new helios.ByteArray(v)._toUplcData(),
      ])
    )
  );
  tx.addInput(utxoMessage, new helios.ConstrData(0, []));
  const scriptKhalani = new ScriptKhalani({
    MP_KHALANI: programKhalaniTokens.mintingPolicyHash,
  }).compile(true);
  tx.attachScript(scriptKhalani);

  tx.addOutput(
    new helios.TxOutput(
      new helios.Address(
        hashMap[payloadMint.recipientAddressHash.hex().substring(2)]
      ),
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
