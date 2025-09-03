"use client";

import { useReadContract } from "wagmi";
import { useState, useEffect, useRef, useMemo } from "react";

const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_purchaseId",
        type: "uint256",
      },
    ],
    name: "getPurchase",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "productId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "productName",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "buyer",
            type: "address",
          },
          {
            internalType: "address",
            name: "referrer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "commission",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct ECommerceContract.Purchase",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CONTRACT_ADDRESS = "0xA39bC71CF47AE2C84C7868b0DE83eeBAddb270Fd";

export interface PurchaseDetail {
  id: bigint;
  productId: bigint;
  amount: bigint;
  buyer: string;
  referrer: string;
  timestamp: bigint;
  transactionHash: string;
}

export function usePurchaseDetails(purchaseIds: bigint[]) {
  const [purchases, setPurchases] = useState<PurchaseDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevPurchaseIdsRef = useRef<string>("");

  useEffect(() => {
    // Convert bigint array to string for comparison
    const currentPurchaseIdsStr = purchaseIds
      .map((id) => id.toString())
      .join(",");

    // Only proceed if the purchase IDs have actually changed
    if (currentPurchaseIdsStr === prevPurchaseIdsRef.current) {
      return;
    }

    prevPurchaseIdsRef.current = currentPurchaseIdsStr;

    const fetchPurchaseDetails = async () => {
      if (!purchaseIds || purchaseIds.length === 0) {
        setPurchases([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // This would ideally be done with multicall for efficiency
        // For now, we'll simulate the data structure
        const purchaseDetails: PurchaseDetail[] = purchaseIds.map(
          (id, index) => ({
            id,
            productId: BigInt(index + 1), // Mock product IDs
            amount: BigInt("50000000000000000"), // Mock amount (0.05 ETH in wei)
            buyer: "0x0000000000000000000000000000000000000000",
            referrer: "0x0000000000000000000000000000000000000000",
            timestamp: BigInt(Date.now() - index * 86400000), // Mock timestamps
            transactionHash: `0x${index.toString().padStart(64, "0")}`,
          })
        );

        setPurchases(purchaseDetails);
      } catch (err: any) {
        setError(err.message);
        setPurchases([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [purchaseIds]); // Keep the dependency but add internal comparison

  return {
    purchases,
    isLoading,
    error,
  };
}
