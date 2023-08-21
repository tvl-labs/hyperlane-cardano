import type * as helios from "@hyperionbt/helios";

declare class MintingPolicyKhalaniTokens {
  constructor(params: {
    ISM_KHALANI: helios.MintingPolicyHash;
    ADDRESS_OUTBOX: helios.Address;
  });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyKhalaniTokens;
