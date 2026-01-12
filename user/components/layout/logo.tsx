import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/constants'

export function Logo() {
  return (
    <Link href="/" className="text-xl font-semibold tracking-tight">
      {SITE_CONFIG.name.toUpperCase()}
    </Link>
  )
}
