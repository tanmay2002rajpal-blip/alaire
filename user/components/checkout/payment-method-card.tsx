"use client"

import { useState, useEffect } from "react"
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

const ALL_PAYMENT_OPTIONS: Array<{
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

export function PaymentMethodCard({
  paymentMethod,
  onPaymentMethodChange,
}: PaymentMethodCardProps) {
  const [codEnabled, setCodEnabled] = useState(true)

  useEffect(() => {
    fetch("/api/site-settings/cod")
      .then((r) => r.json())
      .then((data) => {
        setCodEnabled(data.enabled !== false)
        if (data.enabled === false && paymentMethod === "cod") {
          onPaymentMethodChange("prepaid")
        }
      })
      .catch(() => {})
  }, [])

  const options = codEnabled
    ? ALL_PAYMENT_OPTIONS
    : ALL_PAYMENT_OPTIONS.filter((o) => o.value !== "cod")

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
          {options.map((option) => {
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
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  aria-describedby={`${option.value}-description`}
                />

                <div className="flex items-center gap-3 flex-1">
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
