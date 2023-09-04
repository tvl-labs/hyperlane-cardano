import * as helios from "@hyperionbt/helios";
import secp256k1 from "secp256k1";
import { waitForTxConfirmation } from "../offchain/blockfrost/waitForTxConfirmation";
import {
  emulatedNetwork,
  emulatedRelayerWallet,
  preprodRelayerWallet,
  preprodDappWallet,
  emulatedDappWallet,
} from "./index";
import { Address } from "../offchain/address";
import type { Wallet } from "../offchain/wallet";
import {
  createMessagePayloadMint,
  MessagePayload,
} from "../offchain/messagePayload";
import { DOMAIN_CARDANO, DOMAIN_FUJI } from "./testDomains";
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
import { H256 } from "../offchain/h256";
import { getUsdcRequestUTxOs } from "../offchain/indexer/getUsdcRequestUTxOs";
import { convertUtxoToJson } from "./debug";
import { getProgramKhalani } from "../onchain/programs";
import { CardanoTokenName } from "../offchain/cardanoTokenName";

// TODO: Build several edge cases.

const sender = Address.fromHex(`0x${process.env.KHALANI_SENDER ?? ""}`);

function mockCheckpoint(
  ismParams: IsmParamsHelios,
  recipientAddress: helios.Address
): Checkpoint {
  const recipientAddressHash = helios.bytesToHex(
    helios.Crypto.blake2b(recipientAddress.bytes)
  );
  return {
    originMailbox: Address.fromHex(
      "0x000000000000000000000000d8e78417e8c8d672258bbcb8ec078e15eb419730"
    ),
    checkpointRoot: H256.zero(),
    message: {
      version: 0,
      nonce: 0,
      originDomain: DOMAIN_FUJI,
      sender,
      destinationDomain: DOMAIN_CARDANO,
      recipient: Address.fromValidatorHash(
        getProgramKhalani(ismParams).validatorHash
      ),
      body: createMessagePayloadMint({
        rootChainId: DOMAIN_FUJI,
        rootSender: H256.from(sender.toBuffer()),
        // USDC
        tokens: [[CardanoTokenName.fromTokenName("USDC"), 150_000_000]],
        recipientAddressHash: H256.from(
          Buffer.from(recipientAddressHash, "hex")
        ),
        message: MessagePayload.fromHexString(`0x${recipientAddress.toHex()}`),
      }),
    },
  };
}

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
    (k) => secp256k1.ecdsaSign(checkpointHash.toBuffer(), k).signature
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
  await processInboundMessage(ismParams, utxoMessage, emulatedRelayerWallet);
  return ismParams;
}

export async function testInboxOnPreprodNetwork(): Promise<IsmParamsHelios> {
  const { ismParams, utxoInbox } = await createInbox(preprodRelayerWallet);
  console.log(`Created inbox at tx ${utxoInbox.txId.hex}!`);
  await waitForTxConfirmation(utxoInbox.txId);

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
    `Submit inbound message at tx ${txOutcome.utxoMessage.txId.hex}!`
  );
  await waitForTxConfirmation(txOutcome.utxoMessage.txId);

  let isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(message)
  );
  if (!isDelivered) {
    throw new Error("Message must have been delivered already");
  }

  const usdcRequestsUtxos = await getUsdcRequestUTxOs(message.recipient);
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
    preprodRelayerWallet
  );
  console.log(`Process inbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId);

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
