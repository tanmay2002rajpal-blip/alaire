import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { serializeDocs } from "@/lib/db/helpers"
import { formatPrice } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function WalletPage() {
  const session = await auth()
  const userId = session?.user?.id

  const db = await getDb()

  const wallet = await db
    .collection("wallets")
    .findOne({ user_id: userId })

  const transactionDocs = wallet
    ? await db
        .collection("wallet_transactions")
        .find({ wallet_id: wallet._id.toString() })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray()
    : []

  const transactions = serializeDocs(transactionDocs)
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
          {transactions.length === 0 ? (
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
                        (tx as Record<string, unknown>).type === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {(tx as Record<string, unknown>).type === "credit" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{(tx as Record<string, unknown>).description as string}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date((tx as Record<string, unknown>).created_at as string).toLocaleDateString("en-IN", {
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
                      (tx as Record<string, unknown>).type === "credit" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {(tx as Record<string, unknown>).type === "credit" ? "+" : "-"}
                    {formatPrice((tx as Record<string, unknown>).amount as number)}
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
