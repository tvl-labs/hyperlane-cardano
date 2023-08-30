import * as helios from "@hyperionbt/helios";

export function parseBlockfrostUtxo(utxo: any) {
  return new helios.UTxO(
    helios.TxId.fromHex(utxo.tx_hash),
    BigInt(utxo.output_index),
    new helios.TxOutput(
      new helios.Address(utxo.address),
      helios.BlockfrostV0.parseValue(utxo.amount),
      utxo.inline_datum != null
        ? helios.Datum.inline(
            helios.UplcData.fromCbor(helios.hexToBytes(utxo.inline_datum))
          )
        : null
    )
  );
}

export function parseBlockfrostUtxos(utxos: any) {
  if (!Array.isArray(utxos)) {
    throw new Error(
      `Expected UTXOs, but received ${JSON.stringify(utxos, null, 2)}`
    );
  }
  return utxos.map(parseBlockfrostUtxo);
}
