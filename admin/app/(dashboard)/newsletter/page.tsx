import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Users, Send, TrendingUp, UserCheck, UserX } from "lucide-react"
import { getNewsletterStats, getNewsletterSubscribers } from "@/lib/queries/newsletter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function NewsletterPage() {
  const [stats, subscribers] = await Promise.all([
    getNewsletterStats(),
    getNewsletterSubscribers(),
  ])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
          <p className="text-muted-foreground">
            Manage email subscribers and campaigns
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Subscribers</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Email list size</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Subscribed users</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UserX className="h-4 w-4" />
            <span className="text-sm">Unsubscribed</span>
          </div>
          <p className="text-2xl font-bold">{stats.unsubscribed}</p>
          <p className="text-xs text-muted-foreground">Opted out</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Campaigns Sent</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </Card>
      </div>

      {/* Subscribers List */}
      {subscribers.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No subscribers yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Build your email list to send newsletters, promotions, and updates to your customers.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Import Subscribers
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Subscribers</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>
                    {subscriber.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Unsubscribed
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(subscriber.subscribed_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
