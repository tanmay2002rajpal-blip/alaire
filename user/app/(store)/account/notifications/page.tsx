import { Bell, Package, Tag, Info } from "lucide-react"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { serializeDocs } from "@/lib/db/helpers"
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
  const session = await auth()
  const userId = session?.user?.id

  const db = await getDb()

  const notificationDocs = await db
    .collection("notifications")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray()

  const notifications = serializeDocs(notificationDocs)

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
          {notifications.length === 0 ? (
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
                const n = notification as Record<string, unknown>
                const Icon = notificationIcons[n.type as keyof typeof notificationIcons] ?? Info

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${
                      !n.read ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{n.title as string}</p>
                      <p className="text-sm text-muted-foreground">
                        {n.message as string}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.created_at as string).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.read && (
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
