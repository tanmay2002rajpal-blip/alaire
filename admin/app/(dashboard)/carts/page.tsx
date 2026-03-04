'use client'

import { useState, useEffect } from 'react'
import { getActiveCarts } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CartsPage() {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCarts()
    // Optional polling for live updates
    const interval = setInterval(loadCarts, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadCarts() {
    try {
      const data = await getActiveCarts()
      setCarts(data)
    } catch (err) {
      toast.error('Failed to load active carts')
    } finally {
      setLoading(false)
    }
  }

  const formatINRCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Active Carts</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Carts ({carts.length})</CardTitle>
          <CardDescription>View what customers are currently adding to their carts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && carts.length === 0 ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Latest Product</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No active carts at the moment.
                    </TableCell>
                  </TableRow>
                )}
                {carts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell className="font-medium">
                      {cart.user_id.startsWith('guest_') ? (
                        <span className="text-muted-foreground text-xs">Guest ({cart.user_id.slice(6, 12)})</span>
                      ) : (
                        <div>
                          <div className="font-medium">{cart.user_name || cart.user_id}</div>
                          {cart.user_name && <div className="text-xs text-muted-foreground">{cart.user_id}</div>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{cart.total_items}</TableCell>
                    <TableCell>{formatINRCurrency(cart.subtotal)}</TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {cart.items && cart.items.length > 0 
                        ? cart.items[cart.items.length - 1].name 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(cart.updated_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
