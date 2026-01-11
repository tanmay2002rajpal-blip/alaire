import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Megaphone, Zap, Calendar } from "lucide-react"

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            Create and manage promotional banners and offers
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Promotion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Megaphone className="h-4 w-4" />
            <span className="text-sm">Total Promotions</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">All promotions</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Currently running</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Scheduled</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Upcoming promotions</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Megaphone className="h-4 w-4" />
            <span className="text-sm">Expired</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Past promotions</p>
        </Card>
      </div>

      {/* Empty State */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No promotions yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Create promotional banners to highlight sales, special offers, and seasonal campaigns.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Promotion
          </Button>
        </div>
      </Card>
    </div>
  )
}
