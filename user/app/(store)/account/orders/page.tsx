"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, ChevronRight } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ORDER_STATUSES } from "@/lib/constants"

interface OrderItem {
  id: string
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  image_url: string | null
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        setIsLoading(false)
        return
      }
      try {
        const response = await fetch(`/api/account/orders`)
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders || [])
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-36 bg-muted rounded" />
              <div className="h-4 w-56 bg-muted rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            View and track your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                When you place an order, it will appear here
              </p>
              <Link
                href="/products"
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] ?? {
                  label: order.status,
                  color: "bg-gray-100 text-gray-800",
                }

                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="block"
                  >
                    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                          <span className="font-semibold">
                            {formatPrice(order.total)}
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        {order.items.slice(0, 4).map((item: OrderItem) => (
                          <div
                            key={item.id}
                            className="relative h-16 w-16 overflow-hidden rounded-md bg-muted"
                          >
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
