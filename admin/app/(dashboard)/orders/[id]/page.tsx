import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Printer, RefreshCcw, XCircle, Package } from 'lucide-react';

import { getOrderById } from '@/lib/queries/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderStatusUpdate } from '@/components/orders/order-status-update';
import OrderDetailClient from './order-detail-client';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Format currency in INR
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

// Get status badge variant
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'shipped':
      return 'outline';
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'refunded':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// Format shipping address
function formatShippingAddress(address: any): string {
  if (!address) return 'No address provided';

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  // Fetch order details
  const order = await getOrderById(id);

  // Handle order not found
  if (!order) {
    notFound();
  }

  // Use values from order object
  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);
  const shipping = order.shipping_cost || 0;
  const discount = order.discount_amount || 0;

  return (
    <OrderDetailClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
              <p className="text-muted-foreground">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="text-sm px-3 py-1">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - 60% width on desktop */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Information */}
            <Card className="order-card">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-base">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base">{order.customer.email}</p>
                  </div>
                  {order.customer.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-base">{order.customer.phone}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Shipping Address
                  </p>
                  <p className="text-base whitespace-pre-line">
                    {formatShippingAddress(order.shipping_address)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="order-card">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.variant_name && (
                              <p className="text-sm text-muted-foreground">
                                {item.variant_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price_at_purchase)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.price_at_purchase * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="order-card">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-base text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 40% width on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update */}
            <div className="order-card">
              <OrderStatusUpdate
                orderId={order.id}
                currentStatus={order.status}
              />
            </div>

            {/* Payment Details */}
            <Card className="order-card">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-base">
                    {order.payment_method === 'cod'
                      ? 'Cash on Delivery'
                      : order.razorpay_order_id
                        ? 'Razorpay'
                        : 'Online Payment'}
                  </p>
                </div>

                {order.razorpay_order_id && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Razorpay Order ID
                      </p>
                      <p className="text-sm font-mono break-all">
                        {order.razorpay_order_id}
                      </p>
                    </div>
                  </>
                )}

                {order.razorpay_payment_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Payment ID
                    </p>
                    <p className="text-sm font-mono break-all">
                      {order.razorpay_payment_id}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <div className="order-card">
              <OrderTimeline history={order.status_history} />
            </div>

            {/* Action Buttons */}
            <Card className="order-card">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  disabled={order.status === 'refunded'}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refund Order
                </Button>

                <Button
                  className="w-full"
                  variant="destructive"
                  disabled={['cancelled', 'delivered', 'refunded'].includes(order.status)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OrderDetailClient>
  );
}
