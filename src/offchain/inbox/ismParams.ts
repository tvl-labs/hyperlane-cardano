import { ethers } from "ethers";
import * as helios from "@hyperionbt/helios";
import { Address } from "../address";
import ScriptLockForever from "../../onchain/scriptLockForever.hl";

// TODO: Read the number of validators from env.
// TODO: Test with more than 1 validator.

// For relayers's offchain usage
export interface IsmParams {
  validators: Address[];
  threshold: bigint;
}

export function getIsmParams(): IsmParams {
  return {
    validators: [1].map((i) =>
      Address.fromEvmAddress(
        ethers.computeAddress(
          `0x${process.env[`ISM_VALIDATOR_PUB_KEY_${i}`] ?? ""}`
        )
      )
    ),
    threshold: BigInt(process.env.ISM_THRESHOLD ?? 2),
  };
}

// For compiling the ISM on Cardano
export interface IsmParamsHelios {
  VALIDATOR_VKEYS: helios.ByteArray[];
  THRESHOLD: bigint;
  RECIPIENT_ADDRESS: helios.Address;
}

// TODO: Promote `RECIPIENT_ADDRESS` to parameter
// for dApps to configure!
export function getIsmParamsHelios(): IsmParamsHelios {
  const addressMessage = helios.Address.fromValidatorHash(
    new ScriptLockForever().compile(true).validatorHash
  );
  return {
    VALIDATOR_VKEYS: [1].map(
      (i) =>
        new helios.ByteArray(process.env[`ISM_VALIDATOR_PUB_KEY_${i}`] ?? "")
    ),
    THRESHOLD: BigInt(process.env.ISM_THRESHOLD ?? 2),
    RECIPIENT_ADDRESS: addressMessage,
  };
}
