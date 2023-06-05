import * as helios from "@hyperionbt/helios";
import createMessage from "./src/offchain/tx/createMessage";

const network = new helios.NetworkEmulator();
const wallets = [1, 2, 3].map((_) => network.createWallet(10_000_000n));
const messageAddress = network.createWallet().address;

await network.tick(1n);

const message = helios.textToBytes("Hello world from Hyperlane <> Cardano!");
const signatures = wallets.map((w) =>
  new helios.ByteArray(
    helios.Crypto.Ed25519.sign(message, w.privateKey.bytes)
  )._toUplcData()
);
await createMessage(
  wallets.map((w) => w.pubKey),
  BigInt(Math.floor(wallets.length / 2) + 1),
  messageAddress,
  new helios.ByteArray(message)._toUplcData(),
  new helios.ListData(signatures),
  wallets[0]
);

// TODO: Emulate several edge cases.
// TODO: Post messages to Preview/Pre-Production addresses.
