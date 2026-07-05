import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import Razorpay from "razorpay"
import { getDb } from "@/lib/db/client"

function getRazorpay(): Razorpay {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured")
  }
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get("X-Admin-Secret")
    if (!adminSecret || adminSecret !== process.env.ADMIN_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const db = await getDb()
    const oid = new ObjectId(orderId)

    const order = await db.collection("orders").findOne(
      { _id: oid },
      {
        projection: {
          razorpay_payment_id: 1,
          total: 1,
          wallet_amount_used: 1,
          user_id: 1,
          refund_id: 1,
          refunded_at: 1,
          refund_status: 1,
          refund_amount: 1,
          wallet_refunded: 1,
        },
      }
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const results: {
      razorpayRefund?: { id: string; amount: number; status: string }
      razorpayError?: string
      walletRefunded?: number
    } = {}

    // Item 10: idempotency. If this order was already refunded, return the existing
    // result WITHOUT re-crediting the wallet or re-calling Razorpay.
    if (order.refund_id || order.refunded_at) {
      if (order.refund_id) {
        results.razorpayRefund = {
          id: order.refund_id,
          amount: order.refund_amount ?? 0,
          status: order.refund_status ?? "processed",
        }
      }
      if (order.wallet_refunded) {
        results.walletRefunded = order.wallet_refunded
      }
      return NextResponse.json({ success: true, alreadyRefunded: true, ...results })
    }

    // Refund Razorpay payment
    if (order.razorpay_payment_id) {
      try {
        const razorpay = getRazorpay()
        const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
          speed: "normal",
        })
        const refundAmount = refund.amount ?? 0
        results.razorpayRefund = {
          id: refund.id,
          amount: refundAmount / 100,
          status: refund.status,
        }

        await db.collection("orders").updateOne(
          { _id: oid },
          {
            $set: {
              refund_id: refund.id,
              refund_status: refund.status,
              refund_amount: refundAmount / 100,
              refunded_at: new Date(),
              refund_failed: null,
              updated_at: new Date(),
            },
          }
        )
      } catch (err) {
        // Item 10: do NOT swallow the error and claim success. Persist a
        // refund_failed marker and return success:false with the error.
        const razorpayError = err instanceof Error ? err.message : "Refund failed"
        await db.collection("orders").updateOne(
          { _id: oid },
          { $set: { refund_failed: razorpayError, updated_at: new Date() } }
        )
        return NextResponse.json(
          { success: false, error: razorpayError, razorpayError },
          { status: 502 }
        )
      }
    }

    // Refund wallet balance if used
    if (order.wallet_amount_used > 0 && order.user_id) {
      try {
        const wallet = await db.collection("wallets").findOne({ user_id: order.user_id })
        if (wallet) {
          await db.collection("wallets").updateOne(
            { _id: wallet._id },
            { $inc: { balance: order.wallet_amount_used } }
          )
          await db.collection("wallet_transactions").insertOne({
            wallet_id: wallet._id,
            type: "credit",
            amount: order.wallet_amount_used,
            description: `Refund for cancelled order`,
            created_at: new Date(),
          })
          results.walletRefunded = order.wallet_amount_used
          // Persist a marker so a repeat call is caught by the idempotency guard
          // above and does NOT re-credit the wallet.
          await db.collection("orders").updateOne(
            { _id: oid },
            {
              $set: {
                wallet_refunded: order.wallet_amount_used,
                refunded_at: order.refunded_at ?? new Date(),
                updated_at: new Date(),
              },
            }
          )
        }
      } catch (err) {
        console.error("Wallet refund failed:", err)
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error("Refund error:", error)
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
  }
}
