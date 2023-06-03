import * as helios from "@hyperionbt/helios";
import MintingPolicyIsmMultiSig from "./src/onchain/ismMultiSig.hl";

const ismMultiSig = new MintingPolicyIsmMultiSig({
  // TODO: Add a clean interface for a list of PubKey as parameter.
  // PK_OWNERS: new (helios.HList(helios.PubKey))([]),
  NUM_SIGNATURES_REQUIRED: BigInt(0),
  ADDR_MESSAGE: new helios.Address(
    "addr_test1qr2argsphqkfrmcgdzp9czxqfm8qqa77w8jrnv92fs0a9p5tsf75ekkp5ss45xg6twpgz773nr8h55mqc22j0j5pak9sky4g07"
  ),
}).compile(true);

if (
  ismMultiSig.mintingPolicyHash.hex !==
  "a6f81c2799f2e8b5515d53ccacbbfb1ca9153cb6be60b2d112142d83"
) {
  throw new Error("invalid minting policy hash");
}

// TODO: Emulate several transactions & edge cases.
// TODO: Post messages to Preview/Pre-Production addresses.
