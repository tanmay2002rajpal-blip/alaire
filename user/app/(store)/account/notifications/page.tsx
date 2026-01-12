import { Bell, Package, Tag, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MarkAsReadButton } from "@/components/notifications/mark-read-button"

const notificationIcons = {
  order: Package,
  promotion: Tag,
  system: Info,
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Stay updated with your orders and promotions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] ?? Info

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${
                      !notification.read ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <MarkAsReadButton notificationId={notification.id} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
