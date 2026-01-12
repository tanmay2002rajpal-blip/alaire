import Image from "next/image"
import { Package } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  image_url: string | null
}

interface OrderItemsProps {
  items: OrderItem[]
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4">
          {/* Image */}
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.product_name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-center">
            <h4 className="font-medium leading-tight">{item.product_name}</h4>
            {item.variant_name && (
              <p className="text-sm text-muted-foreground">{item.variant_name}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Qty: {item.quantity} &times; {formatPrice(item.price_at_purchase)}
            </p>
          </div>

          {/* Subtotal */}
          <div className="flex items-center">
            <span className="font-medium">
              {formatPrice(item.quantity * item.price_at_purchase)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
