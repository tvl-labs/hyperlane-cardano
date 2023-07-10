import type * as helios from "@hyperionbt/helios";
import { configDotenv } from 'dotenv';
import { wallet } from '../test';
import createOutboundMessage from '../offchain/tx/createOutboundMessage';
import { type Message } from '../offchain/message';
import { blockfrost } from '../offchain/indexer/blockfrost';
import { waitForTxConfirmation } from '../offchain/waitForTxConfirmation';
import createOutbox from '../offchain/tx/createOutbox';
import { DOMAIN_CARDANO } from '../rpc/mock/cardanoDomain';
import { Address } from '../offchain/address';
import { MessagePayload } from '../offchain/messagePayload';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { type DispatchedMessage } from '../rpc/outbox/dispatchedMessage';
import { getAddressOfWallet } from '../rpc/wallet';

configDotenv()

async function createWallet(): Promise<helios.Wallet> {
  // TODO: create wallet out of a private key.
  return wallet;
}

async function fetchOutboxUtxo(): Promise<helios.UTxO> {
  // TODO: fetch the latest existing Outbox UTXO instead of creating a new outbox.
  //  Probably the logic can be extracted from 'src/offchain/indexer/getOutboundMessages.ts'
  return await createOutbox(wallet, blockfrost)
}

async function parseDispatchedMessage(): Promise<DispatchedMessage> {
  const argv = await yargs(hideBin(process.argv))
    .option('destinationDomain', {
      type: 'number',
      demandOption: true,
      describe: 'Destination domain',
    })
    .option('recipient', {
      type: 'string',
      demandOption: true,
      describe: 'Recipient address as hex string',
      coerce: (arg: string): string => {
        if (/^0x[0-9A-Fa-f]{64}$/.test(arg)) {
          return arg;
        } else {
          throw new Error('Recipient must be a hex string of 66 characters long (including 0x)');
        }
      },
    })
    .option('message', {
      type: 'string',
      demandOption: true,
      describe: 'Message as hex string',
      coerce: (arg: string): string => {
        if (/^0x[0-9A-Fa-f]*$/.test(arg)) {
          return arg;
        } else {
          throw new Error('Message must be a hex string of arbitrary size');
        }
      },
    })
    .argv;

  return {
    destinationDomain: argv.destinationDomain,
    recipient: Address.fromHex(argv.recipient),
    message: MessagePayload.fromHexString(argv.message),
  }
}

async function prepareMessage(dispatchedMessage: DispatchedMessage, senderWallet: helios.Wallet): Promise<Message> {
  return {
    version: 0,
    nonce: 0,
    sender: getAddressOfWallet(senderWallet),
    originDomain: DOMAIN_CARDANO,
    ...dispatchedMessage
  }
}

async function main() {
  const wallet = await createWallet();
  const dispatchedMessage = await parseDispatchedMessage()
  const message = await prepareMessage(dispatchedMessage, wallet);
  const outboxUtxo = await fetchOutboxUtxo();
  const utxo = await createOutboundMessage(outboxUtxo, message, wallet, blockfrost);
  await waitForTxConfirmation(utxo.txId.hex)
}

await main()
