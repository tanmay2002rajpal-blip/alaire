/**
 * @fileoverview Main checkout form component.
 * Orchestrates the checkout flow using modular sub-components.
 *
 * This component has been refactored for better maintainability:
 * - ContactInfoCard: Collects customer contact details
 * - ShippingAddressCard: Handles address selection/entry
 * - PaymentMethodCard: Payment method selection
 * - useCheckout: Custom hook for state management and API calls
 *
 * @module components/checkout/checkout-form
 */

"use client"

import Script from "next/script"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContactInfoCard } from "./contact-info-card"
import { ShippingAddressCard } from "./shipping-address-card"
import { PaymentMethodCard } from "./payment-method-card"
import { useCheckout } from "./use-checkout"
import type { CheckoutFormProps } from "./types"

/**
 * CheckoutForm Component
 *
 * Main checkout form that handles the complete purchase flow.
 * Features:
 * - Contact information collection
 * - Shipping address (saved or new) with pincode serviceability
 * - Payment method selection (Prepaid/COD)
 * - Razorpay integration for online payments
 * - Form validation and error handling
 *
 * @param props - Component props
 * @param props.items - Cart items to purchase
 * @param props.subtotal - Order subtotal
 * @param props.discount - Applied discount amount
 * @param props.shippingCost - Calculated shipping cost
 * @param props.walletAmountUsed - Wallet balance applied
 * @param props.couponCode - Applied coupon code
 * @param props.onShippingChange - Callback for shipping cost changes
 * @param props.onSuccess - Callback for successful checkout
 *
 * @example
 * ```tsx
 * <CheckoutForm
 *   items={cartItems}
 *   subtotal={1999}
 *   shippingCost={99}
 *   onShippingChange={(cost) => setShippingCost(cost)}
 *   onSuccess={() => {
 *     clearCart()
 *     router.push('/order-confirmation')
 *   }}
 * />
 * ```
 */
export function CheckoutForm({
  items,
  subtotal,
  discount: _discount = 0, // eslint-disable-line @typescript-eslint/no-unused-vars
  shippingCost = 0,
  walletAmountUsed = 0,
  couponCode,
  onShippingChange,
  onSuccess,
}: CheckoutFormProps) {
  // ============================================================================
  // Custom Hook - State & Handlers
  // ============================================================================

  const {
    // State
    formData,
    isLoading,
    isLoggedIn,
    addressMode,
    selectedAddress,
    paymentMethod,
    serviceabilityData,

    // Setters
    setAddressMode,
    setPaymentMethod,
    setServiceabilityData,

    // Handlers
    handleInputChange,
    handleStateChange,
    handleAddressSelect,
    handleSubmit,
  } = useCheckout({
    items,
    subtotal,
    shippingCost,
    walletAmountUsed,
    couponCode,
    onSuccess,
  })

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/*
        Razorpay SDK Script
        Loaded after page becomes interactive.
      */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/*
          Step 1: Contact Information
          Collects name, email, and phone for order communication
        */}
        <ContactInfoCard
          formData={formData}
          onInputChange={handleInputChange}
        />

        {/*
          Step 2: Shipping Address
          - Logged-in users: Choose saved address or enter new
          - Guest users: Enter new address
          - Includes pincode serviceability check
        */}
        <ShippingAddressCard
          isLoggedIn={isLoggedIn}
          addressMode={addressMode}
          onAddressModeChange={setAddressMode}
          selectedAddress={selectedAddress}
          onAddressSelect={handleAddressSelect}
          formData={formData}
          onInputChange={handleInputChange}
          onStateChange={handleStateChange}
          serviceabilityData={serviceabilityData}
          onServiceabilityChange={setServiceabilityData}
          onShippingChange={onShippingChange}
        />

        {/*
          Step 3: Payment Method
          Choose between online payment (Razorpay) or Cash on Delivery
        */}
        <PaymentMethodCard
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          walletAmountUsed={walletAmountUsed}
        />

        {/*
          Submit Button
          - Disabled when loading or pincode is not serviceable
          - Shows different text based on payment method
        */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || serviceabilityData?.serviceable === false}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Processing...</span>
            </>
          ) : paymentMethod === "cod" ? (
            <span>Place Order (Pay on Delivery)</span>
          ) : (
            <span>Pay Now</span>
          )}
        </Button>
      </form>
    </>
  )
}
