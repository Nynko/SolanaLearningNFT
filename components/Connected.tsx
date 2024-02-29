import {
  FC,
  MouseEventHandler,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
  Image,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  CandyMachine,
  fetchCandyGuard,
  fetchCandyMachine,
  mintFromCandyMachineV2,
  mintV2,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmiInstance } from "@/functions/useUmi";
import {
  generateSigner,
  transactionBuilder,
  publicKey as umiPublicKey,
  some,
} from "@metaplex-foundation/umi";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import { base58 } from "@metaplex-foundation/umi/serializers";
import MainLayout from "./MainLayout";
import * as web3 from "@solana/web3.js";

const Connected: FC = () => {
  const router = useRouter();
  const { wallet, connect } = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [isMinting, setIsMinting] = useState(false);

  const connection = useConnection().connection;
  const umi = useMemo(() => {
    if (!wallet) {
      return createUmiInstance(web3.Keypair.generate(), connection);
    }
    return createUmiInstance(wallet.adapter, connection);
  }, [connection, wallet]);

  const _fetchCandyMachine = async (umi: any) => {
    const candyMachinePublicKey = umiPublicKey(
      "GPQHTnzooVfFFaezDnhYTMNjgScN3HZTTRRntkYjLbeZ"
    );
    const fetchedCandyMachine = await fetchCandyMachine(
      umi,
      candyMachinePublicKey
    );

    setCandyMachine(fetchedCandyMachine);
    console.log("candymachine", fetchedCandyMachine);
  };

  useEffect(() => {
    _fetchCandyMachine(umi);
  }, [umi]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      if (!wallet?.adapter.connected) return;

      if (event.defaultPrevented || !candyMachine) return;

      if (candyMachine.items) {
      }

      try {
        setIsMinting(true);
        const nftMint = generateSigner(umi);

        const candyGuard = await fetchCandyGuard(
          umi,
          candyMachine.mintAuthority
        );

        console.log("candyGuard", candyGuard);

        const result = await transactionBuilder()
          .add(setComputeUnitLimit(umi, { units: 800_000 }))
          .add(
            mintV2(umi, {
              candyGuard: candyGuard.publicKey,
              payer: umi.identity,
              candyMachine: candyMachine.publicKey,
              nftMint,
              collectionMint: candyMachine.collectionMint,
              collectionUpdateAuthority: candyMachine.authority,
              tokenStandard: candyMachine.tokenStandard,
              mintArgs: {
                mintLimit: some({ id: 1 }),
              },
            })
            // mintFromCandyMachineV2(umi, {
            //   payer: umi.identity,
            //   candyMachine: candyMachine.publicKey,
            //   mintAuthority: umi.identity,
            //   nftOwner: umi.identity.publicKey,
            //   nftMint,
            //   collectionMint: candyMachine.collectionMint,
            //   collectionUpdateAuthority: candyMachine.authority,
            // })
          )
          .sendAndConfirm(umi);

        const signature = base58.deserialize(result.signature);

        console.log(signature);
        router.push(`/newMint?mint=${nftMint.publicKey.toString()}`);
      } catch (error) {
        console.log(error);
        alert(error);
      } finally {
        setIsMinting(false);
      }
    },
    [wallet, candyMachine]
  );
  return (
    <VStack spacing={20}>
      <Container>
        <VStack spacing={8}>
          <Heading
            color="white"
            as="h1"
            size="2xl"
            noOfLines={1}
            textAlign="center"
          >
            Welcome Buildoor.
          </Heading>

          <Text color="bodyText" fontSize="xl" textAlign="center">
            Each buildoor is randomly generated and can be staked to receive
            <Text as="b"> $BLD</Text> Use your <Text as="b"> $BLD</Text> to
            upgrade your buildoor and receive perks within the community!
          </Text>
        </VStack>
      </Container>

      <HStack spacing={10}>
        <Image src="avatar1.png" alt="" width="256px" height="256px" />
        <Image src="avatar2.png" alt="" width="256px" height="256px" />
        <Image src="avatar3.png" alt="" width="256px" height="256px" />
        <Image src="avatar4.png" alt="" width="256px" height="256px" />
        <Image src="avatar5.png" alt="" width="256px" height="256px" />
      </HStack>

      <Button onClick={handleClick} bgColor="accent" color="white" maxW="380px">
        <HStack>
          <Text>mint buildoor</Text>
          <ArrowForwardIcon />
        </HStack>
      </Button>
    </VStack>
  );
};

export default Connected;
