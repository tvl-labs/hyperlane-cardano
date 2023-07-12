import { Address } from "../../offchain/address";
import { IS_MOCK_ENVIRONMENT } from "../environment";
import { dispatchNewMessage, updateLastFinalizedBlock } from "./mock";
import { configDotenv } from "dotenv";
import { MessagePayload } from "../../offchain/messagePayload";

export const FUJI_DOMAIN = 43113;
/**
 * TestRecipient contract on Fuji: https://testnet.snowtrace.io/address/0xbde95643690F74d8cB8B972a8B281b004b9004E9#code
 * https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/solidity/contracts/test/TestRecipient.sol
 * This contract simply records the last sent message.
 */
const FUJI_RECIPIENT = Address.fromHex(
  "0x000000000000000000000000bde95643690F74d8cB8B972a8B281b004b9004E9"
);
const SENDER = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000CA1"
);

configDotenv();

/**
 * Just some initial messages data.
 */
if (IS_MOCK_ENVIRONMENT) {
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
