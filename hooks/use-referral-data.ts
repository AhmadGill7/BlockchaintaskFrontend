"use client";

import { useState, useEffect, useCallback } from "react";
import { EnhancedReferralService, type ReferralStats, type CommissionTransaction, type ReferralData } from "@/lib/enhanced-referral-service";
import { useContract } from "@/hooks/use-contract";

export function useReferralData(walletAddress: string | null) {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    conversionRate: 0,
    topPerformers: [],
    monthlyEarnings: 0,
    weeklyEarnings: 0,
  });

  const [commissionHistory, setCommissionHistory] = useState<CommissionTransaction[]>([]);
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralService = EnhancedReferralService.getInstance();
  
  // Get contract data for additional insights
  const { 
    userInfo, 
    formatPrice, 
    userPurchases,
    error: contractError 
  } = useContract(walletAddress || undefined);

  const fetchReferralData = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all referral data in parallel
      const [stats, history, referrals] = await Promise.all([
        referralService.fetchReferralStats(walletAddress),
        referralService.fetchCommissionHistory(walletAddress),
        referralService.fetchReferralData(walletAddress),
      ]);

      setReferralStats(stats);
      setCommissionHistory(history);
      setReferralData(referrals);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching referral data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, referralService]);

  // Fetch data on mount and when wallet address changes
  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  // Set up real-time updates (polling every 30 seconds)
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      fetchReferralData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchReferralData, walletAddress]);

  // Enhance stats with contract data when available
  const enhancedStats = {
    ...referralStats,
    // Add contract-based data if available
    contractTotalPurchases: userInfo ? parseFloat(formatPrice(userInfo.totalSpent)) : 0,
    contractTotalCommissions: userInfo ? parseFloat(formatPrice(userInfo.totalCommissions)) : 0,
    contractPurchaseCount: userInfo ? Number(userInfo.purchaseCount) : 0,
    contractEligibleForDraw: userInfo ? userInfo.eligibleForDraw : false,
  };

  const processCommission = async (
    referrerWallet: string,
    refereeWallet: string,
    purchaseAmount: number,
    productId: string,
    transactionHash: string
  ) => {
    try {
      const commission = await referralService.processCommission(
        referrerWallet,
        refereeWallet,
        purchaseAmount,
        productId,
        transactionHash
      );
      
      // Refresh data after processing commission
      await fetchReferralData();
      
      return commission;
    } catch (error) {
      throw error;
    }
  };

  const registerReferral = async (
    referrerWallet: string,
    refereeWallet: string,
    refereeEmail: string,
    refereeName: string
  ) => {
    try {
      const referral = await referralService.registerReferral(
        referrerWallet,
        refereeWallet,
        refereeEmail,
        refereeName
      );
      
      // Refresh data after registering referral
      await fetchReferralData();
      
      return referral;
    } catch (error) {
      throw error;
    }
  };

  return {
    referralStats: enhancedStats,
    commissionHistory,
    referralData,
    isLoading,
    error: error || contractError,
    refreshData: fetchReferralData,
    processCommission,
    registerReferral,
    referralService,
  };
}
