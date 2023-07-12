import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import fetch from "node-fetch";
import ScriptOutbox from "../onchain/scriptOutbox.hl";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import { type Message } from "../offchain/message";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../offchain/indexer/blockfrost";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { Wallet } from "../offchain/wallet";
import { MessagePayload } from "../offchain/messagePayload";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { type DispatchedMessage } from "../rpc/outbox/dispatchedMessage";

function createWallet(): Wallet {
  if (
    typeof process.env.WALLET_ADDRESS !== "string" ||
    typeof process.env.WALLET_PRIVATE_KEY !== "string"
  ) {
    throw new Error("Invalid wallet");
  }
  return new Wallet(
    new helios.Address(process.env.WALLET_ADDRESS),
    new helios.PrivateKey(process.env.WALLET_PRIVATE_KEY)
  );
}

async function fetchOutboxUtxo(): Promise<helios.UTxO> {
  const addressOutbox = helios.Address.fromValidatorHash(
    new ScriptOutbox().compile(true).validatorHash
  );

  const [utxo]: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressOutbox.toBech32()}/utxos/${
      process.env.OUTBOX_AUTH_TOKEN ?? ""
    }`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  // TODO: Write `parseUTxO` upstream in Helios
  return new helios.UTxO(
    helios.TxId.fromHex(utxo.tx_hash),
    BigInt(utxo.output_index),
    new helios.TxOutput(
      addressOutbox,
      helios.BlockfrostV0.parseValue(utxo.amount),
      utxo.inline_datum != null
        ? helios.Datum.inline(
            helios.UplcData.fromCbor(helios.hexToBytes(utxo.inline_datum))
          )
        : undefined
    )
  );
}

async function parseDispatchedMessage(): Promise<DispatchedMessage> {
  const argv = await yargs(hideBin(process.argv))
    .option("destinationDomain", {
      type: "number",
      demandOption: true,
      describe: "Destination domain",
    })
    .option("recipient", {
      type: "string",
      demandOption: true,
      describe: "Recipient address as hex string",
      coerce: (arg: string): string => {
        if (/^0x[0-9A-Fa-f]{64}$/.test(arg)) {
          return arg;
        } else {
          throw new Error(
            "Recipient must be a hex string of 66 characters long (including 0x)"
          );
        }
      },
    })
    .option("message", {
      type: "string",
      demandOption: true,
      describe: "Message as hex string",
      coerce: (arg: string): string => {
        if (/^0x[0-9A-Fa-f]*$/.test(arg)) {
          return arg;
        } else {
          throw new Error("Message must be a hex string of arbitrary size");
        }
      },
    }).argv;

  return {
    destinationDomain: argv.destinationDomain,
    recipient: Address.fromHex(argv.recipient),
    message: MessagePayload.fromHexString(argv.message),
  };
}

async function prepareMessage(
  outboxUtxo: helios.UTxO,
  dispatchedMessage: DispatchedMessage,
  senderWallet: Wallet
): Promise<Message> {
  return {
    version: 0,
    nonce: Number(outboxUtxo.origOutput.datum.data.list[0].list[1].int),
    sender: Address.fromHex(`0x${senderWallet.address.toHex()}000000`),
    originDomain: DOMAIN_CARDANO,
    ...dispatchedMessage,
  };
}

async function main() {
  const wallet = createWallet();
  const dispatchedMessage = await parseDispatchedMessage();
  const outboxUtxo = await fetchOutboxUtxo();
  const message = await prepareMessage(outboxUtxo, dispatchedMessage, wallet);
  const utxo = await createOutboundMessage(outboxUtxo, message, wallet);
  console.log(`Submitted outbound message at tx ${utxo.txId.hex}!`);
  await waitForTxConfirmation(utxo.txId.hex);
}

await main();
