import * as helios from "@hyperionbt/helios";
import { getProgramOutbox } from "../../onchain/programs";
import fetch from "node-fetch";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../blockfrost/blockfrost";
import { parseBlockfrostUtxos } from "./parseBlockfrostUtxos";
import { deserializeMessage, type Message } from "../message";

export interface OutboxUtxo {
  utxo: helios.TxInput;
  message?: Message;
}

export async function getOutboxUtxos(
  outboxAuthToken: string
): Promise<OutboxUtxo[]> {
  const addressOutbox = helios.Address.fromHash(
    getProgramOutbox().validatorHash
  ).toBech32();

  const utxosResponse: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressOutbox}/utxos/${outboxAuthToken}`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  return parseBlockfrostUtxos(utxosResponse).map(parseOutboxUtxo);
}

function parseOutboxUtxo(utxo: helios.TxInput): OutboxUtxo {
  const datum = JSON.parse(utxo.origOutput.getDatumData().toSchemaJson()).list;
  let message: Message | undefined;
  if (datum.length > 1) {
    message = deserializeMessage(datum[1].fields[0].list);
  }
  return {
    utxo,
    message,
  };
}
