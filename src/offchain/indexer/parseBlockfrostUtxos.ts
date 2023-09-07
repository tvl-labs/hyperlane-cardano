import * as helios from "@hyperionbt/helios";

// TODO: Expose upstream
// Or simply add more Blockfrost API so we can exclusive use
// only Helios's API.
function parseValue(obj) {
  let value = new helios.Value();
  for (const item of obj) {
    const qty = BigInt(item.quantity);

    if (item.unit === "lovelace") {
      value = value.add(new helios.Value(qty));
    } else {
      const policyID = item.unit.substring(0, 56);
      const mph = helios.MintingPolicyHash.fromHex(policyID);

      const token = helios.hexToBytes(item.unit.substring(56));

      value = value.add(
        new helios.Value(0n, new helios.Assets([[mph, [[token, qty]]]]))
      );
    }
  }
  return value;
}

export function parseBlockfrostUtxo(utxo: any) {
  return new helios.TxInput(
    new helios.TxOutputId(helios.TxId.fromHex(utxo.tx_hash), utxo.output_index),
    new helios.TxOutput(
      new helios.Address(utxo.address),
      parseValue(utxo.amount),
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
