"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { REQUIRED_CHAIN_ID, REQUIRED_CHAIN } from "@/lib/wagmi-config";

export function useChainValidation() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
  const [showChainModal, setShowChainModal] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  const isCorrectChain = chainId === REQUIRED_CHAIN_ID;
  const isWrongChain = isConnected && !isCorrectChain;

  // Auto-show modal when user connects to wrong chain
  useEffect(() => {
    if (isWrongChain && !hasShownWarning) {
      setShowChainModal(true);
      setHasShownWarning(true);
    }
  }, [isWrongChain, hasShownWarning]);

  // Reset warning flag when user switches to correct chain
  useEffect(() => {
    if (isCorrectChain) {
      setHasShownWarning(false);
      setShowChainModal(false);
    }
  }, [isCorrectChain]);

  const switchToBSCTestnet = async () => {
    try {
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (error) {
      console.error("Failed to switch chain:", error);
      
      // If switching fails, try to add the network manually
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`,
              chainName: REQUIRED_CHAIN.name,
              nativeCurrency: REQUIRED_CHAIN.nativeCurrency,
              rpcUrls: [REQUIRED_CHAIN.rpcUrls.default.http[0]],
              blockExplorerUrls: REQUIRED_CHAIN.blockExplorers ? [REQUIRED_CHAIN.blockExplorers.default.url] : undefined,
            }],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
    }
  };

  const getChainName = (chainId: number): string => {
    switch (chainId) {
      case 1: return "Ethereum Mainnet";
      case 56: return "BSC Mainnet"; 
      case 97: return "BSC Testnet";
      case 137: return "Polygon";
      case 80001: return "Polygon Mumbai";
      default: return `Chain ${chainId}`;
    }
  };

  return {
    isConnected,
    isCorrectChain,
    isWrongChain,
    currentChainId: chainId,
    currentChainName: getChainName(chainId || 0),
    requiredChainId: REQUIRED_CHAIN_ID,
    requiredChainName: REQUIRED_CHAIN.name,
    switchToBSCTestnet,
    isSwitching,
    switchError,
    showChainModal,
    setShowChainModal,
    canInteractWithContract: isConnected && isCorrectChain,
  };
}
