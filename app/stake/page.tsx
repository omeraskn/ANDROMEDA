"use client";

import { useAndromedaStore } from "@/zustand/andromeda";
import {
    Box,
    Button,
    Input,
    Text,
    VStack,
    HStack,
    Flex,
    Spacer,
    Center,
    Heading,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { ConnectWallet } from "@/modules/wallet";
import { toBase64 } from "@cosmjs/encoding";
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

const StakePage: React.FC = () => {
    const { client, isConnected, accounts } = useAndromedaStore();
    const [amount, setAmount] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [stakeResponse, setStakeResponse] = useState<string | null>(null);
    const [allowance, setAllowance] = useState<string>("0");
    const [showApprove, setShowApprove] = useState<boolean>(false);
    const [balance, setBalance] = useState<string>("0");
    const [reward, setReward] = useState<string>("0"); // Reward için state
    const { isOpen, onOpen, onClose } = useDisclosure(); // ConnectWallet popup
    const connectWalletRef = useRef(null);

    const contractAddress = process.env.NEXT_PUBLIC_STAKE_CONTRACT_ADDRESS;
    const tokenAddress =
        "andr1zx7gaydc0as5wa9nuefeuetm3g9xn2lyuzfnrgd4pqyz8vxpeq8qvvn56d";
    const senderAddress = "andr1tjryplhzr7zkpux80svn38crju8z8jywc620nm";

    useEffect(() => {
        const fetchAllowance = async () => {
            if (!client || !isConnected) return;

            try {
                const result = await client.queryContract(tokenAddress, {
                    allowance: { owner: senderAddress, spender: contractAddress },
                });
                setAllowance(result.allowance);
            } catch (error) {
                console.error("Error fetching allowance:", error);
            }
        };

        const fetchBalance = async () => {
            if (!client || !isConnected) return;

            try {
                const result = await client.queryContract(tokenAddress, {
                    balance: { address: senderAddress },
                });
                setBalance(result.balance);
            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        };

        const fetchReward = async () => {
            if (!client || !isConnected) return;

            try {
                const result = await client.queryContract(contractAddress, {
                    rewards: { address: senderAddress },
                });
                setReward(result.rewards);
            } catch (error) {
                console.error("Error fetching rewards:", error);
            }
        };

        fetchAllowance();
        fetchBalance();
        fetchReward();
    }, [client, isConnected, accounts]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputAmount = e.target.value;
        setAmount(inputAmount);

        // Kullanıcının girdiği miktar `allowance` ile karşılaştırılıyor
        const isAllowanceSufficient = Number(allowance) >= Number(inputAmount);
        setShowApprove(!isAllowanceSufficient);
    };

    const handleApprove = async () => {
        if (!client || !isConnected || !accounts[0]) {
            alert("Wallet not connected!");
            return;
        }

        try {
            setLoading(true);

            const increaseAllowanceMsg = {
                increase_allowance: {
                    spender: contractAddress,
                    amount: amount,
                },
            };

            const approveResult = await client.execute(
                tokenAddress,
                increaseAllowanceMsg
            );

            setStakeResponse(
                `Allowance Approved Successfully: ${JSON.stringify(approveResult)}`
            );
            setAllowance(amount); // Allowance güncelleniyor
            setShowApprove(false); // Artık `Approve` butonu yerine `Stake` butonu gösterilecek.
        } catch (error) {
            setStakeResponse(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStake = async () => {
        if (!client || !isConnected || !accounts[0]) {
            alert("Wallet not connected!");
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Geçerli bir miktar girin.");
            return;
        }

        try {
            setLoading(true);

            const hookMsg = { staketokens: {} };
            const encodedMsg = toBase64(
                new TextEncoder().encode(JSON.stringify(hookMsg))
            );
            console.log("Encoded Msg: ", encodedMsg);

            const stakeResult = await client.execute(
                contractAddress,
                {
                    receive: {
                        amount: amount,
                        msg: encodedMsg,
                    },
                },
                undefined,
                undefined,
                [{ amount: amount, denom: "cosmos" }]
            );
            setStakeResponse(`Staked Successfully: ${JSON.stringify(stakeResult)}`);
        } catch (error) {
            setStakeResponse(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };
    const handleUnstake = async () => {
        if (!client || !isConnected || !accounts[0]) {
            alert("Wallet not connected!");
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Geçerli bir miktar girin.");
            return;
        }
        try {
            setLoading(true);

            const unstakeResult = await client.execute(
                contractAddress,
                {
                    unstake: { amount: amount },
                }
            );

            setStakeResponse(
                `Unstaked Successfully: ${JSON.stringify(unstakeResult)}`
            );
        } catch (error) {
            setStakeResponse(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

      const handleMint = async () => {
        if (!client || !isConnected || !accounts[0]) {
            alert("Wallet not connected!");
            return;
        }
           try {
           setLoading(true);
              const mintResult = await client.execute(
               tokenAddress,
                  {
                   mint: {
                     recipient:senderAddress,
                     amount : "10000"
                   }
                  }
                );
                 setStakeResponse(`Minted Successfully: ${JSON.stringify(mintResult)}`);
              } catch (error){
               setStakeResponse(`Error : ${error}`);
              } finally {
                 setLoading(false);
              }
      }


    return (
        <Box
            backgroundImage="url('/background.jpg')"
            backgroundSize="cover"
            backgroundRepeat="no-repeat"
            minHeight="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <VStack spacing={6} width="100%">
                <Box
                    width="100%"
                    backgroundColor="white"
                    opacity={0.5}
                    px={8}
                    py={4}
                    position="fixed"
                    top={0}
                    zIndex={2} // Cüzdan popup'ının üstünde kalması için
                >
                    <HStack spacing={6}>
                        <Heading as="h3" size="lg">
                            Cosmostake
                        </Heading>
                        <Spacer />
                        <Text fontSize="lg">Rewards: {reward}</Text>
                        <Box ref={connectWalletRef}>
                            <ConnectWallet />
                            {isConnected ? null : (
                                <Button colorScheme={"green"} onClick={onOpen}>
                                    Connect Wallet
                                </Button>
                            )}
                        </Box>
                    </HStack>
                </Box>
                <Flex justifyContent="center" w="100%" mt="80px">
                    <Box
                        p={6}
                        maxW="md"
                        boxShadow="lg"
                        borderRadius="md"
                        backgroundColor="white"
                        opacity={0.8}
                        width="500px" // Genişliği Sabitliyoruz
                    >
                        <VStack spacing={4}>
                            <Center mt={4}>
                                <Text fontSize="2xl" fontWeight="bold">
                                    Stake COSMOS
                                </Text>
                            </Center>
                            {!isConnected && (
                                <Text fontSize="lg" color="red.500">
                                    Please connect your wallet to proceed.
                                </Text>
                            )}
                            <Input
                                placeholder="Enter amount"
                                value={amount}
                                onChange={handleAmountChange}
                            />
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="left"
                                width="100%"
                            >
                                Balance: {balance} tokens
                            </Text>
                            {showApprove ? (
                                <Button
                                    colorScheme="blue"
                                    onClick={handleApprove}
                                    isLoading={loading}
                                    width="100%"
                                    loadingText="Approving"
                                >
                                    Approve
                                </Button>
                            ) : (
                                <Button
                                    colorScheme="blue"
                                    onClick={handleStake}
                                    isLoading={loading}
                                    width="100%"
                                    loadingText="Staking"
                                >
                                    Stake
                                </Button>
                            )}
                            <Button
                                colorScheme="red"
                                onClick={handleUnstake}
                                isLoading={loading}
                                width="100%"
                                loadingText="Unstaking"
                            >
                                Unstake
                            </Button>

                            {stakeResponse && (
                                <Text
                                    fontSize="sm"
                                    color="green.500"
                                    wordBreak="break-word"
                                >
                                    {stakeResponse}
                                </Text>
                            )}
                        </VStack>
                    </Box>
                </Flex>
                {/* Yeni Mint Mesajı ve Butonu */}
                  <Box
                    p={6}
                    maxW="md"
                     boxShadow="lg"
                     borderRadius="md"
                    backgroundColor="white"
                    opacity={0.8}
                     width="500px"
                    >
                   <Center>
                      <Text fontSize={"lg"} fontWeight={"semibold"} >
                       You don't have any COSMOS ? Don't worry!
                       </Text>
                  </Center>
                     <Center mt={4}>
                        <Button colorScheme="purple" onClick={handleMint} isLoading={loading} loadingText={"Minting"}>
                           Mint COSMOS
                      </Button>
                     </Center>
                  </Box>

                <Box
                   p={6}
                    maxW="md"
                     boxShadow="lg"
                     borderRadius="md"
                    backgroundColor="white"
                    opacity={0.8}
                     width="500px" // Genişliği Sabitliyoruz
                    >
                    <Heading as="h3" size="lg" mb={4} textAlign={"center"}>
                        FAQs
                    </Heading>
                    <Accordion allowMultiple>
                        <AccordionItem>
                            <AccordionButton>
                                <Box as="span" flex="1" textAlign="left" fontWeight="bold">
                                    What is Cosmostake?
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                Cosmostake is a staking platform on Andromeda that allows users to stake their tokens and earn rewards.
                            </AccordionPanel>
                        </AccordionItem>

                        <AccordionItem>
                            <AccordionButton>
                                <Box as="span" flex="1" textAlign="left" fontWeight="bold">
                                    How do I stake my tokens?
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                To stake your tokens, enter the amount you
                                wish to stake in the input field and click the
                                "Stake" button.
                            </AccordionPanel>
                        </AccordionItem>

                        <AccordionItem>
                            <AccordionButton>
                                <Box as="span" flex="1" textAlign="left" fontWeight="bold">
                                    What are the rewards for staking?
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                Rewards are generated based on the
                                staking pool. The staking rewards will be
                                displayed on the dashboard.
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </Box>
            </VStack>
        </Box>
    );
};

export default StakePage;