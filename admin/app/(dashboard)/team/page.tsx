import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Shield, UserCog, Mail } from "lucide-react"

export default function TeamPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage team members and their permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Team Members</span>
          </div>
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs text-muted-foreground">Active users</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Admins</span>
          </div>
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs text-muted-foreground">Full access</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UserCog className="h-4 w-4" />
            <span className="text-sm">Managers</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Limited access</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Pending Invites</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Awaiting response</p>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <div className="p-6">
          <h3 className="font-semibold mb-4">Team Members</h3>
          <div className="space-y-4">
            {/* Current User */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  A
                </div>
                <div>
                  <p className="font-medium">Admin User</p>
                  <p className="text-sm text-muted-foreground">admin@alaire.in</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Admin
                </span>
                <span className="text-sm text-muted-foreground">You</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Invite Section */}
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Grow your team</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Invite team members to help manage your store. Assign roles and permissions to control access.
          </p>
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Send Invitation
          </Button>
        </div>
      </Card>
    </div>
  )
}
