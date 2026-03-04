/**
 * @fileoverview Payment method selection card for checkout.
 * Allows customers to choose between online payment (Razorpay) and Cash on Delivery.
 *
 * @module components/checkout/payment-method-card
 */

"use client"

import { CreditCard, Banknote } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PaymentMethodCardProps, PaymentMethod } from "./types"

/**
 * Payment method option configuration.
 * Defines the available payment methods with their display properties.
 */
const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
}> = [
  {
    value: "prepaid",
    label: "Pay Online",
    description: "UPI, Cards, Net Banking, Wallets",
    icon: CreditCard,
  },
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: Banknote,
  },
]

/**
 * PaymentMethodCard Component
 *
 * Renders a card with payment method options for the checkout flow.
 * Supports two payment methods:
 *
 * 1. **Prepaid (Online Payment)**:
 *    - Processed via Razorpay payment gateway
 *    - Supports UPI, Credit/Debit Cards, Net Banking, and Wallets
 *    - Allows wallet balance usage
 *
 * 2. **Cash on Delivery (COD)**:
 *    - Customer pays upon receiving the order
 *    - Wallet balance cannot be used with COD
 *    - May have additional charges (handled by create-order API)
 *
 * @param props - Component props
 * @param props.paymentMethod - Currently selected payment method
 * @param props.onPaymentMethodChange - Handler for payment method changes
 *
 * @example
 * ```tsx
 * <PaymentMethodCard
 *   paymentMethod={paymentMethod}
 *   onPaymentMethodChange={setPaymentMethod}
 *   walletAmountUsed={walletAmountUsed}
 * />
 * ```
 */
export function PaymentMethodCard({
  paymentMethod,
  onPaymentMethodChange,
}: PaymentMethodCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Choose how you&apos;d like to pay
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
          className="space-y-3"
          aria-label="Payment method selection"
        >
          {PAYMENT_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = paymentMethod === option.value

            return (
              <label
                key={option.value}
                htmlFor={option.value}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border-2
                  cursor-pointer transition-all duration-200
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted hover:border-muted-foreground/50"
                  }
                `}
              >
                {/* Radio Button */}
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  aria-describedby={`${option.value}-description`}
                />

                {/* Icon and Text */}
                <div className="flex items-center gap-3 flex-1">
                  {/* Icon Container */}
                  <div
                    className={`
                      p-2 rounded-full transition-colors
                      ${isSelected ? "bg-primary/20" : "bg-primary/10"}
                    `}
                    aria-hidden="true"
                  >
                    <Icon
                      className={`
                        h-5 w-5 transition-colors
                        ${isSelected ? "text-primary" : "text-primary/80"}
                      `}
                    />
                  </div>

                  {/* Label and Description */}
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p
                      id={`${option.value}-description`}
                      className="text-sm text-muted-foreground"
                    >
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            )
          })}
        </RadioGroup>

      </CardContent>
    </Card>
  )
}
