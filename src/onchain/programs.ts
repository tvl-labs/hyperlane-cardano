// As our script dependencies get complex, programs should be
// paramterized and compiled through this module for consistency
// and code deduplication.
// TODO: Port more scripts/programs here.

import type { UplcProgram } from "@hyperionbt/helios";
import { getIsmParamsHelios } from "../offchain/inbox";
import ScriptOutbox from "./scriptOutbox.hl";
import MintingPolicyIsmMultiSig from "./ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "./mpKhalaniTokens.hl";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";

export function getProgramOutbox(ismParams?: IsmParamsHelios): UplcProgram {
  if (ismParams == null) {
    ismParams = getIsmParamsHelios();
  }
  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
  const mpKhalaniTokens = new MintingPolicyKhalaniTokens({
    ISM_KHALANI: ismMultiSig.mintingPolicyHash,
  }).compile(true);
  return new ScriptOutbox({
    MP_KHALANI: mpKhalaniTokens.mintingPolicyHash,
  }).compile(false);
}
