import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Store, CreditCard, Bell, Shield, Palette } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Store Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your store name, address, and contact information.
              </p>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Payment Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-green-500/10 p-2">
              <CreditCard className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Payment Methods</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up payment gateways and manage transactions.
              </p>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Bell className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure email and push notification preferences.
              </p>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-500/10 p-2">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage passwords, two-factor authentication, and sessions.
              </p>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Palette className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Customize theme, colors, and display preferences.
              </p>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-gray-500/10 p-2">
              <Settings className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">General</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Language, timezone, currency, and other preferences.
              </p>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <div className="p-6">
          <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Irreversible actions that affect your entire store.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" className="text-destructive border-destructive/50">
              Export All Data
            </Button>
            <Button variant="destructive">
              Delete Store
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
