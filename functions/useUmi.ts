import {
  publicKey,
  some,
  generateSigner,
  transactionBuilder,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";

import * as web3 from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { Umi } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { nftStorageUploader } from "@metaplex-foundation/umi-uploader-nft-storage";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  WalletAdapter,
  walletAdapterIdentity,
} from "@metaplex-foundation/umi-signer-wallet-adapters";
import type { Connection as Web3JsConnection } from "@solana/web3.js";

export function createUmiInstance(
  userWallet: web3.Keypair | WalletAdapter,
  connection: Web3JsConnection
): Umi {
  const umi = createUmi(connection);

  if (userWallet instanceof web3.Keypair) {
    const userUmi = createSignerFromKeypair(umi, fromWeb3JsKeypair(userWallet));
    umi.identity = userUmi;
    umi.payer = userUmi;
  } else {
    umi.use(walletAdapterIdentity(userWallet));
  }

  umi.use(
    nftStorageUploader({
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDAxMjk3MzM4RTMxOWZGQzA1NkZFM2ZiRjFFNjMyNkNhNzFhYmZEMGQiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwNzQ4OTk4OTU5NiwibmFtZSI6IkZTVCJ9.SLrBxfMftVSKkdwW4N2N31FGlDR-II92wNkoc-7BUCA",
    })
  );
  umi.use(mplTokenMetadata());
  umi.use(mplCandyMachine());

  return umi;
}
