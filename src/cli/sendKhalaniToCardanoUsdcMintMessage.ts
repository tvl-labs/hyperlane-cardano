import "dotenv/config";
import { ethers } from 'ethers';
import { MAILBOX_ABI } from '../evm/mailbox.abi';
import * as fs from 'fs';
import path from 'path';
import { Address } from '../offchain/address';
import { createMessagePayloadMint, MessagePayload } from '../offchain/messagePayload';
import { H256 } from '../merkle/h256';
import { CardanoTokenName } from '../cardanoTokenName';
import * as helios from '@hyperionbt/helios';
import { getProgramKhalaniTokens } from '../onchain/programs';
import ScriptKhalani from '../onchain/scriptKhalani.hl';
import { getIsmParamsHelios } from '../offchain/inbox';

const KHALANI_RPC_URL = "https://testnet.khalani.network/";

// https://testnet.snowtrace.io/address/0x2064dfa3a7dc4F6Bb6523B56Fa6C46611799058A
// https://block-explorer.testnet.khalani.network/address/0x2064dfa3a7dc4F6Bb6523B56Fa6C46611799058A
const EVM_TEST_WALLET = "0xa7fa3c72ee7bd14c684d8f29cebd1893f1da5a02926de44fe294734fc9594911";

const KHALANI_CHAIN_ID = 10012;
const CARDANO_CHAIN_ID = 112233;

const KHALANI_BLOCK_EXPLORER_URL = "https://block-explorer.testnet.khalani.network/tx/"

function getMailboxAddress() {
  const cardanoConfigPath = path.resolve('./helm/cardano-test-config.json');
  console.log('Reading chains config from', cardanoConfigPath);
  const chainsConfig: any = JSON.parse(fs.readFileSync(cardanoConfigPath, 'utf-8'));
  return chainsConfig.chains.khalanitestnet.addresses.mailbox as string
}

export async function sendKhalaniToCardanoUsdcMintMessage() {
  const rpcProvider = new ethers.JsonRpcProvider(KHALANI_RPC_URL);
  const wallet = new ethers.Wallet(EVM_TEST_WALLET, rpcProvider);
  const mailbox = new ethers.Contract(
    getMailboxAddress(),
    MAILBOX_ABI,
    wallet
  )

  const ismParamsHelios = getIsmParamsHelios();
  const programKhalaniTokens = getProgramKhalaniTokens(ismParamsHelios);
  const recipient = Address.fromHex(
    `0x000000${helios.Address.fromValidatorHash(
      new ScriptKhalani({
        MP_KHALANI: programKhalaniTokens.mintingPolicyHash,
      }).compile(true).validatorHash
    ).toHex()}`
  );

  const recipientAddress = new helios.Address("addr_test1vpcvg34l9ngamtytg3ex5mxgcczgtu78dh3m3uxdk7cf5dg0scvn5")
  const recipientAddressHash = H256.from(
    Buffer.from(helios.bytesToHex(
      helios.Crypto.blake2b(recipientAddress.bytes)
    ), "hex")
  );
  const messagePayload = createMessagePayloadMint({
    rootChainId: KHALANI_CHAIN_ID,
    rootSender: H256.fromHex(Address.fromEvmAddress(wallet.address).toHex()),
    tokens: [[CardanoTokenName.fromTokenName("USDC"), 12]],
    recipientAddressHash,
    message: MessagePayload.empty()
  });
  const transaction = await mailbox.dispatch(
    CARDANO_CHAIN_ID,
    recipient.toHex(),
    messagePayload.toHex()
  ) as ethers.ContractTransactionResponse;
  const transactionReceipt = await transaction.wait(1);
  if (transactionReceipt === null) {
    throw new Error('Failed to send transaction');
  }
  const transactionHash = transactionReceipt.hash;
  console.log('Dispatched USDC minting transaction', KHALANI_BLOCK_EXPLORER_URL + transactionHash)
}

async function main() {
  await sendKhalaniToCardanoUsdcMintMessage()
}

main().catch((e) => {
  console.error(e);
  process.exit(1)
})
