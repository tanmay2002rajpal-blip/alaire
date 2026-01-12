/**
 * @fileoverview Custom hook for checkout form state and logic.
 * Encapsulates all checkout-related state management and API interactions.
 *
 * @module components/checkout/use-checkout
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Address } from "@/lib/actions/addresses"
import type { PincodeData } from "@/lib/shiprocket/types"
import type {
  CheckoutFormData,
  CheckoutFormProps,
  PaymentMethod,
  AddressMode,
  RazorpayOptions,
} from "./types"

/**
 * Initial form data state.
 * All fields start empty and are populated by user input or saved address selection.
 */
const INITIAL_FORM_DATA: CheckoutFormData = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
}

/**
 * Form validation patterns.
 */
const VALIDATION_PATTERNS = {
  /** 10-digit Indian mobile number */
  phone: /^[0-9]{10}$/,
  /** 6-digit Indian pincode */
  pincode: /^[0-9]{6}$/,
  /** Standard email format */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
}

/**
 * Required form fields for validation.
 */
const REQUIRED_FIELDS: Array<keyof CheckoutFormData> = [
  "fullName",
  "email",
  "phone",
  "line1",
  "city",
  "state",
  "pincode",
]

/**
 * useCheckout Hook
 *
 * Custom hook that manages the complete checkout form state and logic.
 * Handles:
 * - Form state management
 * - User authentication check
 * - Address selection (saved/new)
 * - Form validation
 * - Order creation API calls
 * - Razorpay payment integration
 * - COD order processing
 *
 * @param props - Checkout form configuration
 * @returns Checkout state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   isLoading,
 *   handleInputChange,
 *   handleSubmit,
 *   // ... other state and handlers
 * } = useCheckout({
 *   items,
 *   subtotal,
 *   onSuccess: () => router.push('/order-confirmation'),
 * })
 * ```
 */
export function useCheckout({
  items,
  subtotal,
  shippingCost = 0,
  walletAmountUsed = 0,
  couponCode,
  onSuccess,
}: Pick<
  CheckoutFormProps,
  "items" | "subtotal" | "shippingCost" | "walletAmountUsed" | "couponCode" | "onSuccess"
>) {
  // ============================================================================
  // State Management
  // ============================================================================

  /** Loading state during form submission */
  const [isLoading, setIsLoading] = useState(false)

  /** User authentication status */
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  /** Address mode for logged-in users */
  const [addressMode, setAddressMode] = useState<AddressMode>("saved")

  /** Currently selected saved address */
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

  /** Selected payment method */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepaid")

  /** Form data for contact and address fields */
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA)

  /** Pincode serviceability data from Shiprocket */
  const [serviceabilityData, setServiceabilityData] = useState<PincodeData | null>(null)

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Check user authentication status on mount.
   * Pre-fills email for logged-in users.
   */
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        setFormData((prev) => ({ ...prev, email: user.email || "" }))
      } else {
        // Guest users can only enter new addresses
        setAddressMode("new")
      }
    }

    checkUser()
  }, [])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles input field changes.
   * Updates the corresponding field in formData.
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  /**
   * Handles state dropdown selection.
   */
  const handleStateChange = useCallback((state: string) => {
    setFormData((prev) => ({ ...prev, state }))
  }, [])

  /**
   * Handles saved address selection.
   * Populates form data with the selected address details.
   */
  const handleAddressSelect = useCallback((address: Address) => {
    setSelectedAddress(address)
    setFormData((prev) => ({
      ...prev,
      fullName: address.full_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    }))
  }, [])

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validates the checkout form.
   * Checks required fields and format validation for phone, email, and pincode.
   *
   * @returns True if form is valid, false otherwise
   */
  const validateForm = useCallback((): boolean => {
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!formData[field]) {
        const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase()
        toast.error(`Please fill in ${fieldName}`)
        return false
      }
    }

    // Validate phone number format
    if (!VALIDATION_PATTERNS.phone.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number")
      return false
    }

    // Validate pincode format
    if (!VALIDATION_PATTERNS.pincode.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit pincode")
      return false
    }

    // Validate email format
    if (!VALIDATION_PATTERNS.email.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    return true
  }, [formData])

  // ============================================================================
  // API Interactions
  // ============================================================================

  /**
   * Initializes Razorpay payment and opens the checkout modal.
   *
   * @param orderId - Internal order ID
   * @param razorpayOrderId - Razorpay order ID
   * @param amount - Amount in paise
   * @param currency - Currency code
   * @param key - Razorpay API key
   */
  const initializeRazorpay = useCallback(
    async (
      orderId: string,
      razorpayOrderId: string,
      amount: number,
      currency: string,
      key: string
    ) => {
      const options: RazorpayOptions = {
        key,
        amount,
        currency,
        name: "Alaire",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          // Verify payment with backend
          const verifyResponse = await fetch("/api/checkout/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })

          if (verifyResponse.ok) {
            toast.success("Payment successful!", {
              description: "Your order has been placed",
            })
            onSuccess()
          } else {
            toast.error("Payment verification failed")
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#000000",
        },
      }

      // Create Razorpay instance and open modal
      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", (response) => {
        toast.error("Payment failed", {
          description: response.error.description,
        })
      })
      razorpay.open()
    },
    [formData, onSuccess]
  )

  /**
   * Handles form submission.
   * Creates order and processes payment (Razorpay or COD).
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validate form before submission
      if (!validateForm()) return

      setIsLoading(true)

      try {
        // Create order via API
        const response = await fetch("/api/checkout/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            subtotal,
            shippingCost,
            discountCode: couponCode,
            walletAmountUsed: paymentMethod === "cod" ? 0 : walletAmountUsed,
            paymentMethod,
            shippingAddress: {
              full_name: formData.fullName,
              phone: formData.phone,
              line1: formData.line1,
              line2: formData.line2,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
            },
            email: formData.email,
          }),
        })

        if (!response.ok) {
          const error = await response.json()

          // Handle out of stock items
          if (error.outOfStockItems) {
            error.outOfStockItems.forEach((item: string) => {
              toast.error("Out of Stock", { description: item })
            })
            return
          }

          throw new Error(error.message || "Failed to create order")
        }

        const data = await response.json()

        // Handle COD orders - immediately successful
        if (data.paymentMethod === "cod") {
          toast.success("Order placed successfully!", {
            description: "You will pay on delivery",
          })
          onSuccess()
          return
        }

        // Handle prepaid orders - initialize Razorpay
        const { orderId, razorpayOrderId, amount, currency, key } = data
        await initializeRazorpay(orderId, razorpayOrderId, amount, currency, key)
      } catch (error) {
        toast.error("Something went wrong", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [
      formData,
      items,
      subtotal,
      shippingCost,
      couponCode,
      walletAmountUsed,
      paymentMethod,
      validateForm,
      initializeRazorpay,
      onSuccess,
    ]
  )

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
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
  }
}
