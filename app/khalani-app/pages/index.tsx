import * as helios from "@hyperionbt/helios";
import * as React from "react";

type CardanoWallet = "nami" | "eternl";

declare global {
  interface Window {
    cardano: {
      nami: {
        enable: () => Promise<helios.Cip30Handle>;
      };
      eternl: {
        enable: () => Promise<helios.Cip30Handle>;
      };
    };
  }
}

export default function Home() {
  const [selectedWallet, setSelectedWallet] =
    React.useState<CardanoWallet>("nami");
  const [heliosWallet, setHeliosWallet] =
    React.useState<helios.Cip30Wallet | null>(null);
  const [usdcBalance, setUsdcBalance] = React.useState(0);
  const [redeemAmount, setRedeemAmount] = React.useState(0);

  async function connectWallet() {
    const rawWallet = await window.cardano[selectedWallet].enable();
    const heliosWallet = new helios.Cip30Wallet(rawWallet);
    setHeliosWallet(heliosWallet);
    refreshBalance(heliosWallet);
  }

  async function refreshBalance(heliosWallet: helios.Cip30Wallet) {
    const mphKhalani = await fetch(
      "http://localhost:3001/api/khalani/mph"
    ).then((r) => r.json());
    const utxos = await heliosWallet.utxos;
    let balance = 0;
    for (const utxo of utxos) {
      const khalaniTokens = utxo.value.assets.getTokens(
        new helios.MintingPolicyHash(mphKhalani.mph)
      );
      for (const [tokenName, tokenValue] of khalaniTokens) {
        if (tokenName.hex === helios.bytesToHex(helios.textToBytes("USDC"))) {
          balance += Number(tokenValue.value) / 1_000_000;
        }
      }
    }
    setUsdcBalance(balance);
    setTimeout(() => refreshBalance(heliosWallet), 3000);
  }

  async function redeem() {
    if (!heliosWallet) {
      return alert("Please connect wallet first");
    }
    const usedAddresses = await heliosWallet.usedAddresses;
    const { tx } = await fetch(
      "http://localhost:3001/api/khalani/buildOutboundTx",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: usedAddresses[0].toBech32(),
          redeemAmount,
        }),
      }
    ).then((r) => r.json());
    const heliosTx = helios.Tx.fromCbor(helios.hexToBytes(tx));
    heliosTx.addSignatures(await heliosWallet.signTx(heliosTx));
    const txId = await heliosWallet.submitTx(heliosTx);
    console.log(txId.hex);
    alert(`Redeeming in tx ${txId.hex}`);
  }

  return (
    <>
      <h1>Khalani</h1>
      <h2>Wallet</h2>
      <select
        onChange={(e) => setSelectedWallet(e.target.value as CardanoWallet)}
      >
        <option value="nami">Nami</option>
        <option value="eternl">Eternl</option>
      </select>
      <button id="btn-connect-wallet" onClick={connectWallet}>
        Connect
      </button>
      <h2>Balance</h2>
      <div>
        USDC: <span>{usdcBalance}</span>
      </div>
      <div>
        <input
          type="number"
          onChange={(e) =>
            setRedeemAmount(parseInt(e.target.value) * 1_000_000)
          }
        />
        <button onClick={redeem}>Redeem</button>
      </div>
    </>
  );
}
