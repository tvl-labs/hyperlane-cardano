import { Address } from "../../offchain/address";
import { IS_MOCK_ENVIRONMENT } from "../environment";
import { dispatchNewMessage, updateLastFinalizedBlock } from "./mock";
import { OutboxMessagePayload } from "../../offchain/outbox/outboxMessagePayload";
import { configDotenv } from "dotenv";

const DOMAIN_ETHEREUM = 1;
const SENDER = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000CA1"
);
const RECIPIENT = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
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
    recipient: RECIPIENT,
    destinationDomain: DOMAIN_ETHEREUM,
    message: OutboxMessagePayload.fromString("Message at block #3"),
  };
  dispatchNewMessage(messageTemplate);

  updateLastFinalizedBlock(5);
  dispatchNewMessage({
    ...messageTemplate,
    message: OutboxMessagePayload.fromString("Message at block #5"),
  });

  updateLastFinalizedBlock(8);
  dispatchNewMessage({
    ...messageTemplate,
    message: OutboxMessagePayload.fromString("Message at block #8"),
  });

  updateLastFinalizedBlock(10);
}
