import {
  type IValidatorAnnouncement,
  type ValidatorStorageLocations,
} from "../../services/IValidatorAnnouncement";
import { type Address } from "../../../offchain/address";

export class MockValidatorAnnouncement implements IValidatorAnnouncement {
  async getValidatorStorageLocations(
    validators: Address[]
  ): Promise<ValidatorStorageLocations> {
    return validators.map((validator) => ({
      validatorAddress: validator,
      storageLocation: "file:///tmp/checkpoints/" + validator.toEvmAddress(),
    }));
  }
}
