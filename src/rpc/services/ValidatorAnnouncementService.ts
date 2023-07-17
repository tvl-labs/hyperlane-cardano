import {
  type IValidatorAnnouncement,
  type ValidatorStorageLocations,
} from "./IValidatorAnnouncement";
import { type Address } from "../../offchain/address";
import { getValidatorStorageLocation } from "../../offchain/indexer/getValidatorStorageLocation";

export class ValidatorAnnouncementService implements IValidatorAnnouncement {
  async getValidatorStorageLocations(
    validators: Address[]
  ): Promise<ValidatorStorageLocations> {
    return await Promise.all(
      validators.map(
        async (v) =>
          await getValidatorStorageLocation(v).then((l) => ({
            validatorAddress: l.validator,
            storageLocation: l.storageLocation,
          }))
      )
    );
  }
}
