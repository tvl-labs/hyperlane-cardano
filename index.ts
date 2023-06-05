import * as helios from "@hyperionbt/helios";
import createMessage from "./src/offchain/tx/createMessage";
import ScriptLockForever from "./src/onchain/scriptLockForever.hl";

const network = new helios.NetworkEmulator(644);
const wallets = [1, 2, 3].map((_) => network.createWallet(10_000_000n));

await network.tick(1n);

// TODO: Stake on real networks
const addressMessage = helios.Address.fromValidatorHash(
  new ScriptLockForever().compile(true).validatorHash
);

// TODO: Better interface & names here...
function createMsg(msg: string, blockfrost?: helios.BlockfrostV0) {
  const message = helios.textToBytes(msg);
  const signatures = wallets.map((w) =>
    new helios.ByteArray(
      helios.Crypto.Ed25519.sign(message, w.privateKey.bytes)
    )._toUplcData()
  );
  return createMessage(
    wallets.map((w) => w.pubKey),
    BigInt(Math.floor(wallets.length / 2) + 1),
    addressMessage,
    new helios.ByteArray(message)._toUplcData(),
    new helios.ListData(signatures),
    wallets[0],
    blockfrost
  );
}

await createMsg("Hello world, Emulated Network!");

// TODO: Let's do .env next
await createMsg("Hello world, Preview Network!", new helios.BlockfrostV0(
  "preview",
  "previewYsVVUeDDNVGdZ86B5olBg5OYEyl6Zmjy"
));

// TODO: Build several edge cases.
