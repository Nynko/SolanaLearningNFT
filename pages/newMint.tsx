import {
  Button,
  Text,
  HStack,
  Image,
  Container,
  VStack,
  Heading,
} from "@chakra-ui/react";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { NextPage } from "next";
import MainLayout from "@/components/MainLayout";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmiInstance } from "@/functions/useUmi";
import { CandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import {
  Metadata,
  fetchDigitalAsset,
} from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as web3 from "@solana/web3.js";

interface NewMintProps {
  mint: PublicKey;
}

const NewMint: NextPage<NewMintProps> = ({ mint }) => {
  console.log("mint: ", mint);

  const [metadata, setMetadata] = useState<any>();
  const { wallet } = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [isMinting, setIsMinting] = useState(false);

  const connection = useConnection().connection;
  const umi = useMemo(() => {
    if (!wallet) {
      return createUmiInstance(web3.Keypair.generate(), connection);
    }
    return createUmiInstance(wallet.adapter, connection);
  }, [connection, wallet]);

  useEffect(() => {
    // What this does is to allow us to find the NFT object
    // based on the given mint address
    fetchDigitalAsset(umi, umiPublicKey(mint)).then((asset) => {
      console.log(asset.metadata.uri);

      fetch(asset.metadata.uri)
        .then((res) => res.json())
        .then((metadata) => {
          setMetadata(metadata);
        });
    });
    console.log("metadata: ", metadata);
  }, [mint, umi, wallet]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {},
    []
  );

  return (
    <MainLayout>
      <Container>
        <VStack spacing={8}>
          <Heading
            color="white"
            as="h1"
            size="2xl"
            noOfLines={1}
            textAlign="center"
          >
            You minted a Buildoor!
          </Heading>

          <Text color="bodyText" fontSize="xl" textAlign="center">
            Each buildoor is randomly generated and can be staked to receive
            <Text as="b"> $BLD</Text> Use your <Text as="b"> $BLD</Text> to
            upgrade your buildoor and receive perks within the community!
          </Text>
        </VStack>
        {/* CODE */}
      </Container>
      <Container>
        <VStack spacing={8}>
          <Image
            src={metadata?.image ?? ""}
            alt=""
            width="256px"
            height="256px"
          />
          <Button
            bgColor="accent"
            color="white"
            maxWidth="380px"
            onClick={handleClick}
          >
            <HStack>
              <Text>stake my buildoor</Text>
              <ArrowForwardIcon />
            </HStack>
          </Button>
        </VStack>
      </Container>
    </MainLayout>
  );
};

NewMint.getInitialProps = async ({ query }) => {
  const { mint } = query;
  if (!mint) throw { error: "No mint" };

  try {
    const mintPubkey = new PublicKey(mint);
    return { mint: mintPubkey };
  } catch {
    throw { error: "Invalid mint" };
  }
};

export default NewMint;
