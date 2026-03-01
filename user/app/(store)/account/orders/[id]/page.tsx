import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, HelpCircle } from "lucide-react"
import { auth } from "@/lib/auth"
import { getOrderById } from "@/lib/db/queries"
import { formatPrice, formatDate } from "@/lib/utils"
import { ORDER_STATUSES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderTimeline, OrderItems, OrderTracking } from "@/components/account"
import { ReorderButton } from "./reorder-button"
import { InvoiceButton } from "./invoice-button"
import { ReturnRequestButton } from "./return-request-button"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Order #${id.slice(0, 8).toUpperCase()}`,
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  const order = await getOrderById(id, session.user.id)

  if (!order) {
    notFound()
  }

  const statusConfig = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] ?? {
    label: order.status,
    color: "bg-gray-100 text-gray-800",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/account/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline
            currentStatus={order.status}
            statusHistory={order.status_history}
          />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItems items={order.items} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Address */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">
                    -{formatPrice(order.discount_amount)}
                  </span>
                </div>
              )}
              {order.wallet_amount_used > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="text-green-600">
                    -{formatPrice(order.wallet_amount_used)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shipping_cost === 0
                    ? "Free"
                    : formatPrice(order.shipping_cost)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
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
                  {shippingAddress.phone && (
                    <>
                      <br />
                      Phone: {shippingAddress.phone}
                    </>
                  )}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Tracking (if shipped) */}
          {(order.status === "shipped" || order.status === "delivered") &&
            order.awb_number && (
              <OrderTracking
                awbNumber={order.awb_number}
                courierName={order.courier_name ?? undefined}
              />
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ReorderButton items={order.items} />
        <InvoiceButton
          orderId={order.id}
          orderNumber={order.order_number}
          disabled={!["paid", "confirmed", "processing", "shipped", "delivered"].includes(order.status)}
        />
        {["delivered"].includes(order.status) && (
          <ReturnRequestButton
            orderId={order.id}
            orderNumber={order.order_number}
          />
        )}
        <Button variant="outline" asChild>
          <Link href="/contact">
            <HelpCircle className="mr-2 h-4 w-4" />
            Need Help?
          </Link>
        </Button>
      </div>
    </div>
  )
}
