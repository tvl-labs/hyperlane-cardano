import * as helios from "@hyperionbt/helios";
import paramsPreview from "./data/cardano-preview-params.json";
import MintingPolicyIsmMultiSig from "./src/onchain/ismMultiSig.hl";

const network = new helios.NetworkEmulator();
const wallets = [1, 2, 3].map((_) => network.createWallet(10_000_000n));
const messageAddress = network.createWallet().address;

await network.tick(1n);

const ismMultiSig = new MintingPolicyIsmMultiSig({
  PK_OWNERS: wallets.map((w) => w.pubKey),
  NUM_SIGNATURES_REQUIRED: BigInt(Math.floor(wallets.length / 2) + 1),
  ADDR_MESSAGE: messageAddress,
}).compile(false);

const message = helios.textToBytes("Hello world from Hyperlane <> Cardano!");
const messageInUPLC = new helios.ByteArray(message)._toUplcData();
const signatures = wallets.map((w) =>
  new helios.ByteArray(
    helios.Crypto.Ed25519.sign(message, w.privateKey.bytes)
  )._toUplcData()
);

const tx = new helios.Tx();
tx.addInputs(await wallets[0].utxos);

tx.attachScript(ismMultiSig);
tx.mintTokens(
  ismMultiSig.mintingPolicyHash,
  [[helios.textToBytes("auth"), BigInt(1)]],
  new helios.ListData([messageInUPLC, new helios.ListData(signatures)])
);

tx.addOutput(
  new helios.TxOutput(
    messageAddress,
    new helios.Value(
      BigInt(0), // Let Helios calculate the min ADA!
      new helios.Assets([
        [
          ismMultiSig.mintingPolicyHash,
          [[helios.textToBytes("auth"), BigInt(1)]],
        ],
      ])
    ),
    helios.Datum.inline(messageInUPLC)
  )
);

await tx.finalize(new helios.NetworkParams(paramsPreview), wallets[0].address);
const txId = await network.submitTx(tx);
console.log(txId.hex);

// TODO: Emulate several edge cases.
// TODO: Post messages to Preview/Pre-Production addresses.
