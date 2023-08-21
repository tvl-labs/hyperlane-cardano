// As our script dependencies get complex, programs should be
// paramterized and compiled through this module for consistency
// and code deduplication.
// TODO: Port more scripts/programs here.

import * as helios from "@hyperionbt/helios";
import ScriptOutbox from "./scriptOutbox.hl";
import MintingPolicyIsmMultiSig from "./ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "./mpKhalaniTokens.hl";
import { getIsmParamsHelios } from "../offchain/inbox";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";

export function getIsmKhalani(ismParams?: IsmParamsHelios): helios.UplcProgram {
  if (ismParams == null) {
    ismParams = getIsmParamsHelios();
  }
  return new MintingPolicyIsmMultiSig(ismParams).compile(true);
}

export function getProgramOutbox(): helios.UplcProgram {
  return new ScriptOutbox().compile(true);
}

export function getProgramKhalaniTokens(
  ismParams?: IsmParamsHelios
): helios.UplcProgram {
  const ISM_KHALANI = getIsmKhalani(ismParams).mintingPolicyHash;
  const ADDRESS_OUTBOX = helios.Address.fromValidatorHash(
    getProgramOutbox().validatorHash
  );
  return new MintingPolicyKhalaniTokens({
    ISM_KHALANI,
    ADDRESS_OUTBOX,
  }).compile(true);
}
