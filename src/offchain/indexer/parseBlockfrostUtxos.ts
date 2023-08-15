import * as helios from '@hyperionbt/helios';

export async function parseBlockfrostUtxos(
  utxos: any,
  address: helios.Address
) {
  if (!Array.isArray(utxos)) {
    throw new Error(`Expected UTXOs, but received ${JSON.stringify(utxos, null, 2)}`)
  }
  return utxos.map((utxo) => {
    return new helios.UTxO(
      helios.TxId.fromHex(utxo.tx_hash),
      BigInt(utxo.output_index),
      new helios.TxOutput(
        address,
        helios.BlockfrostV0.parseValue(utxo.amount),
        helios.Datum.inline(
          helios.UplcData.fromCbor(helios.hexToBytes(utxo.inline_datum))
        )
      )
    );
  })
}
