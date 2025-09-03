export interface ReferralData {
  referrerId: string
  refereeId: string
  refereeWallet: string
  referrerWallet: string
  joinDate: string
  totalPurchases: number
  totalCommissions: number
  isActive: boolean
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
}

export class ReferralService {
  private static instance: ReferralService
  private referrals: Map<string, ReferralData[]> = new Map()
  private commissions: CommissionTransaction[] = []

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService()
    }
    return ReferralService.instance
  }

  generateReferralCode(walletAddress: string): string {
    // Generate a unique referral code based on wallet address
    return walletAddress.slice(0, 8).toLowerCase()
  }

  validateReferralCode(code: string): boolean {
    // Check if referral code exists and is valid
    return code.length === 8 && /^[a-f0-9]+$/.test(code)
  }

  addReferral(referrerWallet: string, refereeWallet: string, refereeName: string): ReferralData {
    const referralData: ReferralData = {
      referrerId: this.generateReferralCode(referrerWallet),
      refereeId: this.generateReferralCode(refereeWallet),
      refereeWallet,
      referrerWallet,
      joinDate: new Date().toISOString().split("T")[0],
      totalPurchases: 0,
      totalCommissions: 0,
      isActive: true,
    }

    const existingReferrals = this.referrals.get(referrerWallet) || []
    existingReferrals.push(referralData)
    this.referrals.set(referrerWallet, existingReferrals)

    return referralData
  }

  async processCommission(
    referrerWallet: string,
    refereeWallet: string,
    purchaseAmount: number,
    sendTransaction: (to: string, amount: string) => Promise<string>,
  ): Promise<CommissionTransaction> {
    const commissionRate = 0.1 // 10%
    const commissionAmount = purchaseAmount * commissionRate

    const commission: CommissionTransaction = {
      id: Date.now().toString(),
      referrerId: this.generateReferralCode(referrerWallet),
      refereeId: this.generateReferralCode(refereeWallet),
      purchaseAmount,
      commissionAmount,
      commissionRate,
      transactionHash: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    }

    try {
      // Send commission to referrer's wallet
      const txHash = await sendTransaction(referrerWallet, commissionAmount.toString())
      commission.transactionHash = txHash
      commission.status = "completed"

      // Update referral data
      const referrals = this.referrals.get(referrerWallet) || []
      const referralIndex = referrals.findIndex((r) => r.refereeWallet === refereeWallet)
      if (referralIndex !== -1) {
        referrals[referralIndex].totalPurchases += purchaseAmount
        referrals[referralIndex].totalCommissions += commissionAmount
      }

      this.commissions.push(commission)
      return commission
    } catch (error) {
      commission.status = "failed"
      this.commissions.push(commission)
      throw error
    }
  }

  getReferralsByWallet(walletAddress: string): ReferralData[] {
    return this.referrals.get(walletAddress) || []
  }

  getCommissionHistory(walletAddress: string): CommissionTransaction[] {
    return this.commissions.filter((c) => c.referrerId === this.generateReferralCode(walletAddress))
  }

  getReferralStats(walletAddress: string): ReferralStats {
    const referrals = this.getReferralsByWallet(walletAddress)
    const commissions = this.getCommissionHistory(walletAddress)

    const totalReferrals = referrals.length
    const activeReferrals = referrals.filter((r) => r.isActive).length
    const totalCommissions = commissions
      .filter((c) => c.status === "completed")
      .reduce((sum, c) => sum + c.commissionAmount, 0)
    const pendingCommissions = commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.commissionAmount, 0)

    return {
      totalReferrals,
      activeReferrals,
      totalCommissions,
      pendingCommissions,
      conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
      topPerformers: [], // Would be populated from database in real implementation
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
}
