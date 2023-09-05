// As our script dependencies get complex, programs should be
// paramterized and compiled through this module for consistency
// and code deduplication.

import * as helios from "@hyperionbt/helios";
import ScriptLockForever from "./scriptLockForever.hl";
import ScriptKhalani from "./scriptKhalani.hl";
import ScriptInbox from "./scriptInbox.hl";
import ScriptOutbox from "./scriptOutbox.hl";
import MintingPolicyIsmMultiSig from "./ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "./mpKhalaniTokens.hl";
import MintingPolicyNFT from "./mpNFT.hl";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";
import { requireEnv } from "../offchain/env.utils";

const TOKEN_NAME_AUTH = "auth";
export const TOKEN_NAME_AUTH_BYTES = helios.textToBytes(TOKEN_NAME_AUTH);
export const TOKEN_NAME_AUTH_HEX = helios.bytesToHex(TOKEN_NAME_AUTH_BYTES);

export function getProgramLockForever(): helios.UplcProgram {
  return new ScriptLockForever().compile(false);
}

export function getProgramNFT(outputId: helios.TxOutputId): helios.UplcProgram {
  return new MintingPolicyNFT({
    OUTPUT_ID: new helios.TxOutputId([outputId.txId, outputId.utxoIdx]),
  }).compile(true);
}

export function getProgramIsmKhalani(
  ismParams: IsmParamsHelios
): helios.UplcProgram {
  return new MintingPolicyIsmMultiSig(ismParams).compile(true);
}

export function getProgramInbox(): helios.UplcProgram {
  return new ScriptInbox().compile(true);
}

export function getProgramOutbox(): helios.UplcProgram {
  return new ScriptOutbox().compile(true);
}

export function getProgramKhalaniTokens(
  ismParams: IsmParamsHelios
): helios.UplcProgram {
  const ISM_KHALANI = getProgramIsmKhalani(ismParams).mintingPolicyHash;
  const KHALANI_SENDER = new helios.ByteArray(
    requireEnv(process.env.KHALANI_SENDER)
  );
  const ADDRESS_OUTBOX = helios.Address.fromValidatorHash(
    getProgramOutbox().validatorHash
  );
  return new MintingPolicyKhalaniTokens({
    ISM_KHALANI,
    KHALANI_SENDER,
    ADDRESS_OUTBOX,
  }).compile(true);
}

export function getProgramKhalani(
  ismParams: IsmParamsHelios
): helios.UplcProgram {
  const programKhalaniTokens = getProgramKhalaniTokens(ismParams);
  return new ScriptKhalani({
    MP_KHALANI: programKhalaniTokens.mintingPolicyHash,
  }).compile(true);
}
