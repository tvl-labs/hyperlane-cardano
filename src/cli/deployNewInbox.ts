import * as yaml from 'js-yaml';
import * as fs from 'fs';
import createInbox from '../offchain/tx/createInbox';
import { waitForTxConfirmation } from '../offchain/waitForTxConfirmation';
import { Wallet } from '../offchain/wallet';
import * as helios from '@hyperionbt/helios';

function getRpcConfig(): {
  walletAddress: string,
  walletPrivateKey: string
} {
  const fileContents = fs.readFileSync('./helm/cardano-rpc-values.yaml', 'utf8');
  const data = yaml.load(fileContents) as any;
  const cardanoRpc = data.cardanoRpc;
  return {
    walletAddress: cardanoRpc.WALLET_ADDRESS,
    walletPrivateKey: cardanoRpc.WALLET_PRIVATE_KEY,
  };
}

export async function deployNewInbox() {
  const { walletAddress, walletPrivateKey } = getRpcConfig()
  const relayerWallet = new Wallet(
    new helios.Address(walletAddress),
    new helios.PrivateKey(walletPrivateKey)
  );
  const { inboxOutputId, utxoInbox } = await createInbox(relayerWallet);
  await waitForTxConfirmation(utxoInbox.txId.hex);
  console.log(`Created inbox at tx ${utxoInbox.txId.hex}!`);
  console.log(`Inbox OUTPUT_ID ${inboxOutputId.txId.hex}#${inboxOutputId.utxoIdx}`);
}

async function main() {
  await deployNewInbox()
}

main().catch((e) => {
  console.error(e);
  process.exit(1)
})
