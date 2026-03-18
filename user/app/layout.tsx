import type { Metadata, Viewport } from "next"
import { Geist_Mono, DM_Sans, Cormorant_Garamond } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { SITE_CONFIG } from "@/lib/constants"
import "./globals.css"

/**
 * Primary sans-serif font for body text and UI.
 * Optimized weights: 400 (normal), 500 (medium), 600 (semibold)
 */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
})

/**
 * Elegant serif font for headings and accent text.
 * Optimized weights: 300 (light), 400 (normal), 600 (semibold)
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
  preload: true,
})

/**
 * Monospace font for code and technical content.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

/**
 * Viewport configuration for optimal mobile experience.
 * Prevents zoom issues and ensures proper scaling.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

/**
 * Root metadata for SEO and social sharing.
 */
export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://alaire.in"),
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${cormorant.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
