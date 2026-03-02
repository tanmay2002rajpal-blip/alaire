import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { CheckCircle2, Package, MapPin, CreditCard, Truck, ShoppingBag } from "lucide-react"
import { getOrderConfirmation } from "@/lib/db/queries"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: OrderConfirmationPageProps): Promise<Metadata> {
  return {
    title: "Order Confirmed",
  }
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { id } = await params
  const order = await getOrderConfirmation(id)

  if (!order) {
    notFound()
  }

  const shippingAddress = order.shipping_address as {
    full_name?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  } | null

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="container max-w-3xl py-12">
      {/* Success Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. We&apos;re getting it ready for you.
        </p>
        <p className="mt-1 text-sm font-medium">
          Order Number:{" "}
          <span className="font-mono text-base">{order.order_number}</span>
        </p>
      </div>

      {/* Order Items */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">
              {itemCount} {itemCount === 1 ? "Item" : "Items"} Ordered
            </h2>
          </div>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.image_url ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={item.image_url}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.price_at_purchase * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Price Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -{formatPrice(order.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {order.shipping_cost === 0
                  ? "Free"
                  : formatPrice(order.shipping_cost)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* Shipping Address */}
        {shippingAddress && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Delivery Address</h3>
              </div>
              <address className="not-italic text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  {shippingAddress.full_name}
                </span>
                <br />
                {shippingAddress.line1}
                {shippingAddress.line2 && (
                  <>
                    <br />
                    {shippingAddress.line2}
                  </>
                )}
                <br />
                {shippingAddress.city}, {shippingAddress.state}{" "}
                {shippingAddress.pincode}
              </address>
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Payment</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.payment_method === "cod"
                ? "Cash on Delivery"
                : "Paid Online (Razorpay)"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Estimated delivery in 5-7 business days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/account/orders">View All Orders</Link>
        </Button>
      </div>
    </div>
  )
}
