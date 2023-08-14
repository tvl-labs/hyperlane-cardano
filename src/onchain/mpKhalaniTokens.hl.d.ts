import type * as helios from "@hyperionbt/helios";

declare class MintingPolicyKhalaniTokens {
  constructor(params: { ISM_KHALANI: helios.MintingPolicyHash });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyKhalaniTokens;
