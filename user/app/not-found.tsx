import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <span className="font-serif text-4xl font-medium tracking-tight">
          ALAIRE
        </span>

        <div className="mt-8 mb-4">
          <h1 className="text-2xl font-semibold">Page not found</h1>
        </div>

        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Button asChild size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
