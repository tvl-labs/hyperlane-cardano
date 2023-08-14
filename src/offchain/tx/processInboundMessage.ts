import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "../../onchain/mpKhalaniTokens.hl";
import ScriptKhalani from "../../onchain/scriptKhalani.hl";
import { deserializeMessage } from "../message";
import { type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { parseMessagePayloadMint } from "../messagePayload";

export async function processInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);
  tx.addInput(utxoMessage, new helios.ConstrData(0, []));
  const scriptKhalani = new ScriptKhalani().compile(true);
  tx.attachScript(scriptKhalani);

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
  const mpKhalaniTokens = new MintingPolicyKhalaniTokens({
    ISM_KHALANI: ismMultiSig.mintingPolicyHash,
  }).compile(true);
  tx.attachScript(mpKhalaniTokens);
  const payloadMint = parseMessagePayloadMint(message.body);
  const mintKhalaniTokens: [number[], number][] = payloadMint.tokens.map(
    (token) => {
      const tokenName = token[0].substring(2);
      if (
        tokenName.substring(0, 56) !== mpKhalaniTokens.mintingPolicyHash.hex
      ) {
        throw new Error("Mismatched minting policy");
      }
      return [helios.hexToBytes(tokenName.substring(56)), token[1]];
    }
  );
  tx.mintTokens(
    mpKhalaniTokens.mintingPolicyHash,
    mintKhalaniTokens,
    new helios.ConstrData(0, [])
  );

  tx.addOutput(
    new helios.TxOutput(
      payloadMint.target,
      new helios.Value(
        BigInt(0),
        new helios.Assets([
          [mpKhalaniTokens.mintingPolicyHash, mintKhalaniTokens],
        ])
      )
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));

  return await wallet.submitTx(tx);
}
