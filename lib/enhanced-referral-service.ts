"use client";

import { useContract } from "@/hooks/use-contract";

export interface ReferralData {
  referrerId: string
  refereeId: string
  refereeWallet: string
  referrerWallet: string
  joinDate: string
  totalPurchases: number
  totalCommissions: number
  isActive: boolean
  refereeName?: string
  refereeEmail?: string
}

export interface CommissionTransaction {
  id: string
  referrerId: string
  refereeId: string
  purchaseAmount: number
  commissionAmount: number
  commissionRate: number
  transactionHash: string
  date: string
  status: "pending" | "completed" | "failed"
  productId?: string
  productName?: string
}

export interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  totalCommissions: number
  pendingCommissions: number
  conversionRate: number
  topPerformers: Array<{
    wallet: string
    name: string
    commissions: number
    referrals: number
  }>
  monthlyEarnings: number
  weeklyEarnings: number
}

export interface DatabaseReferralData {
  id: string
  referrerId: string
  refereeId: string
  referrerWallet: string
  refereeWallet: string
  refereeEmail: string
  refereeName: string
  joinDate: string
  totalPurchases: number
  totalCommissions: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export class EnhancedReferralService {
  private static instance: EnhancedReferralService
  private apiUrl = 'https://backend-vert-xi-76.vercel.app//api'

  static getInstance(): EnhancedReferralService {
    if (!EnhancedReferralService.instance) {
      EnhancedReferralService.instance = new EnhancedReferralService()
    }
    return EnhancedReferralService.instance
  }

  generateReferralCode(walletAddress: string): string {
    // Generate a unique referral code based on wallet address
    return walletAddress.slice(2, 10).toLowerCase() // Remove 0x and take 8 chars
  }

  validateReferralCode(code: string): boolean {
    // Check if referral code exists and is valid
    return code.length === 8 && /^[a-f0-9]+$/.test(code)
  }

  async fetchReferralData(walletAddress: string): Promise<ReferralData[]> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${this.apiUrl}/referrals/${walletAddress}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch referral data')
      }

      const data = await response.json()
      return data.referrals || []
    } catch (error) {
      console.error('Error fetching referral data:', error)
      return []
    }
  }

  async fetchCommissionHistory(walletAddress: string): Promise<CommissionTransaction[]> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${this.apiUrl}/referrals/${walletAddress}/commissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch commission history')
      }

      const data = await response.json()
      return data.commissions || []
    } catch (error) {
      console.error('Error fetching commission history:', error)
      return []
    }
  }

  async fetchReferralStats(walletAddress: string): Promise<ReferralStats> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${this.apiUrl}/referrals/${walletAddress}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch referral stats')
      }

      const data = await response.json()
      return data.stats || {
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        conversionRate: 0,
        topPerformers: [],
        monthlyEarnings: 0,
        weeklyEarnings: 0,
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        conversionRate: 0,
        topPerformers: [],
        monthlyEarnings: 0,
        weeklyEarnings: 0,
      }
    }
  }

  async processCommission(
    referrerWallet: string,
    refereeWallet: string,
    purchaseAmount: number,
    productId: string,
    transactionHash: string
  ): Promise<CommissionTransaction> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${this.apiUrl}/referrals/commission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerWallet,
          refereeWallet,
          purchaseAmount,
          productId,
          transactionHash,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process commission')
      }

      const data = await response.json()
      return data.commission
    } catch (error) {
      console.error('Error processing commission:', error)
      throw error
    }
  }

  async registerReferral(
    referrerWallet: string,
    refereeWallet: string,
    refereeEmail: string,
    refereeName: string
  ): Promise<ReferralData> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${this.apiUrl}/referrals/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerWallet,
          refereeWallet,
          refereeEmail,
          refereeName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to register referral')
      }

      const data = await response.json()
      return data.referral
    } catch (error) {
      console.error('Error registering referral:', error)
      throw error
    }
  }

  getTierMultiplier(tier: string): number {
    switch (tier.toLowerCase()) {
      case "bronze":
        return 1.0
      case "silver":
        return 1.2
      case "gold":
        return 1.5
      case "platinum":
        return 2.0
      default:
        return 1.0
    }
  }

  calculateBonusCommission(baseCommission: number, tier: string): number {
    const multiplier = this.getTierMultiplier(tier)
    return baseCommission * (multiplier - 1) // Only the bonus amount
  }

  // Contract integration helpers
  async getContractCommissions(userAddress: string, formatPrice: (price: bigint) => string) {
    // This would integrate with the smart contract to get commission data
    // For now, we'll return the database data
    return this.fetchCommissionHistory(userAddress)
  }
}
