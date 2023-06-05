import * as helios from "@hyperionbt/helios";

declare class MintingPolicyIsmMultiSig {
  constructor(params: {
    PK_OWNERS: helios.PubKey[];
    NUM_SIGNATURES_REQUIRED: bigint;
    ADDR_MESSAGE: helios.Address;
  });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyIsmMultiSig;
