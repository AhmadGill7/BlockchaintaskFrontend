"use client"

import { useState, useEffect, Suspense } from "react"
import { useWeb3 } from "@/hooks/use-web3"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-vert-xi-76.vercel.app'

function SignupForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [referralCode, setReferralCode] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const { address, isConnected, connectWallet, isConnecting, error: walletError } = useWeb3()

    useEffect(() => {
        const refCode = searchParams.get("ref")
        if (refCode) {
            setReferralCode(refCode)
        }
    }, [searchParams])

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (!isConnected || !address) {
            setError("Please connect your wallet before signing up.")
            setIsLoading(false)
            return
        }

        try {
            // Validate passwords match
            if (password !== confirmPassword) {
                setError("Passwords do not match")
                setIsLoading(false)
                return
            }

            // Prepare signup data for database registration
            const userData = {
                fullname: name,
                email,
                password,
                walletAddress: address,
                referralCode: referralCode || undefined
            }

            console.log("Registering user in database...")
            const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.message || "Registration failed")
                setIsLoading(false)
                return
            }

            console.log("Registration successful!")

            // Store user session and redirect
            localStorage.setItem("token", data.data.token)
            localStorage.setItem("user", JSON.stringify({
                email: data.data.user.email,
                name: data.data.user.fullname,
                walletAddress: data.data.user.walletAddress,
                isLoggedIn: true,
                ...data.data.user
            }))

            router.push("/dashboard")

        } catch (error) {
            setError("Registration failed. Please try again.")
            console.error('Signup error:', error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Web3 Commerce</h1>
                    <p className="text-muted-foreground mt-2">Create your account</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Account</CardTitle>
                        <CardDescription>Join the Web3 commerce revolution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSignup} className="space-y-4">
                            {/* Wallet Connect */}
                            <div className="space-y-2">
                                <Label>Wallet Address</Label>
                                {isConnected && address ? (
                                    <Input value={address} readOnly className="font-mono" />
                                ) : (
                                    <Button type="button" onClick={() => connectWallet()} disabled={isConnecting} className="w-full">
                                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                                    </Button>
                                )}
                                {walletError && <div className="text-xs text-red-500">{walletError}</div>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Enter your full name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Create a password"
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referral">Referral Code (Optional)</Label>
                                <Input
                                    id="referral"
                                    name="referral"
                                    placeholder="Enter referral code"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    )
}
