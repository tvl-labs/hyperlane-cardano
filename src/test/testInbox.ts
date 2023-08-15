import * as helios from "@hyperionbt/helios";
import secp256k1 from "secp256k1";
import MintingPolicyIsmMultiSig from "../onchain/ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "../onchain/mpKhalaniTokens.hl";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getInboundMessages } from "../offchain/indexer/getInboundMessages";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
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
import { calculateMessageId, type Message } from "../offchain/message";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";
import createInbox from "../offchain/tx/createInbox";
import { H256 } from "../merkle/h256";

// TODO: Build several edge cases.

// Mock inbound message
const sender = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
);
const recipient = Address.fromHex(
  // Message recipient
  "0x0000000000000000000000000000000000000000000000000000000000000CA1"
);
// USDC recipient
const recipientAddress = new helios.Address(
  "addr_test1qzq0qn4kywltmn37zc4gsgemuc9rjmz6pdrevklyvl8fg4k7ev8utalf2nv8976mcvy8rgdfssjvd9aaae4w93cp980q6xt9dc"
);
const recipientAddressHash = helios.bytesToHex(
  helios.Crypto.blake2b(recipientAddress.bytes)
);
const hashMap = {
  [recipientAddressHash]: recipientAddress.toHex(),
};

function mockCheckpoint(ismParams: IsmParamsHelios): Checkpoint {
  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
  const mpKhalaniTokens = new MintingPolicyKhalaniTokens({
    ISM_KHALANI: ismMultiSig.mintingPolicyHash,
  }).compile(true);
  const message: Message = {
    version: 0,
    nonce: 0,
    originDomain: FUJI_DOMAIN,
    sender,
    destinationDomain: DOMAIN_CARDANO,
    recipient,
    body: createMessagePayloadMint({
      rootChainId: FUJI_DOMAIN,
      rootSender: sender,
      // USDC
      tokens: [[`0x${mpKhalaniTokens.mintingPolicyHash.hex}55534443`, 15]],
      recipientAddressHash: H256.from(Buffer.from(recipientAddressHash, "hex")),
    }),
  };
  return {
    origin: FUJI_DOMAIN,
    originMailbox: Address.fromHex(
      "0x000000000000000000000000d8e78417e8c8d672258bbcb8ec078e15eb419730"
    ),
    checkpointRoot: Buffer.alloc(32).fill(0),
    checkpointIndex: 0,
    message,
  };
}

// TODO: Better interface & names here...
async function createInboundMsg(
  wallet: Wallet,
  ismParams: IsmParamsHelios,
  utxoInbox: helios.UTxO
) {
  const checkpoint = mockCheckpoint(ismParams);
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

  return await createInboundMessage(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
}

export async function testInboxOnEmulatedNetwork(): Promise<IsmParamsHelios> {
  emulatedNetwork.tick(1n);
  const { ismParams, utxoInbox } = await createInbox(emulatedWallet);
  emulatedNetwork.tick(1n);
  const { utxoMessage } = await createInboundMsg(
    emulatedWallet,
    ismParams,
    utxoInbox
  );
  emulatedNetwork.tick(1n);
  await processInboundMessage(ismParams, utxoMessage, hashMap, emulatedWallet);
  return ismParams;
}

export async function testInboxOnPreprodNetwork(): Promise<IsmParamsHelios> {
  const { ismParams, utxoInbox } = await createInbox(preprodWallet);
  console.log(`Created inbox at tx ${utxoInbox.txId.hex}!`);
  await waitForTxConfirmation(utxoInbox.txId.hex);

  const { message } = mockCheckpoint(ismParams);
  const txOutcome = await createInboundMsg(preprodWallet, ismParams, utxoInbox);
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

  // Note: Not all messages are "text".
  const inboundMessages = await getInboundMessages(ismParams);
  if (
    inboundMessages[inboundMessages.length - 1].hex !==
    message.body.toHex().substring(2)
  ) {
    throw new Error("Inbound message not found");
  }

  const txId = await processInboundMessage(
    ismParams,
    txOutcome.utxoMessage,
    hashMap,
    preprodWallet
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
