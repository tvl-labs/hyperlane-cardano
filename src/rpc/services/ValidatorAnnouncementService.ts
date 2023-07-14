import {
  type IValidatorAnnouncement,
  type ValidatorStorageLocations,
} from "./IValidatorAnnouncement";
import { type Address } from "../../offchain/address";

export class ValidatorAnnouncementService implements IValidatorAnnouncement {
  async getValidatorStorageLocations(
    validators: Address[]
  ): Promise<ValidatorStorageLocations> {
    throw new Error("TODO");
  }
}
