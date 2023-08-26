import { type UTxO } from "@hyperionbt/helios";

export function convertUtxoToJson(utxo: UTxO) {
  return {
    txId: utxo.txId.hex,
    utxoId: utxo.utxoIdx,
    lovelace: utxo.value.lovelace.toString(),
    value: utxo.value.assets.mintingPolicies.map((h) => {
      return {
        mph: h.hex,
        tokens: utxo.value.assets.getTokens(h).map(([nameBytes, valueInt]) => ({
          name: nameBytes.hex.toString(),
          value: valueInt.value.toString(),
        })),
      };
    }),
    datum: getDatum(utxo)
  };
}

function getDatum(utxo: UTxO): string | null {
  try {
    const data = utxo.origOutput.getDatumData();
    const json = data.toSchemaJson();
    return JSON.parse(json)
  } catch (e) {
    // `TxOutput.getDatumData` throws an Error on empty Datum.
    return null
  }
}
