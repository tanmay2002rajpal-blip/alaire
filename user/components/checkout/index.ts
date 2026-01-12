/**
 * @fileoverview Checkout module exports.
 * Provides all checkout-related components for the application.
 *
 * @module components/checkout
 */

// Main checkout components
export { CheckoutForm } from "./checkout-form"
export { OrderSummary } from "./order-summary"

// Address components
export { AddressSelector } from "./address-selector"
export { AddressFormFields } from "./address-form-fields"

// Card components (used within CheckoutForm)
export { ContactInfoCard } from "./contact-info-card"
export { ShippingAddressCard } from "./shipping-address-card"
export { PaymentMethodCard } from "./payment-method-card"

// Utility components
export { PincodeChecker } from "./pincode-checker"

// Hooks
export { useCheckout } from "./use-checkout"

// Types
export type {
  CheckoutFormProps,
  CheckoutFormData,
  PaymentMethod,
  AddressMode,
  ContactInfoCardProps,
  ShippingAddressCardProps,
  PaymentMethodCardProps,
  AddressFormFieldsProps,
} from "./types"
