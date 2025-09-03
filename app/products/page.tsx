"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWeb3 } from "@/hooks/use-web3"
import { useContract, ContractProduct } from "@/hooks/use-contract"
import { useChainValidation } from "@/hooks/use-chain-validation"
import { ChainValidationModal } from "@/components/chain-validation-modal"
import { CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  category: string
}

export default function ProductsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const {
    address,
    isConnected,
    balance,
    balanceSymbol,
    sendEther,
    isSending,
    error: web3Error,
  } = useWeb3()

  const {
    isWrongChain,
    showChainModal,
    setShowChainModal,
    canInteractWithContract,
    currentChainName,
    requiredChainName
  } = useChainValidation()

  const {
    products: contractProducts,
    isLoadingProducts,
    purchaseProduct,
    isWritePending,
    isConfirming,
    isConfirmed,
    transactionHash,
    formatPrice,
    refetchProducts,
    userPurchases,
    userInfo,
    isLoadingUserPurchases,
    refetchUserPurchases,
    error: contractError,
  } = useContract(address)

 
  // Get purchased product IDs for easy lookup
  const purchasedProductIds = new Set(
    userPurchases?.map(purchase => purchase.productId.toString())
  )

  // Convert contract products to display format
  const products = contractProducts
    .filter(product => product.active) // Only show active products
    .map(product => {
      const isPurchased = purchasedProductIds.has(product.id.toString())
      return {
        id: product.id.toString(),
        name: product.name,
        description: `Premium product from smart contract`,
        price: parseFloat(formatPrice(product.price)),
        features: [
          "Blockchain secured purchase",
          "Automatic processing",
          "Lucky draw eligibility",
          "Referral commission eligible"
        ],
        category: "blockchain",
        contractId: product.id,
        isPurchased,
      }
    })
  console.log('contractProducts', contractProducts)
  const checkAuth = useCallback(() => {
    // Check if user is logged in - must be inside useEffect for client-side only access
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.replace("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (!parsedUser.isLoggedIn) {
        router.replace("/login")
        return
      }

      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      router.replace("/login")
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handlePurchase = async (product: any) => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    if (isWrongChain) {
      alert(`Wrong network detected! Please switch to ${requiredChainName} in your wallet before making a purchase.`)
      setShowChainModal(true)
      return
    }

    if (!canInteractWithContract) {
      alert(`Cannot interact with contract. Please ensure you're connected to ${requiredChainName}.`)
      return
    }

    if (parseFloat(balance) < product.price) {
      alert("Insufficient balance")
      return
    }

    try {
      console.log('>>>>>>>', Number(product.id),)
      console.log('>>>>>><<<<<>', product.price.toString())
      await purchaseProduct(Number(product.id), product.price.toString())

      // The transaction will be handled by the contract hook
      // Success will be indicated by isConfirmed state
    } catch (error: any) {
      alert(`Purchase failed: ${error.message}`)
    }
  }

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && transactionHash) {
      alert(`Purchase successful! Transaction: ${transactionHash}`)
      refetchProducts() // Refresh the products data
      refetchUserPurchases() // Refresh user purchases
      router.push("/dashboard")
    }
  }, [isConfirmed, transactionHash, router, refetchProducts, refetchUserPurchases])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Products</h1>
              <p className="text-muted-foreground">Browse and purchase products from the smart contract</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchProducts()}
              disabled={isLoadingProducts}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Chain Status Alert */}
      {isConnected && isWrongChain && (
        <div className="container mx-auto px-4 py-2">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Wrong Network Detected:</strong> You're connected to {currentChainName} but this app requires {requiredChainName}. 
              Please switch networks in your wallet to make purchases.
              <Button 
                variant="link" 
                className="text-orange-800 underline p-0 ml-2 h-auto"
                onClick={() => setShowChainModal(true)}
              >
                Switch Now
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Wallet Connection Alert */}
      {!isConnected && (
        <div className="container mx-auto px-4 py-2">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Please connect your wallet to view and purchase products.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Web3 Error Alert */}
      {web3Error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{web3Error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Contract Error Alert */}
      {contractError && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Contract Error: {contractError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Wallet Connection Alert */}
      {!isConnected && (
        <div className="container mx-auto px-4 pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to purchase products. <Link href="/dashboard" className="underline">Go to Dashboard</Link>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Products */}
      <main className="container mx-auto px-4 py-8">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading products from smart contract...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No active products available from the smart contract.</p>
            <Button onClick={() => refetchProducts()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className={`relative ${product.isPurchased ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary">ID: {product.id}</Badge>
                      {product.isPurchased && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {product.description}
                    {product.isPurchased && (
                      <span className="block mt-1 text-green-600 font-medium">
                        ✓ You own this product
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">{product.price} {balanceSymbol}</div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Features:</h4>
                      <ul className="space-y-1">
                        {product.features.map((feature, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {product.isPurchased ? (
                      <Button className="w-full" variant="outline" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Already Purchased
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchase(product)}
                        className="w-full"
                        disabled={!isConnected || isWritePending || isConfirming || isWrongChain}
                      >
                        {isWritePending || isConfirming ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {isWritePending ? "Confirming..." : "Processing..."}
                          </>
                        ) : !isConnected ? (
                          "Connect Wallet to Purchase"
                        ) : isWrongChain ? (
                          `Switch to ${requiredChainName}`
                        ) : (
                          `Purchase for ${product.price} ${balanceSymbol}`
                        )}
                      </Button>
                    )}

                    {isConnected && !product.isPurchased && parseFloat(balance) < product.price && (
                      <div className="text-xs text-destructive">
                        Insufficient balance. You need {product.price} {balanceSymbol} but have {parseFloat(balance).toFixed(4)} {balanceSymbol}.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Chain Validation Modal */}
      <ChainValidationModal 
        open={showChainModal} 
        onOpenChange={setShowChainModal}
        force={isWrongChain && isConnected} // Force modal when connected to wrong chain
      />
    </div>
  )
}
