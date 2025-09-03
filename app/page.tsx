"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Ensure component is mounted before accessing localStorage
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const redirectUser = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined") return

        // Check if user is logged in
        const token = localStorage.getItem("token")
        if (token) {
          console.log("User logged in, redirecting to dashboard")
          router.push("/dashboard")
        } else {
          console.log("User not logged in, redirecting to login")
          router.push("/login")
        }
      } catch (err) {
        console.error("Error during redirect:", err)
        setError("Failed to load application")
        setIsRedirecting(false)
      }
    }

    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(redirectUser, 100)

    return () => clearTimeout(timer)
  }, [router, isMounted])

  // Don't render anything until component is mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}