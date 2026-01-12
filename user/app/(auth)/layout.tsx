import Link from "next/link"
import { STORE_NAME } from "@/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            {STORE_NAME}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
