'use client'

import { useState, useEffect } from 'react'
import { getSubscribers, sendNewsletterBroadcast } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; subscribed_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    loadSubscribers()
  }, [])

  async function loadSubscribers() {
    try {
      setLoading(true)
      const data = await getSubscribers()
      setSubscribers(data)
    } catch (err) {
      toast.error('Failed to load subscribers')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || !htmlContent) {
      toast.error('Subject and Content are required')
      return
    }

    if (!confirm('Are you sure you want to send this to ALL active subscribers?')) return

    try {
      setSending(true)
      const res = await sendNewsletterBroadcast(subject, htmlContent)
      if (res.success) {
        toast.success(`Successfully sent to ${res.count} subscribers!`)
        setSubject('')
        setHtmlContent('')
      } else {
        toast.error(res.error || 'Failed to send broadcast')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Newsletter</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Compose Broadcast</CardTitle>
            <CardDescription>
              Send an email to {subscribers.length} active subscribers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E.g., Special Offer Inside!"
                  disabled={sending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HTML Content</label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<p>Hello! Check out our new arrivals...</p>"
                  className="min-h-[300px] font-mono"
                  disabled={sending}
                />
              </div>
              <Button type="submit" disabled={sending || subscribers.length === 0} className="w-full">
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send to {subscribers.length} Subscribers
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Total Subscribers</CardTitle>
            <CardDescription>List of active newsletter subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                          No subscribers found.
                        </TableCell>
                      </TableRow>
                    )}
                    {subscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {new Date(sub.subscribed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
