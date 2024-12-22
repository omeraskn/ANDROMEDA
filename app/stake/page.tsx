"use client";

import { useAndromedaStore } from "@/zustand/andromeda";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { ConnectWallet } from "@/modules/wallet";
import { toBase64 } from "@cosmjs/encoding";

const StakePage: React.FC = () => {
    const { client, isConnected, accounts } = useAndromedaStore();
    const [amount, setAmount] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [stakeResponse, setStakeResponse] = useState<string | null>(null);
    const [allowance, setAllowance] = useState<string>("0");
    const [showApprove, setShowApprove] = useState<boolean>(false);
    const [balance, setBalance] = useState<string>("0");

    const contractAddress = process.env.NEXT_PUBLIC_STAKE_CONTRACT_ADDRESS;
    const tokenAddress = "andr1zx7gaydc0as5wa9nuefeuetm3g9xn2lyuzfnrgd4pqyz8vxpeq8qvvn56d";
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

        fetchAllowance();
        fetchBalance();
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

            setStakeResponse(`Allowance Approved Successfully: ${JSON.stringify(approveResult)}`);
            setAllowance(amount); // Allowance güncelleniyor
            setShowApprove(false); // Artık `Approve` butonu yerine `Stake` butonu gösterilecek.
        } catch (error) {
            setStakeResponse(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStake = async () => {
        if (!client || !isConnected) {
            alert("Wallet not connected!");
            return;
        }
        try {
            setLoading(true);

            const hookMsg = { stake_tokens: {} };
            const encodedMsg = toBase64(new TextEncoder().encode(JSON.stringify(hookMsg)));
            console.log("Encoded Msg: ", encodedMsg);
            
            const stakeResult = await client.execute(
                contractAddress,
                hookMsg,
                undefined,
                undefined,
                [{ amount: amount, denom: "ucosmos" }]
            );
            setStakeResponse(`Staked Successfully: ${JSON.stringify(stakeResult)}`);
        } catch (error) {
            setStakeResponse(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={6} maxW="md" mx="auto" boxShadow="lg" borderRadius="md">
            <VStack spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    Stake Your Tokens
                </Text>
                {!isConnected && (
                    <Text fontSize="lg" color="red.500">
                        Please connect your wallet to proceed.
                    </Text>
                )}
                <Input
                    placeholder="Enter amount to stake"
                    value={amount}
                    onChange={handleAmountChange}
                />
                <Text fontSize="sm" color="gray.500" textAlign="left" width="100%">
                    Balance: {balance} tokens
                </Text>
                {showApprove ? (
                    <Button
                        colorScheme="blue"
                        onClick={handleApprove}
                        isLoading={loading}
                        width="100%"
                    >
                        Approve
                    </Button>
                ) : (
                    <Button
                        colorScheme="blue"
                        onClick={handleStake}
                        isLoading={loading}
                        width="100%"
                    >
                        Stake
                    </Button>
                )}
                <ConnectWallet />
                {stakeResponse && (
                    <Text fontSize="sm" color="green.500" wordBreak="break-word">
                        {stakeResponse}
                    </Text>
                )}
            </VStack>
        </Box>
    );
};

export default StakePage;
