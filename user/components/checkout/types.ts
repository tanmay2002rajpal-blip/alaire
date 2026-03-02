/**
 * @fileoverview Type definitions for the checkout module.
 * Contains all interfaces and types used across checkout components.
 *
 * @module components/checkout/types
 */

import type { CartItem } from "@/hooks/use-cart"
import type { Address } from "@/lib/actions/addresses"
import type { PincodeData } from "@/lib/bluedart/types"

/**
 * Supported payment methods for checkout.
 * - prepaid: Online payment via Razorpay (UPI, cards, net banking, wallets)
 * - cod: Cash on Delivery
 */
export type PaymentMethod = "prepaid" | "cod"

/**
 * Address mode for logged-in users.
 * - saved: Use a previously saved address
 * - new: Enter a new address
 */
export type AddressMode = "saved" | "new"

/**
 * Form data structure for shipping address and contact information.
 */
export interface CheckoutFormData {
  /** Customer's full name */
  fullName: string
  /** Customer's email address for order updates */
  email: string
  /** 10-digit Indian mobile number */
  phone: string
  /** Address line 1 (House/Flat No., Building Name) */
  line1: string
  /** Address line 2 (Street, Locality) - optional */
  line2: string
  /** City name */
  city: string
  /** Indian state name */
  state: string
  /** 6-digit Indian pincode */
  pincode: string
}

/**
 * Props for the main CheckoutForm component.
 */
export interface CheckoutFormProps {
  /** Cart items to be purchased */
  items: CartItem[]
  /** Cart subtotal before discounts and shipping */
  subtotal: number
  /** Discount amount applied (from coupon) */
  discount?: number
  /** Shipping cost calculated from Blue Dart */
  shippingCost?: number
  /** Wallet balance amount used for this order */
  walletAmountUsed?: number
  /** Applied coupon code */
  couponCode?: string
  /** Callback when shipping cost changes based on pincode */
  onShippingChange?: (cost: number) => void
  /** Callback when checkout is successful, receives the order ID */
  onSuccess: (orderId: string) => void
}

/**
 * Props for the ContactInfoCard component.
 */
export interface ContactInfoCardProps {
  /** Current form data */
  formData: CheckoutFormData
  /** Handler for input field changes */
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Props for the ShippingAddressCard component.
 */
export interface ShippingAddressCardProps {
  /** Whether user is logged in */
  isLoggedIn: boolean
  /** Current address mode (saved/new) */
  addressMode: AddressMode
  /** Handler for address mode changes */
  onAddressModeChange: (mode: AddressMode) => void
  /** Currently selected saved address */
  selectedAddress: Address | null
  /** Handler for saved address selection */
  onAddressSelect: (address: Address) => void
  /** Current form data */
  formData: CheckoutFormData
  /** Handler for input field changes */
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Handler for state dropdown changes */
  onStateChange: (state: string) => void
  /** Current serviceability data from pincode check */
  serviceabilityData: PincodeData | null
  /** Handler for serviceability data changes */
  onServiceabilityChange: (data: PincodeData | null) => void
  /** Handler for shipping cost changes */
  onShippingChange?: (cost: number) => void
}

/**
 * Props for the AddressFormFields component.
 */
export interface AddressFormFieldsProps {
  /** Current form data */
  formData: CheckoutFormData
  /** Handler for input field changes */
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Handler for state dropdown changes */
  onStateChange: (state: string) => void
  /** Whether to show contact fields (name, phone) */
  showContactFields?: boolean
}

/**
 * Props for the PaymentMethodCard component.
 */
export interface PaymentMethodCardProps {
  /** Currently selected payment method */
  paymentMethod: PaymentMethod
  /** Handler for payment method changes */
  onPaymentMethodChange: (method: PaymentMethod) => void
  /** Wallet amount being used (to show warning for COD) */
  walletAmountUsed: number
}

/**
 * Razorpay checkout options configuration.
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */
export interface RazorpayOptions {
  /** Razorpay API key */
  key: string
  /** Amount in smallest currency unit (paise for INR) */
  amount: number
  /** Currency code (e.g., "INR") */
  currency: string
  /** Merchant/Business name */
  name: string
  /** Order description */
  description: string
  /** Razorpay order ID */
  order_id: string
  /** Success callback handler */
  handler: (response: RazorpaySuccessResponse) => void
  /** Prefill customer information */
  prefill: {
    name: string
    email: string
    contact: string
  }
  /** Theme customization */
  theme: {
    color: string
  }
}

/**
 * Razorpay successful payment response.
 */
export interface RazorpaySuccessResponse {
  /** Razorpay payment ID */
  razorpay_payment_id: string
  /** Razorpay order ID */
  razorpay_order_id: string
  /** Payment signature for verification */
  razorpay_signature: string
}

/**
 * Razorpay payment failure response.
 */
export interface RazorpayFailureResponse {
  error: {
    code: string
    description: string
    source: string
    step: string
    reason: string
  }
}

/**
 * Razorpay instance interface.
 */
export interface RazorpayInstance {
  /** Open the payment modal */
  open: () => void
  /** Register event handlers */
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void
}

/**
 * Extend Window interface to include Razorpay.
 */
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}
