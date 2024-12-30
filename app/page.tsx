"use client";

import { ConnectWallet } from "@/modules/wallet";
import { Center, Image, Link, Text, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useAndromedaStore } from "@/zustand/andromeda";
import { useRouter } from "next/navigation";

interface Props {}

const Page: React.FC<Props> = () => {
    const { isConnected } = useAndromedaStore(); // Cüzdan bağlantısı durumunu al
    const router = useRouter(); // Yönlendirme işlemi için router kullanacağız

    useEffect(() => {
        // Eğer cüzdan bağlıysa, /stake sayfasına yönlendir
        if (isConnected) {
            router.push("/stake");
        }
    }, [isConnected, router]);

    return (
        <Center minH="100vh">
            <VStack spacing={3}>
                <Image src="/logo.png" w="6rem" />
                <Text fontSize="3xl" fontWeight="bold">
                    Andromeda Nextjs Starter Template
                </Text>
                <Text>
                    Click button to connect <b>Andromeda Testnet</b>.
                </Text>
                <Text fontWeight="light" mb="6">
                    Learn more about Andromeda&nbsp;
                    <Link isExternal href="https://docs.andromedaprotocol.io" color="blue" textDecoration="underline">
                        here
                    </Link>
                </Text>
                <ConnectWallet /> {/* Cüzdan bağlantısı burada yapılacak */}
            </VStack>
        </Center>
    );
};

export default Page;
