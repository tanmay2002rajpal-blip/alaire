import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user?.id)
    .single()

  // Get transactions
  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_id", wallet?.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const balance = wallet?.balance ?? 0

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatPrice(balance)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your wallet balance during checkout
          </p>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Recent wallet transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        tx.type === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.type === "credit" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {formatPrice(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
