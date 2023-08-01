import { ethers } from "ethers";
import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import type { Address } from "../address";
import {
  deserializeValidatorStorageLocation,
  hashValidatorStorageLocation,
  type ValidatorStorageLocation,
} from "../validatorStorageLocation";
import ScriptLockForever from "../../onchain/scriptLockForever.hl";

export async function getValidatorStorageLocation(
  validator: Address
): Promise<ValidatorStorageLocation | undefined> {
  const addressLockForever = helios.Address.fromValidatorHash(
    new ScriptLockForever().compile(false).validatorHash
  );

  for (let page = 1; true; page++) {
    const txs: any = await fetch(
      `${blockfrostPrefix}/addresses/${addressLockForever.toBech32()}/transactions?order=desc&page=${page}`,
      {
        headers: {
          project_id: blockfrostProjectId,
        },
      }
    ).then(async (r) => await r.json());

    if (txs.length === 0) break;

    for (const tx of txs) {
      try {
        const txUTxOs: any = await fetch(
          `${blockfrostPrefix}/txs/${tx.tx_hash as string}/utxos`,
          {
            headers: {
              project_id: blockfrostProjectId,
            },
          }
        ).then(async (r) => await r.json());

        const utxos = txUTxOs.outputs.filter(
          (o) => o.address === addressLockForever.toBech32()
        );
        if (utxos.length !== 1) continue;

        let validatorStorageLocation: ValidatorStorageLocation;
        try {
          validatorStorageLocation = deserializeValidatorStorageLocation(
            helios.ListData.fromCbor(helios.hexToBytes(utxos[0].inline_datum))
          );
        } catch (e) {
          // Most likely, the UTXO Datum is malformed.
          continue;
        }
        if (validatorStorageLocation.validator.toHex() !== validator.toHex()) {
          continue;
        }

        const signedAddress = ethers
          .verifyMessage(
            hashValidatorStorageLocation(validatorStorageLocation).toBuffer(),
            validatorStorageLocation.signature ?? ""
          )
          .toLowerCase();

        if (
          signedAddress !== validatorStorageLocation.validator.toEvmAddress()
        ) {
          continue;
        }

        return validatorStorageLocation;
      } catch (e) {
        console.warn(
          `[WARN] Failed to fetch location: ` + (e.message as string)
        );
      }
    }
  }

  return undefined;
}
