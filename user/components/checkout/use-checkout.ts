/**
 * @fileoverview Custom hook for checkout form state and logic.
 * Encapsulates all checkout-related state management and API interactions.
 *
 * @module components/checkout/use-checkout
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import type { Address } from "@/lib/actions/addresses"
import type { PincodeData } from "@/lib/bluedart/types"
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

export function useCheckout({
  items,
  subtotal,
  shippingCost = 0,
  estimatedDays = 0,
  couponCode,
  onSuccess,
}: Pick<
  CheckoutFormProps,
  "items" | "subtotal" | "shippingCost" | "estimatedDays" | "couponCode"
> & { onSuccess: (orderId: string) => void }) {
  // ============================================================================
  // State Management
  // ============================================================================

  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [addressMode, setAddressMode] = useState<AddressMode>("saved")
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepaid")
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA)
  const [serviceabilityData, setServiceabilityData] = useState<PincodeData | null>(null)

  const { user } = useAuth()

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true)
      setFormData((prev) => ({ ...prev, email: user.email || "" }))

      // Fetch user profile to pre-fill name and phone
      const fetchProfile = async () => {
        try {
          const res = await fetch(`/api/account/profile?userId=${user.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.profile) {
              setFormData((prev) => ({
                ...prev,
                fullName: prev.fullName || data.profile.full_name || user.name || "",
                phone: prev.phone || data.profile.phone || "",
              }))
            }
          }
        } catch {
          // non-fatal
        }
      }
      fetchProfile()
    } else {
      setAddressMode("new")
    }
  }, [user])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleStateChange = useCallback((state: string) => {
    setFormData((prev) => ({ ...prev, state }))
  }, [])

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

  const validateForm = useCallback((): boolean => {
    for (const field of REQUIRED_FIELDS) {
      if (!formData[field]) {
        const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase()
        toast.error(`Please fill in ${fieldName}`)
        return false
      }
    }

    if (!VALIDATION_PATTERNS.phone.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number")
      return false
    }

    if (!VALIDATION_PATTERNS.pincode.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit pincode")
      return false
    }

    if (!VALIDATION_PATTERNS.email.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    return true
  }, [formData])

  // ============================================================================
  // API Interactions
  // ============================================================================

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
            onSuccess(orderId)
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) return

      setIsLoading(true)

      try {
        const response = await fetch("/api/checkout/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            subtotal,
            shippingCost,
            estimatedDays,
            discountCode: couponCode,
            paymentMethod,
            userId: user?.id,
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

          if (error.outOfStockItems) {
            error.outOfStockItems.forEach((item: string) => {
              toast.error("Out of Stock", { description: item })
            })
            return
          }

          throw new Error(error.message || "Failed to create order")
        }

        const data = await response.json()

        if (data.paymentMethod === "cod") {
          toast.success("Order placed successfully!", {
            description: "You will pay on delivery",
          })
          onSuccess(data.orderId)
          return
        }

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
      estimatedDays,
      couponCode,
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
