"use client"

import { useState, useEffect, useCallback } from "react"

declare global {
  interface Window {
    Paddle: {
      Environment: {
        set: (environment: string) => void
      }
      Initialize: (config: { token: string }) => void
      Checkout: {
        open: (config: {
          items: { priceId: string; quantity: number }[]
          customer?: { email?: string }
          customData?: Record<string, string>
          successCallback?: () => void
          closeCallback?: () => void
        }) => void
        update: (config: { transactionId: string }) => void
      }
    }
  }
}

export function usePaddle() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID
    if (!vendorId) {
      setError("Paddle not configured")
      setLoaded(true)
      return
    }

    if (window.Paddle) {
      setLoaded(true)
      return
    }

    const timeout = setTimeout(() => {
      setError("Paddle load timed out")
      setLoaded(true)
    }, 8000)

    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => {
      clearTimeout(timeout)
      const environment = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox"
      window.Paddle.Environment.set(environment)
      window.Paddle.Initialize({
        token: vendorId,
      })
      setLoaded(true)
    }
    script.onerror = () => {
      clearTimeout(timeout)
      setError("Failed to load Paddle")
      setLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      clearTimeout(timeout)
      script.remove()
    }
  }, [])

  const openCheckout = useCallback(
    (opts: {
      priceId: string
      customerEmail?: string
      userId?: string
      onSuccess?: () => void
    }) => {
      if (!window.Paddle) {
        setError("Paddle not loaded")
        return
      }

      window.Paddle.Checkout.open({
        items: [{ priceId: opts.priceId, quantity: 1 }],
        customer: opts.customerEmail ? { email: opts.customerEmail } : undefined,
        customData: opts.userId ? { userId: opts.userId } : undefined,
        successCallback: opts.onSuccess,
      })
    },
    [],
  )

  return { loaded, error, openCheckout }
}
