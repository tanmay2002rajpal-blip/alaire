/**
 * @fileoverview Contact information card for checkout.
 * Collects customer name, email, and phone number for order communication.
 *
 * @module components/checkout/contact-info-card
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ContactInfoCardProps } from "./types"

/**
 * ContactInfoCard Component
 *
 * Renders a card containing contact information form fields.
 * This information is used for:
 * - Sending order confirmation emails
 * - SMS/WhatsApp order updates
 * - Delivery coordination
 *
 * @param props - Component props
 * @param props.formData - Current form data values
 * @param props.onInputChange - Handler for input field changes
 *
 * @example
 * ```tsx
 * <ContactInfoCard
 *   formData={formData}
 *   onInputChange={handleInputChange}
 * />
 * ```
 */
export function ContactInfoCard({
  formData,
  onInputChange,
}: ContactInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          We&apos;ll use this to send order updates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Name and Phone - Two column layout on larger screens */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={onInputChange}
              placeholder="John Doe"
              required
              autoComplete="name"
              aria-required="true"
            />
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={onInputChange}
              placeholder="9876543210"
              required
              autoComplete="tel"
              pattern="[0-9]{10}"
              maxLength={10}
              aria-required="true"
              aria-describedby="phone-hint"
            />
            <span id="phone-hint" className="sr-only">
              Enter 10-digit Indian mobile number without country code
            </span>
          </div>
        </div>

        {/* Email Field - Full width */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="john@example.com"
            required
            autoComplete="email"
            aria-required="true"
            aria-describedby="email-hint"
          />
          <span id="email-hint" className="sr-only">
            Order confirmation and tracking updates will be sent to this email
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
