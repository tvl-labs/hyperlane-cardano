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
  utxo: helios.UTxO;
  message?: Message;
}

export async function getOutboxUtxos(
  outboxAuthToken: string
): Promise<OutboxUtxo[]> {
  const addressOutbox = helios.Address.fromValidatorHash(
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

function parseOutboxUtxo(utxo: helios.UTxO): OutboxUtxo {
  const datum = utxo.origOutput.getDatumData();
  let message: Message | undefined;
  if (datum.list.length > 1) {
    message = deserializeMessage(
      new helios.ListData(datum.list[1].fields[0].list)
    );
  }
  return {
    utxo,
    message,
  };
}
