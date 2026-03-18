'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, RefreshCcw, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
}

export function OrderActionButtons({ orderId, orderNumber, orderStatus }: OrderActionButtonsProps) {
  const router = useRouter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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
            <AlertDialogDescription>
              Are you sure you want to cancel order{' '}
              <code className="bg-muted px-1 rounded">{orderNumber}</code>?
              This will notify the customer and cannot be easily undone.
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
            <AlertDialogDescription>
              Are you sure you want to process a refund for order{' '}
              <code className="bg-muted px-1 rounded">{orderNumber}</code>?
              The customer will be notified and the refund will be reflected in 5-7 business days.
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
