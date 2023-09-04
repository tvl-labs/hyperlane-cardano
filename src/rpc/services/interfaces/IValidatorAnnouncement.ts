import { type Address } from "../../../offchain/address";

export interface IValidatorAnnouncement {
  getValidatorStorageLocations: (
    validators: Address[]
  ) => Promise<ValidatorStorageLocations>;
}

export type ValidatorStorageLocations = {
  validatorAddress: Address;
  storageLocation: string;
}[];
