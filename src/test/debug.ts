import { type UTxO } from '@hyperionbt/helios';

export function convertUtxoToJson(utxo: UTxO) {
  return {
    txId: utxo.txId.hex,
    lovelace: utxo.value.lovelace.toString(),
    value: utxo.value.assets.mintingPolicies.map((h) => {
      return {
        mph: h.hex,
        tokens: utxo.value.assets.getTokens(h).map(([nameBytes, valueInt]) => ({
          name: nameBytes.hex.toString(),
          value: valueInt.value.toString()
        }))
      };
    })
  }
}
