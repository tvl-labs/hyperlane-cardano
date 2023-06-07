import * as helios from "@hyperionbt/helios";
const { randomBytes } = require("crypto");
import secp256k1 from "secp256k1";
import createMessage from "./src/offchain/tx/createMessage";
import ScriptLockForever from "./src/onchain/scriptLockForever.hl";

const LABEL_HYPERLANE = helios.textToBytes("HYPERLANE");

function genPrivateKey() {
  let privateKey;
  do {
    privateKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));
  return privateKey;
}
const ownerPrivateKeys = [genPrivateKey(), genPrivateKey(), genPrivateKey()];
const ownerPublicKeys = ownerPrivateKeys.map(
  (k) => new helios.ByteArray(Array.from(secp256k1.publicKeyCreate(k)))
);

const origin = Array(32).fill(0);
const originMailbox = Array(32).fill(1);
const checkpointRoot = Array(32).fill(2);
const checkpointIndex = Array(32).fill(3);

const emulatedNetwork = new helios.NetworkEmulator(644);
const wallet = emulatedNetwork.createWallet(10_000_000n);
await emulatedNetwork.tick(1n);

// TODO: Stake on real networks
const addressMessage = helios.Address.fromValidatorHash(
  new ScriptLockForever().compile(true).validatorHash
);

// TODO: Better interface & names here...
function createMsg(msg: string, blockfrost?: helios.BlockfrostV0) {
  const message = helios.textToBytes(msg);
  const messageHash = new Uint8Array(
    helios.Crypto.blake2b(
      helios.Crypto.blake2b(
        origin.concat(originMailbox).concat(LABEL_HYPERLANE)
      )
        .concat(checkpointRoot)
        .concat(checkpointIndex)
        .concat(helios.Crypto.blake2b(message))
    )
  );
  const signatures = ownerPrivateKeys.map(
    (k) =>
      new helios.ByteArray(
        Array.from(secp256k1.ecdsaSign(messageHash, k).signature)
      )
  );
  return createMessage(
    ownerPublicKeys,
    2n,
    addressMessage,
    new helios.ByteArray(origin),
    new helios.ByteArray(originMailbox),
    new helios.ByteArray(checkpointRoot),
    new helios.ByteArray(checkpointIndex),
    new helios.ByteArray(message),
    signatures,
    wallet,
    blockfrost
  );
}

await createMsg("Hello world, Emulated Network!");

// TODO: Let's do .env next
await createMsg(
  "Hello world, Preview Network!",
  new helios.BlockfrostV0("preview", "previewYsVVUeDDNVGdZ86B5olBg5OYEyl6Zmjy")
);

// TODO: Build several edge cases.
