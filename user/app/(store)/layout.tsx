import { Header, Footer, PromoBanner } from "@/components/layout"
import { CartDrawer } from "@/components/cart"
import { CartSync } from "@/components/cart/cart-sync"
import { AuthProvider, AuthDialog } from "@/components/auth"
import { LenisProvider } from "@/providers"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <LenisProvider>
        <div className="flex min-h-screen flex-col">
          {/* Skip to main content link for keyboard/screen reader users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-lg"
          >
            Skip to main content
          </a>
          <PromoBanner />
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <CartSync />
        </div>
        <AuthDialog />
      </LenisProvider>
    </AuthProvider>
  )
}
