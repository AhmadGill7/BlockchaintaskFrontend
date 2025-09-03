"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, AlertCircle, Loader2, ExternalLink, ShoppingCart, Gift } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  category: string
}

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  walletAddress: string | null
  onPurchase: (productId: string, price: number) => Promise<string>
  isProcessing: boolean
}

export function PurchaseModal({
  isOpen,
  onClose,
  product,
  walletAddress,
  onPurchase,
  isProcessing,
}: PurchaseModalProps) {
  const [purchaseStep, setPurchaseStep] = useState<"confirm" | "processing" | "success" | "error">("confirm")
  const [transactionHash, setTransactionHash] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handlePurchase = async () => {
    if (!product) return

    setPurchaseStep("processing")
    setError("")

    try {
      const txHash = await onPurchase(product.id, product.price)
      setTransactionHash(txHash)
      setPurchaseStep("success")
    } catch (err: any) {
      setError(err.message || "Purchase failed")
      setPurchaseStep("error")
    }
  }

  const handleClose = () => {
    setPurchaseStep("confirm")
    setTransactionHash("")
    setError("")
    onClose()
  }

  if (!product) return null

  const commission = product.price * 0.1 // 10% referral commission

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {purchaseStep === "confirm" && "Confirm Purchase"}
            {purchaseStep === "processing" && "Processing Transaction"}
            {purchaseStep === "success" && "Purchase Successful!"}
            {purchaseStep === "error" && "Purchase Failed"}
          </DialogTitle>
          <DialogDescription>
            {purchaseStep === "confirm" && "Review your purchase details before confirming"}
            {purchaseStep === "processing" && "Please wait while we process your transaction"}
            {purchaseStep === "success" && "Your purchase has been completed successfully"}
            {purchaseStep === "error" && "There was an issue processing your purchase"}
          </DialogDescription>
        </DialogHeader>

        {purchaseStep === "confirm" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-2xl font-bold">{product.price} ETH</span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Features included:</h4>
                    <ul className="space-y-1">
                      {product.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your wallet</span>
                      <span className="font-mono">
                        {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lucky draw entry</span>
                      <Badge variant="secondary" className="text-xs">
                        <Gift className="h-3 w-3 mr-1" />
                        Included
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This transaction will be processed on the blockchain. Make sure you have enough ETH for gas fees.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handlePurchase} className="flex-1" disabled={isProcessing}>
                Confirm Purchase
              </Button>
            </div>
          </div>
        )}

        {purchaseStep === "processing" && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold mb-2">Processing your purchase...</h3>
                <p className="text-sm text-muted-foreground">
                  Please confirm the transaction in your wallet and wait for blockchain confirmation.
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product</span>
                    <span>{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{product.price} ETH</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {purchaseStep === "success" && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-semibold mb-2">Purchase Completed!</h3>
                <p className="text-sm text-muted-foreground">
                  Your {product.name} has been activated and you're now eligible for the lucky draw.
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Hash</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-primary"
                      onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Etherscan
                    </Button>
                  </div>
                  <div className="text-xs font-mono bg-muted p-2 rounded break-all">{transactionHash}</div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Congratulations! You're now eligible for the next lucky draw. Check the Lucky Draw tab for more details.
              </AlertDescription>
            </Alert>

            <Button onClick={handleClose} className="w-full">
              Continue Shopping
            </Button>
          </div>
        )}

        {purchaseStep === "error" && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold mb-2">Purchase Failed</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                Close
              </Button>
              <Button onClick={() => setPurchaseStep("confirm")} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
