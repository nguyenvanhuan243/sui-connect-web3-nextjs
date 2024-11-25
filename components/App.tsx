import {
  ConnectButton,
  useAccountBalance,
  useWallet,
  SuiChainId,
  ErrorCode,
} from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMemo } from "react";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { Buffer } from "buffer";

const sampleNft = new Map([
  [
    "sui:devnet",
    "0xafee4e75841ee36b7057f99d5a7358073cf4c72e269a8c0d1ee6b7c9f6ffac16::devnet_nft::mint",
  ],
  [
    "sui:testnet",
    "0x5ea6aafe995ce6506f07335a40942024106a57f6311cb341239abf2c3ac7b82f::nft::mint",
  ],
  [
    "sui:mainnet",
    "0x5b45da03d42b064f5e051741b6fed3b29eb817c7923b83b92f37a1d2abf4fbab::nft::mint",
  ],
]);

function App() {
  const wallet = useWallet();
  const { balance } = useAccountBalance();
  const nftContractAddr = useMemo(() => {
    if (!wallet.chain) return "";
    return sampleNft.get(wallet.chain.id) ?? "";
  }, [wallet]);

  console.log("nftContractAddr #######", nftContractAddr)

  function uint8arrayToHex(value: Uint8Array | undefined) {
    if (!value) return "";
    // @ts-ignore
    return value.toString("hex");
  }

  async function handleExecuteMoveCall(target: string | undefined) {
    if (!target) return;

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: nftContractAddr,
        arguments: [
          tx.pure.string("Suiet NFT"),
          tx.pure.string("Suiet Sample NFT"),
          tx.pure.string(
            "https://xc6fbqjny4wfkgukliockypoutzhcqwjmlw2gigombpp2ynufaxa.arweave.net/uLxQwS3HLFUailocJWHupPJxQsli7aMgzmBe_WG0KC4"
          ),
        ],
      });
      const resData = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      console.log("executeMoveCall success", resData);
      alert("executeMoveCall succeeded (see response in the console)");
    } catch (e) {
      console.error("executeMoveCall failed", e);
      alert("executeMoveCall failed (see response in the console)");
    }
  }

  async function handleSignMsg() {
    if (!wallet.account) return;
    try {
      const msg = "Hello world!";
      const msgBytes = new TextEncoder().encode(msg);
      const result = await wallet.signPersonalMessage({
        message: msgBytes,
      });
      const verifyResult = await wallet.verifySignedMessage(
        result,
        wallet.account.publicKey
      );
      console.log("verify signedMessage", verifyResult);
      if (!verifyResult) {
        alert(`signMessage succeed, but verify signedMessage failed`);
      } else {
        alert(`signMessage succeed, and verify signedMessage succeed!`);
      }
    } catch (e) {
      console.error("signMessage failed", e);
      alert("signMessage failed (see response in the console)");
    }
  }

  const handleSignTxnAndVerifySignature = async (contractAddress: string) => {
    const txn = new Transaction();
    txn.moveCall({
      target: contractAddress as any,
      arguments: [
        txn.pure.string("Suiet NFT"),
        txn.pure.string("Suiet Sample NFT"),
        txn.pure.string(
          "https://xc6fbqjny4wfkgukliockypoutzhcqwjmlw2gigombpp2ynufaxa.arweave.net/uLxQwS3HLFUailocJWHupPJxQsli7aMgzmBe_WG0KC4"
        ),
      ],
    });
    txn.setSender(wallet.account?.address as string);

    try {
      const signedTxn = await wallet.signTransaction({
        transaction: txn,
      });

      console.log(`Sign and verify txn:`);
      console.log("--wallet: ", wallet.adapter?.name);
      console.log("--account: ", wallet.account?.address);
      const publicKey = wallet.account?.publicKey;
      if (!publicKey) {
        console.error("no public key provided by wallet");
        return;
      }
      console.log("-- publicKey: ", publicKey);
      const pubKey = new Ed25519PublicKey(publicKey);
      console.log("-- signed txnBytes: ", signedTxn.bytes);
      console.log("-- signed signature: ", signedTxn.signature);
      const txnBytes = new Uint8Array(Buffer.from(signedTxn.bytes, "base64"));
      const isValid = await pubKey.verifyTransaction(txnBytes, signedTxn.signature);
      console.log("-- use pubKey to verify transaction: ", isValid);
      if (!isValid) {
        alert(`signTransaction succeed, but verify transaction failed`);
      } else {
        alert(`signTransaction succeed, and verify transaction succeed!`);
      }
    } catch (e) {
      console.error("signTransaction failed", e);
      alert("signTransaction failed (see response in the console)");
    }
  };

  const chainName = (chainId: string | undefined) => {
    switch (chainId) {
      case SuiChainId.MAIN_NET:
        return "Mainnet";
      case SuiChainId.TEST_NET:
        return "Testnet";
      case SuiChainId.DEV_NET:
        return "Devnet";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel={"noreferrer"}>
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a
          href="https://github.com/suiet/wallet-kit"
          target="_blank"
          rel={"noreferrer"}
        >
          <img src={"/suiet-logo.svg"} className="logo" alt="Suiet logo" />
        </a>
      </div>
      <h1>Vite + Suiet Kit</h1>
      <div className="card">
        <ConnectButton
          onConnectError={(error) => {
            if (error.code === ErrorCode.WALLET__CONNECT_ERROR__USER_REJECTED) {
              console.warn(
                "user rejected the connection to " + error.details?.wallet
              );
            } else {
              console.warn("unknown connect error: ", error);
            }
          }}
        />

        {!wallet.connected ? (
          <p>Connect DApp with Suiet wallet from now!</p>
        ) : (
          <div>
            <div>
              <p>current wallet: {wallet.adapter?.name}</p>
              <p>
                wallet status:{" "}
                {wallet.connecting
                  ? "connecting"
                  : wallet.connected
                  ? "connected"
                  : "disconnected"}
              </p>
              <p>wallet address: {wallet.account?.address}</p>
              <p>current network: {wallet.chain?.name}</p>
              <p>wallet balance: {String(balance)} SUI</p>
              <p>
                wallet publicKey: {uint8arrayToHex(wallet.account?.publicKey)}
              </p>
            </div>
            <div className={"btn-group"} style={{ margin: "8px 0" }}>
              {nftContractAddr && (
                <button onClick={() => handleExecuteMoveCall(nftContractAddr)}>
                  Mint {chainName(wallet.chain?.id)} NFT
                </button>
              )}
              <button onClick={handleSignMsg}>signMessage</button>
              {nftContractAddr && (
                <button onClick={() => handleSignTxnAndVerifySignature(nftContractAddr)}>
                  Sign & Verify Transaction
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and Suiet logos to learn more
      </p>
    </div>
  );
}

export default App;
