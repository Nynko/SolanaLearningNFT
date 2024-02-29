import * as web3 from "@solana/web3.js";
import { initializeKeypair } from "./initializeKeypair";

import * as fs from "fs";
import { toMetaplexFile } from "@metaplex-foundation/js";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  percentAmount,
  generateSigner,
} from "@metaplex-foundation/umi";
import {
  mplTokenMetadata,
  createV1,
  TokenStandard,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import { nftStorageUploader } from "@metaplex-foundation/umi-uploader-nft-storage";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createUmiInstance } from "@/functions/useUmi";
import { useMemo } from "react";

const TOKEN_NAME = "BUILD";
const TOKEN_SYMBOL = "BLD";
const TOKEN_DESCRIPTION = "A token for buildoors";
const TOKEN_IMAGE_NAME = "LogoFST.png";
const TOKEN_IMAGE_PATH = `tokens/bld/assets/${TOKEN_IMAGE_NAME}`;

async function createBldToken(
  connection: web3.Connection,
  payerWeb3: web3.Keypair
) {
  const umi = useMemo(() => {
    return createUmiInstance(payerWeb3, connection);
  }, [connection, payerWeb3]);
  const payer = createSignerFromKeypair(umi, fromWeb3JsKeypair(payerWeb3));

  // Read image file
  const imageBuffer = fs.readFileSync(TOKEN_IMAGE_PATH);
  const file = toMetaplexFile(imageBuffer, TOKEN_IMAGE_NAME);
  const imageUri = await umi.uploader.upload([file]);

  // Upload the rest of offchain metadata
  const uri = await umi.uploader.uploadJson({
    name: TOKEN_NAME,
    description: TOKEN_DESCRIPTION,
    image: imageUri,
  });

  const mint = generateSigner(umi);

  // Finding out the address where the metadata is stored
  const metadataPda = findMetadataPda(umi, { mint: mint.publicKey });

  console.log("mint: ", mint.publicKey.toString());

  const sig = await createV1(umi, {
    metadata: metadataPda,
    mint: mint,
    authority: payer,
    name: TOKEN_NAME,
    uri,
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(sig.signature);
  console.log("signature:", signature[0]);

  fs.writeFileSync(
    "tokens/bld/cache.json",
    JSON.stringify({
      mint: mint.publicKey.toString(),
      imageUri: imageUri,
      metadataUri: uri,
      tokenMetadata: metadataPda.toString(),
      metadataTransaction: signature[0],
    })
  );
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  const payer = await initializeKeypair(connection);

  await createBldToken(connection, payer);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
