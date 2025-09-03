"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useState, useEffect } from "react";

export function useWeb3() {
  const { address, isConnected } = useAccount();
  const {
    connect,
    connectors,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({
    address: address,
  });
  const {
    sendTransaction,
    data: hash,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [error, setError] = useState<string | null>(null);

  // Clear error when connection state changes
  useEffect(() => {
    if (isConnected) {
      setError(null);
    }
  }, [isConnected]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      setError(connectError.message);
    }
  }, [connectError]);

  // Handle send transaction errors
  useEffect(() => {
    if (sendError) {
      setError(sendError.message);
    }
  }, [sendError]);

  const connectWallet = async (connectorId?: string) => {
    setError(null);
    try {
      const connector = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : connectors[0]; // Default to first connector (usually injected/MetaMask)

      if (connector) {
        connect({ connector });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setError(null);
  };

  const sendEther = async (to: string, amount: string): Promise<string> => {
    setError(null);
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
      });

      // Return the transaction hash if available, otherwise return a promise
      return hash || "pending";
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet";
      case 167012:
        return "Kasplex Testnet";
      case 97:
        return "BSC Testnet";
      case 11155111:
        return "Sepolia Testnet";
      case 137:
        return "Polygon";
      case 56:
        return "BSC";
      default:
        return "Unknown Network";
    }
  };

  return {
    // Wallet state
    address,
    isConnected,
    chainId,
    balance: balanceData ? formatEther(balanceData.value) : "0",
    balanceSymbol: balanceData?.symbol || "ETH",

    // Connection methods
    connectWallet,
    disconnectWallet,
    connectors,
    isConnecting,

    // Transaction methods
    sendEther,
    isSending,
    isConfirming,
    isConfirmed,
    transactionHash: hash,

    // Utilities
    getNetworkName,
    error,
    clearError: () => setError(null),
  };
}
