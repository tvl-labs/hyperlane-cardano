import { requireEnv } from "../env.utils";

export interface OutboxParams {
  /**
   * NFT minting policy hash + "auth"
   */
  outboxAuthToken: string;
}

export function getOutboxParams(): OutboxParams {
  const outboxAuthToken = requireEnv(process.env.OUTBOX_AUTH_TOKEN);
  return { outboxAuthToken };
}
