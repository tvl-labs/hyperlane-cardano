import { ethers } from "ethers";
import * as helios from "@hyperionbt/helios";
import { Address } from "../address";
import ScriptLockForever from "../../onchain/scriptLockForever.hl";

// For relayers's offchain usage
export interface IsmParams {
  validators: Address[];
  threshold: bigint;
}

export function getIsmParams(): IsmParams {
  const validators: Address[] = [];
  for (let i = 1; i <= parseInt(process.env.ISM_NUM_VALIDATORS ?? "1"); i++) {
    validators.push(
      Address.fromEvmAddress(
        ethers.computeAddress(
          `0x${process.env[`ISM_VALIDATOR_PUB_KEY_${i}`] ?? ""}`
        )
      )
    );
  }
  return {
    validators,
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
  const VALIDATOR_VKEYS: helios.ByteArray[] = [];
  for (let i = 1; i <= parseInt(process.env.ISM_NUM_VALIDATORS ?? "1"); i++) {
    VALIDATOR_VKEYS.push(
      new helios.ByteArray(process.env[`ISM_VALIDATOR_PUB_KEY_${i}`] ?? "")
    );
  }
  return {
    VALIDATOR_VKEYS,
    THRESHOLD: BigInt(process.env.ISM_THRESHOLD ?? 2),
    RECIPIENT_ADDRESS: addressMessage,
  };
}
