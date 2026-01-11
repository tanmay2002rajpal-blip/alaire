import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Users, UserPlus, UserCheck, TrendingUp } from "lucide-react"

export default function CustomerInsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Insights</h1>
          <p className="text-muted-foreground">
            Understand your customer behavior and demographics
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Customers</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Registered users</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UserPlus className="h-4 w-4" />
            <span className="text-sm">New This Month</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Recent signups</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm">Repeat Customers</span>
          </div>
          <p className="text-2xl font-bold">0%</p>
          <p className="text-xs text-muted-foreground">Multiple orders</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg. Lifetime Value</span>
          </div>
          <p className="text-2xl font-bold">$0</p>
          <p className="text-xs text-muted-foreground">Per customer</p>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Customer Growth</h3>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No customer data available yet</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Customer Segments</h3>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No segment data yet</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Top Customers</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Customer rankings will appear here as orders are placed</p>
        </div>
      </Card>
    </div>
  )
}
