/**
 * @fileoverview Zod validation schemas for API routes.
 * Ensures type-safe input validation and sanitization.
 *
 * @module lib/validations/api
 */

import { z } from "zod"

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation pattern
 */
const uuidSchema = z.string().uuid("Invalid ID format")

/**
 * Email validation with sanitization
 */
const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email too long")
  .transform((email) => email.toLowerCase().trim())

/**
 * Phone number validation (Indian format)
 */
const phoneSchema = z
  .string()
  .min(10, "Phone number too short")
  .max(15, "Phone number too long")
  .regex(/^[+]?[0-9\s-]+$/, "Invalid phone number format")
  .transform((phone) => phone.replace(/\s/g, ""))

/**
 * Pincode validation (Indian format)
 */
const pincodeSchema = z
  .string()
  .length(6, "Pincode must be 6 digits")
  .regex(/^[1-9][0-9]{5}$/, "Invalid pincode format")

// ============================================================================
// Shipping Address Schema
// ============================================================================

export const shippingAddressSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name too short")
    .max(100, "Name too long")
    .transform((name) => name.trim()),
  phone: phoneSchema,
  line1: z
    .string()
    .min(5, "Address too short")
    .max(200, "Address too long")
    .transform((addr) => addr.trim()),
  line2: z
    .string()
    .max(200, "Address too long")
    .optional()
    .transform((addr) => addr?.trim()),
  city: z
    .string()
    .min(2, "City name too short")
    .max(50, "City name too long")
    .transform((city) => city.trim()),
  state: z
    .string()
    .min(2, "State name too short")
    .max(50, "State name too long")
    .transform((state) => state.trim()),
  pincode: pincodeSchema,
})

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>

// ============================================================================
// Cart Item Schema
// ============================================================================

export const cartItemSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional(),
  name: z.string().min(1).max(200),
  variantName: z.string().max(100).optional(),
  price: z.number().positive("Price must be positive").max(1000000, "Price too high"),
  quantity: z.number().int().positive().max(100, "Quantity too high"),
  image: z.string().url().optional(),
})

export type CartItemInput = z.infer<typeof cartItemSchema>

// ============================================================================
// Create Order Schema
// ============================================================================

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart is empty").max(50, "Too many items"),
  subtotal: z.number().nonnegative().max(10000000, "Subtotal too high"),
  shippingCost: z.number().nonnegative().max(10000, "Shipping cost too high").optional(),
  shippingAddress: shippingAddressSchema,
  email: emailSchema,
  discountCode: z
    .string()
    .max(50, "Discount code too long")
    .optional()
    .transform((code) => code?.toUpperCase().trim()),
  walletAmountUsed: z.number().nonnegative().max(100000, "Wallet amount too high").optional(),
  paymentMethod: z.enum(["prepaid", "cod"]).default("prepaid"),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// ============================================================================
// Verify Payment Schema
// ============================================================================

export const verifyPaymentSchema = z.object({
  orderId: uuidSchema,
  razorpay_payment_id: z
    .string()
    .min(1, "Payment ID required")
    .max(100, "Payment ID too long")
    .regex(/^pay_[a-zA-Z0-9]+$/, "Invalid payment ID format"),
  razorpay_order_id: z
    .string()
    .min(1, "Order ID required")
    .max(100, "Order ID too long")
    .regex(/^order_[a-zA-Z0-9]+$/, "Invalid order ID format"),
  razorpay_signature: z
    .string()
    .min(1, "Signature required")
    .max(200, "Signature too long")
    .regex(/^[a-f0-9]+$/, "Invalid signature format"),
})

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>

// ============================================================================
// Update Profile Schema
// ============================================================================

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name too short")
    .max(100, "Name too long")
    .transform((name) => name.trim()),
  phone: phoneSchema,
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ============================================================================
// Wishlist Schemas
// ============================================================================

export const wishlistToggleSchema = z.object({
  productId: uuidSchema,
})

export const wishlistRemoveSchema = z.object({
  itemId: uuidSchema,
})

// ============================================================================
// Notification Schema
// ============================================================================

export const markNotificationReadSchema = z.object({
  notificationId: uuidSchema,
})

// ============================================================================
// Address Schema
// ============================================================================

export const createAddressSchema = shippingAddressSchema.extend({
  label: z
    .string()
    .min(1, "Label required")
    .max(50, "Label too long")
    .transform((label) => label.trim()),
  is_default: z.boolean().optional().default(false),
})

export type CreateAddressInput = z.infer<typeof createAddressSchema>

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validates request body against a Zod schema.
 * Returns parsed data or throws formatted error.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed and transformed data
 * @throws Error with validation message if invalid
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    // Format Zod validation errors
    const errorMessages = result.error.issues
      .map((issue) => {
        const path = issue.path.map(String).join(".")
        return path ? `${path}: ${issue.message}` : issue.message
      })
      .join(", ")
    throw new Error(`Validation failed: ${errorMessages || "Invalid data"}`)
  }

  return result.data
}
