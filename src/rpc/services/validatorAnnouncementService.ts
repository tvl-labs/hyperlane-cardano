import {
  type IValidatorAnnouncement,
  type ValidatorStorageLocations,
} from "./interfaces/IValidatorAnnouncement";
import { type Address } from "../../offchain/address";
import { getValidatorStorageLocation } from "../../offchain/indexer/getValidatorStorageLocation";

export class ValidatorAnnouncementService implements IValidatorAnnouncement {
  async getValidatorStorageLocations(
    validators: Address[]
  ): Promise<ValidatorStorageLocations> {
    const validatorStorageLocations = await Promise.all(
      validators.map(async (v) => await getValidatorStorageLocation(v))
    );

    function isDefined<T>(arg: T | undefined): arg is T {
      return arg !== undefined;
    }

    return validatorStorageLocations.filter(isDefined).map((validator) => ({
      validatorAddress: validator.validator,
      storageLocation: validator.storageLocation,
    }));
  }
}
