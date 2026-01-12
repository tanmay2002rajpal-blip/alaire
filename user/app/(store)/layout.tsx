import { Header, Footer, PromoBanner } from "@/components/layout"
import { CartDrawer } from "@/components/cart"
import { AuthProvider, AuthDialog } from "@/components/auth"
import { LenisProvider } from "@/providers"
import { createClient } from "@/lib/supabase/server"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthProvider initialUser={user}>
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
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </div>
        <AuthDialog />
      </LenisProvider>
    </AuthProvider>
  )
}
