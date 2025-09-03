"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWeb3 } from "@/hooks/use-web3"
import { useContract } from "@/hooks/use-contract"
import {
    Wallet,
    ShoppingCart,
    Users,
    Gift,
    TrendingUp,
    Activity,
    Calendar,
    Clock,
    Copy,
    AlertCircle,
    CheckCircle,
    Loader2,
    LogOut,
    Star
} from "lucide-react"

const BACKEND_URL = process.env.BACKEND_URL || ""
interface User {
    name: string
    email: string
    referralCommissions: number
    luckyDrawStatus: "Eligible" | "Not Eligible"
    referralCount: number
    referralCode: string
    memberSince: string
    lastActivity: string
    tier: string
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const hasInitializedRef = useRef(false)
    const router = useRouter()
    const {
        address,
        isConnected,
        chainId,
        balance,
        balanceSymbol,
        connectWallet,
        disconnectWallet,
        connectors,
        isConnecting,
        getNetworkName,
        error: web3Error,
        clearError,
    } = useWeb3()

    // Contract integration
    const {
        products: contractProducts,
        isLoadingProducts,
        userPurchases,
        userInfo,
        formatPrice,
        error: contractError,
    } = useContract(address)

    // Get purchase details
    console.log('userPurchases', userPurchases)
    const checkAuth = useCallback(async () => {
        setIsLoading(true)

        const userData = localStorage.getItem("user")
        const token = localStorage.getItem("token")

        if (!userData || !token) {
            router.push("/login")
            setIsLoading(false)
            return
        }

        try {
            const parsedUser = JSON.parse(userData)
            if (!parsedUser.isLoggedIn) {
                router.push("/login")
                setIsLoading(false)
                return
            }

            setIsAuthenticated(true)

            // Fetch real user data from backend
            const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token || parsedUser.token}`,
                },
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setUser({
                        name: result.data?.fullname || parsedUser.name,
                        email: result.data?.email || parsedUser.email,
                        referralCommissions: result.data?.totalReferralCommissions || 0,
                        luckyDrawStatus: "Not Eligible",
                        referralCount: result.data?.referredUsers?.length || 0,
                        referralCode: result.data?.referralCode || 0,
                        memberSince: new Date(result.data?.createdAt).toLocaleDateString(),
                        lastActivity: new Date(result.data?.updatedAt).toLocaleDateString(),
                        tier: result.data?.membershipTier || "Bronze",
                    })
                } else {
                    // Fallback to stored user data
                    setUser({
                        name: parsedUser.name || "User",
                        email: parsedUser.email || "",
                        referralCommissions: 0,
                        luckyDrawStatus: "Not Eligible",
                        referralCount: 0,
                        referralCode: '',
                        memberSince: new Date().toLocaleDateString(),
                        lastActivity: new Date().toLocaleDateString(),
                        tier: "Bronze",
                    })
                }
            } else {
                // If API call fails due to invalid token, redirect to login
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("user")
                    localStorage.removeItem("token")
                    setIsAuthenticated(false)
                    setIsLoading(false)
                    router.push("/login")
                    return
                }

                // For other errors, fallback to stored user data
                setUser({
                    name: parsedUser.name || "User",
                    email: parsedUser.email || "",
                    referralCommissions: 0,
                    luckyDrawStatus: "Not Eligible",
                    referralCount: 0,
                    referralCode: '',
                    memberSince: new Date().toLocaleDateString(),
                    lastActivity: new Date().toLocaleDateString(),
                    tier: "Bronze",
                })
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error)

            // If there's an error parsing user data, redirect to login
            try {
                const userData = localStorage.getItem("user")
                if (userData) {
                    const parsedUser = JSON.parse(userData)
                    // Fallback to stored user data
                    setUser({
                        name: parsedUser.name || "User",
                        email: parsedUser.email || "",
                        referralCommissions: 0,
                        luckyDrawStatus: "Not Eligible",
                        referralCount: 0,
                        referralCode: '',
                        memberSince: new Date().toLocaleDateString(),
                        lastActivity: new Date().toLocaleDateString(),
                        tier: "Bronze",
                    })
                }
            } catch (parseError) {
                // If we can't parse user data, clear storage and redirect
                localStorage.removeItem("user")
                localStorage.removeItem("token")
                setIsAuthenticated(false)
                setIsLoading(false)
                router.push("/login")
                return
            }
        }

        setIsLoading(false)
    }, [])

    // Separate effect to update lucky draw status when purchases change
    useEffect(() => {
        if (user && userPurchases) {
            setUser(prevUser => prevUser ? {
                ...prevUser,
                luckyDrawStatus: userPurchases.length > 0 ? "Eligible" : "Not Eligible"
            } : null)
        }
    }, [userPurchases])

    useEffect(() => {
        let isMounted = true

        const initAuth = async () => {
            if (!hasInitializedRef.current && isMounted) {
                hasInitializedRef.current = true
                await checkAuth()
            }
        }

        initAuth()

        return () => {
            isMounted = false
        }
    }, []) // Empty dependency array - runs only once

    const handleLogout = useCallback(() => {

        // Navigate immediately
        router.push("/login")
        // Set a flag to prevent further state updates
        setIsLoading(true)

        // Clear storage first
        localStorage.removeItem("user")
        localStorage.removeItem("token")

        // Disconnect wallet
        disconnectWallet()

        // Clear state
        setUser(null)
        setIsAuthenticated(false)
    }, [router, disconnectWallet])

    const handleWalletConnect = async () => {
        clearError()
        await connectWallet()
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        // You can add a toast notification here
        alert("Copied to clipboard!")
    }

    // Show loading while checking authentication or user data
    if (isLoading || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        {isLoading ? "Authenticating..." : "Loading dashboard..."}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Web3 Commerce Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {!isConnected ? (
                            <Button
                                onClick={handleWalletConnect}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={isConnecting}
                            >
                                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                                {isConnecting ? "Connecting..." : "Connect Wallet"}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="flex items-center gap-2">
                                    <Wallet className="h-3 w-3" />
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {parseFloat(balance).toFixed(4)} {balanceSymbol}
                                </Badge>
                            </div>
                        )}
                        <Button onClick={handleLogout} variant="ghost" size="sm">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Web3 Error Alert */}
            {web3Error && (
                <div className="container mx-auto px-4 pt-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{web3Error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Network Warning */}
            {isConnected && chainId !== 1 && (
                <div className="container mx-auto px-4 pt-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            You're connected to {getNetworkName(chainId)}.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Dashboard */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user.name}!</h2>
                            <p className="text-muted-foreground">Manage your Web3 commerce activities</p>
                        </div>
                        <div className="text-right">
                            <Badge variant="outline" className="mb-2 flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {user.tier} Member
                            </Badge>
                            <p className="text-xs text-muted-foreground">Member since {user.memberSince}</p>
                        </div>
                    </div>

                    {/* Wallet Status Card */}
                    {isConnected && (
                        <Card className="mb-6">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                        <span className="font-medium">Wallet Connected</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={disconnectWallet}>
                                        Disconnect
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Address:</span>
                                        <p className="font-mono break-all">{address}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Balance:</span>
                                        <p className="font-medium">{parseFloat(balance).toFixed(4)} {balanceSymbol}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Network:</span>
                                        <p className="font-medium">{getNetworkName(chainId)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Progress Card */}
                    {/* <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Progress to Gold Tier</span>
                                <span className="text-sm text-muted-foreground">{user.nextTierProgress}%</span>
                            </div>
                            <Progress value={user.nextTierProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                Complete more purchases and referrals to unlock Gold benefits
                            </p>
                        </CardContent>
                    </Card> */}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {userInfo ? formatPrice(userInfo.totalSpent) : 0} {userInfo ? balanceSymbol : 'ETH'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {userInfo ? 'From smart contract' : 'Lifetime spending'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Referral Commissions</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {userInfo ? formatPrice(userInfo.totalCommissions) : user.referralCommissions} {userInfo ? balanceSymbol : 'ETH'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                From {user.referralCount} referrals
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucky Draw Status</CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {userInfo ? (userInfo.eligibleForDraw ? "Eligible" : "Not Eligible") : user.luckyDrawStatus}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {userInfo ? 'Smart contract status' : 'Current eligibility'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Referral Link</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-mono bg-muted p-2 rounded text-balance mb-2">
                                /signup?ref={user?.referralCode?.slice(0, 8) + '...'}
                            </div>
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => copyToClipboard(`${window.location.origin}/signup?ref=${user?.referralCode}`)}
                                disabled={!isConnected}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for different sections */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="products">Products</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Link href="/products">
                                        <Button className="w-full" disabled={!isConnected}>
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Browse Products
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Account Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Email</span>
                                        <span className="text-sm font-medium">{user.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Name</span>
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Member Since</span>
                                        <span className="text-sm font-medium">{user.memberSince}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="products">
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Products</CardTitle>
                                <CardDescription>
                                    {contractProducts.length > 0
                                        ? `${contractProducts.filter(p => p.active).length} products available from smart contract`
                                        : "Loading products from smart contract..."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contractError && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>Error loading products: {contractError}</AlertDescription>
                                    </Alert>
                                )}

                                {isLoadingProducts ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                        <p className="text-muted-foreground">Loading products from smart contract...</p>
                                    </div>
                                ) : contractProducts.filter(p => p.active).length === 0 ? (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground mb-4">No products available</p>
                                        <Link href="/products">
                                            <Button disabled={!isConnected}>
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Refresh Products
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {contractProducts.filter(p => p.active).slice(0, 4).map((product) => (
                                                <Card key={product.id.toString()}>
                                                    <CardHeader>
                                                        <CardTitle className="text-sm">{product.name}</CardTitle>
                                                        <CardDescription className="text-xs">
                                                            ID: {product.id.toString()}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-lg font-bold">
                                                                {formatPrice(product.price)} {balanceSymbol}
                                                            </span>
                                                            <Badge variant="outline">{product.name}</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            Blockchain verified product
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                        <div className="text-center pt-4">
                                            <Link href="/products">
                                                <Button disabled={!isConnected}>
                                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                                    Purchase Products ({contractProducts.filter(p => p.active).length})
                                                </Button>
                                            </Link>
                                            {!isConnected && (
                                                <p className="text-sm text-muted-foreground mt-2">Connect your wallet to purchase products</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="orders">
                        <Card>
                            <CardHeader>
                                <CardTitle>Purchase History</CardTitle>
                                <CardDescription>
                                    {userPurchases?.length ? `${userPurchases.length} purchases found` : "Your purchase history from smart contract"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                        <p className="text-muted-foreground">Loading purchase history...</p>
                                    </div>
                                ) : !userPurchases || userPurchases.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground mb-2">No purchases yet</p>
                                        <p className="text-sm text-muted-foreground mb-4">Start shopping to see your purchase history</p>
                                        <Link href="/products">
                                            <Button disabled={!isConnected}>
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Browse Products
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userPurchases?.map((purchase, index) => (
                                            <Card key={purchase.id.toString()}>
                                                <CardContent className="pt-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">Purchase #{purchase.id.toString()}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Product ID: {purchase.productId.toString()}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(Number(purchase.timestamp) * 1000).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold">
                                                                {formatPrice(purchase.amount)} {balanceSymbol}
                                                            </p>
                                                            <Badge variant="outline" className="text-xs">
                                                                Confirmed
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {userInfo && (
                                            <div className="border-t pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">Total Purchases:</span>
                                                    <span className="font-bold">
                                                        {formatPrice(userInfo.totalSpent)} {balanceSymbol}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <span>Total Orders:</span>
                                                    <span>{userInfo.purchaseCount.toString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
