import type React from "react"
import type { Metadata, Viewport } from "next"
import { Autour_One } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { AppProvider } from "@/contexts/app-context"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import "./globals.css"

const autourOne = Autour_One({ subsets: ["latin"], weight: "400", variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Precept - Smart Sports Coach",
  description: "AI-powered sports skills coach with motion analysis and personalized training",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Precept",
  },
  icons: {
    icon: "/icon-192.jpg",
    apple: "/icon-512.jpg",
  },
  openGraph: {
    title: "Precept - Smart Sports Coach",
    description: "AI-powered sports skills coach with motion analysis and personalized training",
    type: "website",
    siteName: "Precept",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precept - Smart Sports Coach",
    description: "AI-powered sports skills coach with motion analysis and personalized training",
  },
}

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${autourOne.variable} font-sans antialiased bg-background text-foreground selection:bg-primary/30`}>
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
        <Analytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
