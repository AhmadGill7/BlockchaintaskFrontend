"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useState } from "react";
import { useChainValidation } from "@/hooks/use-chain-validation";
import { REQUIRED_CHAIN_ID } from "@/lib/wagmi-config";
import abi from "./Abi.json";

// Contract ABI
const CONTRACT_ABI = abi;

// Contract address on BSC testnet
const CONTRACT_ADDRESS = "0xA39bC71CF47AE2C84C7868b0DE83eeBAddb270Fd";

// Types
export interface ContractProduct {
  id: bigint;
  name: string;
  price: bigint;
  active: boolean;
  totalSold: bigint;
}

export interface User {
  wallet: string;
  totalSpent: bigint;
  totalCommissions: bigint;
  purchaseCount: bigint;
  eligibleForDraw: boolean;
  lastPurchaseTime: bigint;
}

export interface Purchase {
  id: bigint;
  productId: bigint;
  productName: string;
  amount: bigint;
  buyer: string;
  referrer: string;
  commission: bigint;
  timestamp: bigint;
}

export interface DrawWinner {
  winner: string;
  prize: bigint;
  position: bigint;
  round: bigint;
  timestamp: bigint;
}

export interface ContractStats {
  totalUsers: bigint;
  totalPurchases: bigint;
  totalProducts: bigint;
  eligibleForDraw: bigint;
  contractBalance: bigint;
  totalDraws: bigint;
}

export function useContract(userAddress?: string) {
  const [error, setError] = useState<string | null>(null);
  const { canInteractWithContract, isWrongChain, requiredChainName, currentChainId } =
    useChainValidation();
  const chainId = useChainId();

  // Disable contract interactions if on wrong chain
  const contractInteractionsEnabled = canInteractWithContract;

  // Additional validation function for critical operations
  const validateChainBeforeTransaction = () => {
    const currentChain = chainId || currentChainId;
    if (currentChain !== REQUIRED_CHAIN_ID) {
      throw new Error(`Transaction blocked: Currently on chain ${currentChain}, but BSC Testnet (${REQUIRED_CHAIN_ID}) is required. Please switch networks in your wallet.`);
    }
  };

  // Read contract functions
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAllProducts",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: activeProducts,
    isLoading: isLoadingActiveProducts,
    error: activeProductsError,
    refetch: refetchActiveProducts,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getActiveProducts",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: contractStats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getStats",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: productCount,
    isLoading: isLoadingProductCount,
    error: productCountError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "productCount",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: contractBalance,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getContractBalance",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: recentPurchases,
    isLoading: isLoadingRecentPurchases,
    error: recentPurchasesError,
    refetch: refetchRecentPurchases,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRecentPurchases",
    args: [BigInt(10)], // Get last 10 purchases
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: drawHistory,
    isLoading: isLoadingDrawHistory,
    error: drawHistoryError,
    refetch: refetchDrawHistory,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDrawHistory",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  const {
    data: latestDraw,
    isLoading: isLoadingLatestDraw,
    error: latestDrawError,
    refetch: refetchLatestDraw,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getLatestDraw",
    query: {
      enabled: contractInteractionsEnabled,
    },
  });

  // Get user purchases
  const {
    data: userPurchases,
    isLoading: isLoadingUserPurchases,
    error: userPurchasesError,
    refetch: refetchUserPurchases,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserPurchases",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress && contractInteractionsEnabled,
    },
  });

  // Get user info
  const {
    data: userInfo,
    isLoading: isLoadingUserInfo,
    error: userInfoError,
    refetch: refetchUserInfo,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserInfo",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress && contractInteractionsEnabled,
    },
  });

  // Get user referrer
  const {
    data: userReferrer,
    isLoading: isLoadingUserReferrer,
    error: userReferrerError,
    refetch: refetchUserReferrer,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getReferrer",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress && contractInteractionsEnabled,
    },
  });

  // Check if user is eligible for draw
  const {
    data: isUserEligibleForDraw,
    isLoading: isLoadingDrawEligibility,
    error: drawEligibilityError,
    refetch: refetchDrawEligibility,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isEligibleForDraw",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress && contractInteractionsEnabled,
    },
  });

  // Write contract functions
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Purchase product
  const purchaseProduct = async (productId: number, price: string) => {
    if (!contractInteractionsEnabled) {
      const errorMsg = isWrongChain
        ? `Please switch to ${requiredChainName} to make purchases`
        : "Please connect your wallet to make purchases";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Additional real-time chain validation
    try {
      validateChainBeforeTransaction();
    } catch (chainError: any) {
      setError(chainError.message);
      throw chainError;
    }

    setError(null);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "purchaseProduct",
        args: [BigInt(productId)],
        value: parseEther(price),
        chainId: REQUIRED_CHAIN_ID, // Force transaction to BSC Testnet
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Register user with referrer
  const registerUser = async (referrerAddress: string) => {
    if (!contractInteractionsEnabled) {
      const errorMsg = isWrongChain
        ? `Please switch to ${requiredChainName} to register`
        : "Please connect your wallet to register";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Additional real-time chain validation
    try {
      validateChainBeforeTransaction();
    } catch (chainError: any) {
      setError(chainError.message);
      throw chainError;
    }

    setError(null);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerUser",
        args: [referrerAddress as `0x${string}`],
        chainId: REQUIRED_CHAIN_ID, // Force transaction to BSC Testnet
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add product (admin function)
  const addProduct = async (name: string, price: string) => {
    if (!contractInteractionsEnabled) {
      const errorMsg = isWrongChain
        ? `Please switch to ${requiredChainName} to add products`
        : "Please connect your wallet to add products";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Additional real-time chain validation
    try {
      validateChainBeforeTransaction();
    } catch (chainError: any) {
      setError(chainError.message);
      throw chainError;
    }

    setError(null);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addProduct",
        args: [name, parseEther(price)],
        chainId: REQUIRED_CHAIN_ID, // Force transaction to BSC Testnet
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update product (admin function)
  const updateProduct = async (
    productId: number,
    name: string,
    price: string,
    active: boolean
  ) => {
    if (!contractInteractionsEnabled) {
      const errorMsg = isWrongChain
        ? `Please switch to ${requiredChainName} to update products`
        : "Please connect your wallet to update products";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Additional real-time chain validation
    try {
      validateChainBeforeTransaction();
    } catch (chainError: any) {
      setError(chainError.message);
      throw chainError;
    }

    setError(null);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "updateProduct",
        args: [BigInt(productId), name, parseEther(price), active],
        chainId: REQUIRED_CHAIN_ID, // Force transaction to BSC Testnet
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Execute lucky draw (admin function)
  const executeLuckyDraw = async () => {
    if (!contractInteractionsEnabled) {
      const errorMsg = isWrongChain
        ? `Please switch to ${requiredChainName} to execute draws`
        : "Please connect your wallet to execute draws";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Additional real-time chain validation
    try {
      validateChainBeforeTransaction();
    } catch (chainError: any) {
      setError(chainError.message);
      throw chainError;
    }

    setError(null);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "executeLuckyDraw",
        chainId: REQUIRED_CHAIN_ID, // Force transaction to BSC Testnet
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Format products data
  const formatProducts = (rawProducts: any[]): ContractProduct[] => {
    if (!rawProducts) return [];
    return rawProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      active: product.active,
      totalSold: product.totalSold || BigInt(0),
    }));
  };

  // Format purchases data
  const formatPurchases = (rawPurchases: any[]): Purchase[] => {
    if (!rawPurchases) return [];
    return rawPurchases.map((purchase) => ({
      id: purchase.id,
      productId: purchase.productId,
      productName: purchase.productName,
      amount: purchase.amount,
      buyer: purchase.buyer,
      referrer: purchase.referrer,
      commission: purchase.commission,
      timestamp: purchase.timestamp,
    }));
  };

  // Format draw winners data
  const formatDrawWinners = (rawWinners: any[]): DrawWinner[] => {
    if (!rawWinners) return [];
    return rawWinners.map((winner) => ({
      winner: winner.winner,
      prize: winner.prize,
      position: winner.position,
      round: winner.round,
      timestamp: winner.timestamp,
    }));
  };

  // Format contract stats
  const formatStats = (rawStats: any): ContractStats | null => {
    if (!rawStats) return null;
    return {
      totalUsers: rawStats.totalUsers,
      totalPurchases: rawStats.totalPurchases,
      totalProducts: rawStats.totalProducts,
      eligibleForDraw: rawStats.eligibleForDraw,
      contractBalance: rawStats.contractBalance,
      totalDraws: rawStats.totalDraws,
    };
  };

  // Format price from wei to ether
  const formatPrice = (price: bigint): string => {
    return formatEther(price);
  };

  // Check if user has purchased a product
  const hasPurchasedProduct = (productId: number): boolean => {
    if (!userPurchases || !Array.isArray(userPurchases)) return false;
    return userPurchases.some((purchaseId) => {
      // We need to get the purchase details and check the productId
      // For now, we'll implement a simpler version
      return false; // This will be enhanced when we get purchase details
    });
  };

  return {
    // Contract data
    products: products ? formatProducts(products as any[]) : [],
    activeProducts: activeProducts
      ? formatProducts(activeProducts as any[])
      : [],
    productCount,
    contractBalance,
    contractStats: contractStats ? formatStats(contractStats) : null,
    recentPurchases: recentPurchases
      ? formatPurchases(recentPurchases as any[])
      : [],
    drawHistory: drawHistory ? formatDrawWinners(drawHistory as any[]) : [],
    latestDraw: latestDraw ? formatDrawWinners(latestDraw as any[]) : [],

    // User-specific data
    userPurchases: userPurchases as bigint[] | undefined,
    userInfo: userInfo as User | undefined,
    userReferrer: userReferrer as string | undefined,
    isUserEligibleForDraw: isUserEligibleForDraw as boolean | undefined,

    // Loading states
    isLoadingProducts,
    isLoadingActiveProducts,
    isLoadingProductCount,
    isLoadingBalance,
    isLoadingStats,
    isLoadingRecentPurchases,
    isLoadingDrawHistory,
    isLoadingLatestDraw,
    isLoadingUserPurchases,
    isLoadingUserInfo,
    isLoadingUserReferrer,
    isLoadingDrawEligibility,

    // Write operations
    purchaseProduct,
    registerUser,
    addProduct,
    updateProduct,
    executeLuckyDraw,
    isWritePending,
    isConfirming,
    isConfirmed,
    transactionHash: hash,

    // Helper functions
    formatPrice,
    hasPurchasedProduct,

    // Refetch functions
    refetchProducts,
    refetchActiveProducts,
    refetchStats,
    refetchRecentPurchases,
    refetchDrawHistory,
    refetchLatestDraw,
    refetchUserPurchases,
    refetchUserInfo,
    refetchUserReferrer,
    refetchDrawEligibility,

    // Chain validation
    canInteractWithContract: contractInteractionsEnabled,
    isWrongChain,
    requiredChainName,

    // Error handling
    error:
      error ||
      productsError?.message ||
      activeProductsError?.message ||
      productCountError?.message ||
      balanceError?.message ||
      statsError?.message ||
      recentPurchasesError?.message ||
      drawHistoryError?.message ||
      latestDrawError?.message ||
      writeError?.message ||
      userPurchasesError?.message ||
      userInfoError?.message ||
      userReferrerError?.message ||
      drawEligibilityError?.message,
    clearError: () => setError(null),
  };
}
