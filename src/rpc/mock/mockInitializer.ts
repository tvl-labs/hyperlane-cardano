import { Address } from "../../offchain/address";
import { IS_MOCK_ENVIRONMENT } from "../environment";
import { dispatchNewMessage, updateLastFinalizedBlock } from "./mock";
import { configDotenv } from "dotenv";
import { MessagePayload } from "../../offchain/messagePayload";

export const FUJI_DOMAIN = 43113;
/**
 * TestRecipient contract on Fuji: https://testnet.snowtrace.io/address/0x27d2D0b183d5F839C5A9ACf6046cC215Ab6d0a9A#code
 * https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/solidity/contracts/test/TestRecipient.sol
 * This contract simply records the last sent message.
 *
 * The ISM module registered for the TestRecipient is 0x73719b218E3B92489570B55Fbc9E1bb2C2887674.
 * It has the only validator enrolled 0x70997970c51812dc3a010c7d01b50e0d17dc79c8.
 */
const FUJI_RECIPIENT = Address.fromHex(
  "0x00000000000000000000000027d2D0b183d5F839C5A9ACf6046cC215Ab6d0a9A"
);
const SENDER = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000CA1"
);

configDotenv();

export function mockPrefillState() {
  console.log("Prefilling mock state");
  updateLastFinalizedBlock(3);
  const messageTemplate = {
    sender: SENDER,
    recipient: FUJI_RECIPIENT,
    destinationDomain: FUJI_DOMAIN,
    message: MessagePayload.fromString("Message at block #3"),
  };
  dispatchNewMessage(messageTemplate);

  updateLastFinalizedBlock(5);
  dispatchNewMessage({
    ...messageTemplate,
    message: MessagePayload.fromString("Message at block #5"),
  });

  updateLastFinalizedBlock(8);
  dispatchNewMessage({
    ...messageTemplate,
    message: MessagePayload.fromString("Message at block #8"),
  });

  updateLastFinalizedBlock(10);
}
