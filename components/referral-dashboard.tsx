"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TrendingUp,
  DollarSign,
  Copy,
  Share2,
  Gift,
  Star,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Link,
} from "lucide-react"
import { useReferralData } from "@/hooks/use-referral-data"
import { EnhancedReferralService, type CommissionTransaction } from "@/lib/enhanced-referral-service"

interface ReferralDashboardProps {
  walletAddress: string | null
  userTier: string
  sendTransaction: (to: string, amount: string) => Promise<string>
  onCommissionEarned: (amount: number) => void
}

export function ReferralDashboard({
  walletAddress,
  userTier,
  sendTransaction,
  onCommissionEarned,
}: ReferralDashboardProps) {
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [isProcessingCommission, setIsProcessingCommission] = useState(false)

  // Use the new real-time referral data hook
  const {
    referralStats,
    commissionHistory,
    referralData,
    isLoading,
    error,
    refreshData,
    processCommission,
    registerReferral,
    referralService,
  } = useReferralData(walletAddress)

  useEffect(() => {
    if (walletAddress) {
      const code = referralService.generateReferralCode(walletAddress)
      setReferralCode(code)
      setReferralLink(`${window.location.origin}/signup?ref=${code}`)
    }
  }, [walletAddress, referralService])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Web3 Commerce",
          text: "Join me on Web3 Commerce and start earning with crypto!",
          url: referralLink,
        })
      } catch (error) {
        copyToClipboard(referralLink)
      }
    } else {
      copyToClipboard(referralLink)
    }
  }

  const tierMultiplier = referralService.getTierMultiplier(userTier)

  const getCommissionStatusBadge = (status: CommissionTransaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading referral data: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Referral Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : referralStats.totalReferrals}
            </div>
            <p className="text-xs text-muted-foreground">{referralStats.activeReferrals} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${referralStats.totalCommissions.toFixed(4)} ETH`}
            </div>
            <p className="text-xs text-muted-foreground">
              {referralStats.pendingCommissions.toFixed(4)} ETH pending
            </p>
            {referralStats.contractTotalCommissions > 0 && (
              <p className="text-xs text-green-600">
                Contract: {referralStats.contractTotalCommissions.toFixed(4)} ETH
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${referralStats.conversionRate.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">Referrals who purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Bonus</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${((tierMultiplier - 1) * 100).toFixed(0)}%`}
            </div>
            <p className="text-xs text-muted-foreground">{userTier} tier bonus</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits Alert */}
      {tierMultiplier > 1 && (
        <Alert>
          <Gift className="h-4 w-4" />
          <AlertDescription>
            As a {userTier} member, you earn {((tierMultiplier - 1) * 100).toFixed(0)}% bonus on all referral
            commissions!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="share">Share & Earn</TabsTrigger>
          <TabsTrigger value="history">Commission History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Performance</CardTitle>
                <CardDescription>Your referral program statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Referrals</span>
                    <span className="font-medium">
                      {referralStats.activeReferrals}/{referralStats.totalReferrals}
                    </span>
                  </div>
                  <Progress
                    value={
                      referralStats.totalReferrals > 0
                        ? (referralStats.activeReferrals / referralStats.totalReferrals) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Commission Rate</span>
                    <Badge variant="secondary">10% + {((tierMultiplier - 1) * 100).toFixed(0)}% bonus</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next Payout</span>
                    <span className="text-sm font-medium">Instant</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Tier</span>
                    <Badge variant="outline">{userTier}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Earn commissions through referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Share Your Link</h4>
                      <p className="text-xs text-muted-foreground">
                        Share your unique referral link with friends and followers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-secondary/10 text-secondary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">They Sign Up</h4>
                      <p className="text-xs text-muted-foreground">
                        New users create accounts using your referral link
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-accent/10 text-accent">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Earn Commissions</h4>
                      <p className="text-xs text-muted-foreground">
                        Get 10% + tier bonus on their purchases, paid instantly
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="share">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Share Your Referral Link
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={isLoading}
                  className="ml-auto"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </CardTitle>
              <CardDescription>
                Earn 10% commission on every purchase made by your referrals. Current tier: <span className="font-semibold text-primary">{userTier}</span>
                {referralStats.contractTotalCommissions > 0 && (
                  <span className="ml-2 text-green-600">
                    (Contract verified: {referralStats.contractTotalCommissions.toFixed(4)} ETH earned)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your Referral Link</Label>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly />
                  <Button onClick={() => copyToClipboard(referralLink)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button onClick={shareReferralLink} variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Referral Code</Label>
                <div className="flex gap-2">
                  <Input value={referralCode.toUpperCase()} readOnly />
                  <Button onClick={() => copyToClipboard(referralCode.toUpperCase())}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Share on social media, forums, or directly with friends. The more you share, the more you earn!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=Join me on Web3 Commerce and start earning with crypto! ${referralLink}`,
                      "_blank",
                    )
                  }
                >
                  Share on Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
                      "_blank",
                    )
                  }
                >
                  Share on LinkedIn
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Commission History
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={isLoading}
                  className="ml-auto"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </CardTitle>
              <CardDescription>
                Track all your referral commissions and payouts
                {referralStats.contractTotalCommissions > 0 && (
                  <span className="ml-2 text-green-600">
                    (Smart contract total: {referralStats.contractTotalCommissions.toFixed(4)} ETH)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading commission history...</p>
                </div>
              ) : commissionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No commissions yet. Start sharing your referral link!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissionHistory.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-secondary/10 text-secondary">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Commission Earned</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(commission.date).toLocaleDateString()} • {commission.commissionRate * 100}% of {commission.purchaseAmount} ETH
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium text-secondary">{commission.commissionAmount.toFixed(4)} ETH</p>
                          {getCommissionStatusBadge(commission.status)}
                        </div>
                        {commission.transactionHash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(`https://etherscan.io/tx/${commission.transactionHash}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed analytics of your referral performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Commission per Referral</span>
                    <span className="text-sm font-medium">
                      {referralStats.totalReferrals > 0
                        ? (referralStats.totalCommissions / referralStats.totalReferrals).toFixed(4)
                        : "0.0000"}{" "}
                      ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-sm font-medium">{referralStats.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <span className="text-sm font-medium">{referralStats.totalCommissions.toFixed(4)} ETH</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Benefits</CardTitle>
                <CardDescription>Unlock higher commissions with tier upgrades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bronze</span>
                    <Badge variant={userTier === "Bronze" ? "default" : "outline"}>10%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Silver</span>
                    <Badge variant={userTier === "Silver" ? "default" : "outline"}>12%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gold</span>
                    <Badge variant={userTier === "Gold" ? "default" : "outline"}>15%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platinum</span>
                    <Badge variant={userTier === "Platinum" ? "default" : "outline"}>20%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
