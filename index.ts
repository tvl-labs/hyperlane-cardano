import * as helios from "@hyperionbt/helios";
import MintingPolicyIsmMultiSig from "./src/onchain/ismMultiSig.hl";

const ismMultiSig = new MintingPolicyIsmMultiSig({
  PK_OWNERS: [
    new helios.PubKey(
      "0000000000000000000000000000000000000000000000000000000000000000"
    ),
    new
     helios.PubKey(
      "1111111111111111111111111111111111111111111111111111111111111111"
    ),
    new helios.PubKey(
      "2222222222222222222222222222222222222222222222222222222222222222"
    ),
  ],
  NUM_SIGNATURES_REQUIRED: BigInt(2),
  ADDR_MESSAGE: new helios.Address(
    "addr_test1qr2argsphqkfrmcgdzp9czxqfm8qqa77w8jrnv92fs0a9p5tsf75ekkp5ss45xg6twpgz773nr8h55mqc22j0j5pak9sky4g07"
  ),
}).compile(true);

if (
  ismMultiSig.mintingPolicyHash.hex !==
  "cbf3f2ec63333023a30be96dbc707c7357792c90971d38bdd728c7b9"
) {
  throw new Error("invalid minting policy hash");
}

// TODO: Emulate several transactions & edge cases.
// TODO: Post messages to Preview/Pre-Production addresses.
