'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, RefreshCcw, XCircle, Loader2, Tag } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { updateOrderStatusAction } from '@/lib/actions/orders'

interface OrderActionButtonsProps {
  orderId: string
  orderNumber: string
  orderStatus: string
  paymentMethod?: string | null
  hasAwb?: boolean
  total?: number
  shippingAddress?: Record<string, unknown> | null
  awbNumber?: string | null
  courierName?: string | null
  createdAt?: string | null
}

export function OrderActionButtons({ orderId, orderNumber, orderStatus, paymentMethod, hasAwb, total, shippingAddress, awbNumber, courierName, createdAt }: OrderActionButtonsProps) {
  const isPrepaid = paymentMethod !== 'cod'
  const isCod = paymentMethod === 'cod'
  const router = useRouter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [labelSize, setLabelSize] = useState<'4x6' | '4x4' | 'a4'>('4x6')
  const [isLabelProcessing, setIsLabelProcessing] = useState(false)

  const handlePrintInvoice = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate invoice')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${orderNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Invoice downloaded')
    } catch (error) {
      toast.error('Failed to download invoice', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const canPrintLabel = !!shippingAddress && ['processing', 'shipped', 'delivered'].includes(orderStatus)

  const handlePrintLabel = async () => {
    setIsLabelProcessing(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/label?size=${labelSize}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate shipping label')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Label-${orderNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Shipping label downloaded')
    } catch (error) {
      toast.error('Failed to download shipping label', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsLabelProcessing(false)
    }
  }

  const handleCancelOrder = async () => {
    setIsProcessing(true)
    try {
      const result = await updateOrderStatusAction(orderId, 'cancelled', 'Order cancelled by admin')
      if (result.success) {
        toast.success('Order cancelled successfully')
        router.refresh()
      } else {
        toast.error('Failed to cancel order', {
          description: result.error || 'An unexpected error occurred',
        })
      }
    } catch (error) {
      toast.error('Failed to cancel order', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsProcessing(false)
      setCancelDialogOpen(false)
    }
  }

  const handleRefundOrder = async () => {
    setIsProcessing(true)
    try {
      const result = await updateOrderStatusAction(orderId, 'refunded', 'Refund processed by admin')
      if (result.success) {
        toast.success('Refund processed successfully')
        router.refresh()
      } else {
        toast.error('Failed to process refund', {
          description: result.error || 'An unexpected error occurred',
        })
      }
    } catch (error) {
      toast.error('Failed to process refund', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsProcessing(false)
      setRefundDialogOpen(false)
    }
  }

  return (
    <>
      <Button className="w-full" variant="outline" onClick={handlePrintInvoice}>
        <Printer className="h-4 w-4 mr-2" />
        Print Invoice
      </Button>

      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          variant="outline"
          disabled={!canPrintLabel || isLabelProcessing}
          onClick={handlePrintLabel}
        >
          {isLabelProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Tag className="h-4 w-4 mr-2" />
          )}
          Print Label
        </Button>
        <Select value={labelSize} onValueChange={(v) => setLabelSize(v as '4x6' | '4x4' | 'a4')}>
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4x6">4x6</SelectItem>
            <SelectItem value="4x4">4x4</SelectItem>
            <SelectItem value="a4">A4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        variant="outline"
        disabled={orderStatus === 'refunded' || isProcessing}
        onClick={() => setRefundDialogOpen(true)}
      >
        {isProcessing && refundDialogOpen ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4 mr-2" />
        )}
        Refund Order
      </Button>

      <Button
        className="w-full"
        variant="destructive"
        disabled={['cancelled', 'delivered', 'refunded'].includes(orderStatus) || isProcessing}
        onClick={() => setCancelDialogOpen(true)}
      >
        {isProcessing && cancelDialogOpen ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 mr-2" />
        )}
        Cancel Order
      </Button>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to cancel order{' '}
                  <code className="bg-muted px-1 rounded">{orderNumber}</code>?
                </p>
                <p className="font-medium">This will automatically:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {hasAwb && <li>Cancel the BlueDart shipment</li>}
                  <li>Restore product stock</li>
                  {isPrepaid && (
                    <li>
                      Issue a full Razorpay refund{total ? ` of ₹${total}` : ''} (5-7 business days)
                    </li>
                  )}
                  {isCod && <li>No payment refund needed (Cash on Delivery)</li>}
                  <li>Send cancellation email to the customer</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Order Confirmation */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Order</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to process a refund for order{' '}
                  <code className="bg-muted px-1 rounded">{orderNumber}</code>?
                </p>
                {isPrepaid ? (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Full Razorpay refund{total ? ` of ₹${total}` : ''} will be issued</li>
                    <li>Refund reflects in 5-7 business days</li>
                    <li>Customer will be notified by email</li>
                  </ul>
                ) : (
                  <p className="text-sm text-amber-600">
                    This is a Cash on Delivery order. No online refund will be processed.
                    Contact the customer for manual refund if payment was already collected.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefundOrder}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
