import * as helios from "@hyperionbt/helios";
import { getProgramInbox } from "../../onchain/programs";

export interface IsmParamsHelios {
  VALIDATOR_VKEYS: helios.ByteArray[];
  THRESHOLD: bigint;
  OUTPUT_ID: helios.TxOutputId;
  INBOX_ADDRESS: helios.Address;
}

export function getIsmParamsHelios(
  OUTPUT_ID: helios.TxOutputId = new helios.TxOutputId(
    process.env.ISM_OUTPUT_ID ?? ""
  )
): IsmParamsHelios {
  const VALIDATOR_VKEYS: helios.ByteArray[] = [];
  for (let i = 1; i <= parseInt(process.env.ISM_NUM_VALIDATORS ?? "1"); i++) {
    VALIDATOR_VKEYS.push(
      new helios.ByteArray(process.env[`ISM_VALIDATOR_PUB_KEY_${i}`] ?? "")
    );
  }
  const addressInbox = helios.Address.fromValidatorHash(
    getProgramInbox().validatorHash
  );
  return {
    VALIDATOR_VKEYS,
    THRESHOLD: BigInt(process.env.ISM_THRESHOLD ?? 2),
    OUTPUT_ID,
    INBOX_ADDRESS: addressInbox,
  };
}
