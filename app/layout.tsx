import type React from "react"
import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppProvider } from "@/contexts/app-context"
import { Sidebar } from "@/components/sidebar"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Precept - Smart Sports Coach",
  description: "AI-powered sports skills coach with motion analysis and personalized training",
  generator: "v0.app",
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
}

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans antialiased bg-background text-foreground selection:bg-primary/30`}>
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 md:ml-64 relative">
              {children}
            </div>
          </div>
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
