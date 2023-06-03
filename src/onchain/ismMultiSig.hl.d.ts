import * as helios from "@hyperionbt/helios";

declare class MintingPolicyIsmMultiSig {
  constructor(params: {
    // TODO: Add a clean interface for a list of PubKey as parameter.
    // PK_OWNERS: PubKey[];
    NUM_SIGNATURES_REQUIRED: bigint;
    ADDR_MESSAGE: helios.Address;
  });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyIsmMultiSig;
