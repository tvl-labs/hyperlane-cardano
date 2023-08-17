import * as helios from "@hyperionbt/helios";
import secp256k1 from "secp256k1";
import MintingPolicyIsmMultiSig from "../onchain/ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "../onchain/mpKhalaniTokens.hl";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import {
  emulatedNetwork,
  emulatedRelayerWallet,
  preprodRelayerWallet,
  preprodDappWallet,
  emulatedDappWallet,
} from "./index";
import { Address } from "../offchain/address";
import type { Wallet } from "../offchain/wallet";
import { createMessagePayloadMint } from "../offchain/messagePayload";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import {
  isInboundMessageDelivered,
  estimateInboundMessageFee,
  createInboundMessage,
  processInboundMessage,
} from "../offchain/inbox";
import { type Checkpoint, hashCheckpoint } from "../offchain/checkpoint";
import { calculateMessageId } from "../offchain/message";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";
import createInbox from "../offchain/tx/createInbox";
import { H256 } from "../merkle/h256";
import ScriptKhalani from "../onchain/scriptKhalani.hl";
import { getUsdcRequestUTxOs } from "../offchain/indexer/getUsdcRequestUTxOs";
import { convertUtxoToJson } from "./debug";

// TODO: Build several edge cases.

// Mock inbound message
const sender = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
);
const hashMap = {};

function mockCheckpoint(
  ismParams: IsmParamsHelios,
  recipientAddress: helios.Address
): Checkpoint {
  const recipientAddressHash = helios.bytesToHex(
    helios.Crypto.blake2b(recipientAddress.bytes)
  );
  hashMap[recipientAddressHash] = recipientAddress.toHex();
  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
  const mpKhalaniTokens = new MintingPolicyKhalaniTokens({
    ISM_KHALANI: ismMultiSig.mintingPolicyHash,
  }).compile(true);
  const recipient = Address.fromHex(
    `0x000000${helios.Address.fromValidatorHash(
      new ScriptKhalani({
        MP_KHALANI: mpKhalaniTokens.mintingPolicyHash,
      }).compile(true).validatorHash
    ).toHex()}`
  );
  return {
    origin: FUJI_DOMAIN,
    originMailbox: Address.fromHex(
      "0x000000000000000000000000d8e78417e8c8d672258bbcb8ec078e15eb419730"
    ),
    checkpointRoot: Buffer.alloc(32).fill(0),
    checkpointIndex: 0,
    message: {
      version: 0,
      nonce: 0,
      originDomain: FUJI_DOMAIN,
      sender,
      destinationDomain: DOMAIN_CARDANO,
      recipient,
      body: createMessagePayloadMint({
        rootChainId: FUJI_DOMAIN,
        rootSender: H256.from(sender.toBuffer()),
        // USDC
        tokens: [["0x55534443", 15]],
        recipientAddressHash: H256.from(
          Buffer.from(recipientAddressHash, "hex")
        ),
      }),
    },
  };
}

// TODO: Better interface & names here...
async function createInboundMsg(
  ismParams: IsmParamsHelios,
  recipientAddress: helios.Address,
  utxoInbox: helios.UTxO,
  wallet: Wallet
) {
  const checkpoint = mockCheckpoint(ismParams, recipientAddress);
  const checkpointHash = hashCheckpoint(checkpoint);
  const validatorPrivateKeys = [1, 2, 3].map((i) =>
    Buffer.from(process.env[`PRIVATE_KEY_VALIDATOR_${i}`] ?? "", "hex")
  );
  const signatures = validatorPrivateKeys.map(
    (k) => secp256k1.ecdsaSign(checkpointHash, k).signature
  );

  const isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(checkpoint.message)
  );
  if (isDelivered) {
    throw new Error("Message must not be delivered already");
  }

  const fee = await estimateInboundMessageFee(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  if (fee < 300_000n) {
    throw new Error("Invalid fee? Fee too low.");
  }

  const txOutcome = await createInboundMessage(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  return {
    checkpoint,
    txOutcome,
  };
}

export async function testInboxOnEmulatedNetwork(): Promise<IsmParamsHelios> {
  emulatedNetwork.tick(1n);
  const { ismParams, utxoInbox } = await createInbox(emulatedRelayerWallet);
  emulatedNetwork.tick(1n);
  const {
    txOutcome: { utxoMessage },
  } = await createInboundMsg(
    ismParams,
    emulatedDappWallet.address,
    utxoInbox,
    emulatedRelayerWallet
  );
  emulatedNetwork.tick(1n);
  await processInboundMessage(
    ismParams,
    utxoMessage,
    hashMap,
    emulatedRelayerWallet
  );
  return ismParams;
}

export async function testInboxOnPreprodNetwork(): Promise<IsmParamsHelios> {
  const { ismParams, utxoInbox } = await createInbox(preprodRelayerWallet);
  console.log(`Created inbox at tx ${utxoInbox.txId.hex}!`);
  await waitForTxConfirmation(utxoInbox.txId.hex);

  const {
    checkpoint: { message },
    txOutcome,
  } = await createInboundMsg(
    ismParams,
    preprodDappWallet.address,
    utxoInbox,
    preprodRelayerWallet
  );
  console.log(
    `Submitted inbound message at tx ${txOutcome.utxoMessage.txId.hex}!`
  );
  await waitForTxConfirmation(txOutcome.utxoMessage.txId.hex);

  let isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(message)
  );
  if (!isDelivered) {
    throw new Error("Message must have been delivered already");
  }

  const khalaniRecipient = message.recipient.toValidatorHash();
  const usdcRequestsUtxos = await getUsdcRequestUTxOs(khalaniRecipient);
  if (usdcRequestsUtxos.length !== 1) {
    console.error(
      JSON.stringify(usdcRequestsUtxos.map(convertUtxoToJson), null, 2)
    );
    throw new Error(
      `Expected exactly 1 USDC minting request but found ${usdcRequestsUtxos.length}`
    );
  }
  const usdcRequestUtxo = usdcRequestsUtxos[0];

  const txId = await processInboundMessage(
    ismParams,
    usdcRequestUtxo,
    hashMap,
    preprodRelayerWallet
  );
  console.log(`Processed inbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId.hex);

  isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(message)
  );
  if (!isDelivered) {
    throw new Error(
      "Message must still have been delivered after being burned"
    );
  }
  return ismParams;
}
