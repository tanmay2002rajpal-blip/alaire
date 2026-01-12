"use client"

import { RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks"
import { toast } from "sonner"

interface OrderItem {
  product_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  image_url: string | null
}

interface ReorderButtonProps {
  items: OrderItem[]
}

export function ReorderButton({ items }: ReorderButtonProps) {
  const router = useRouter()
  const { addItem } = useCart()

  const handleReorder = () => {
    let addedCount = 0

    items.forEach((item) => {
      if (item.product_id) {
        addItem({
          productId: item.product_id,
          name: item.product_name,
          variantName: item.variant_name ?? undefined,
          price: item.price_at_purchase,
          quantity: item.quantity,
          image: item.image_url ?? undefined,
        })
        addedCount++
      }
    })

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} items to cart`)
      router.push("/cart")
    } else {
      toast.error("Could not add items to cart")
    }
  }

  return (
    <Button onClick={handleReorder}>
      <RotateCcw className="mr-2 h-4 w-4" />
      Reorder
    </Button>
  )
}
