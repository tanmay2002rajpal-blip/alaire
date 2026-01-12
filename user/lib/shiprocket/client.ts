/**
 * @fileoverview Shiprocket API client for shipping operations.
 * Handles authentication, serviceability checks, order creation,
 * and shipment tracking.
 *
 * Shiprocket is an Indian logistics aggregator that provides
 * access to multiple courier partners through a single API.
 *
 * Features:
 * - Token-based authentication with automatic refresh
 * - Serviceability and rate checking
 * - Order creation with COD/Prepaid support
 * - AWB generation and shipment tracking
 *
 * @module lib/shiprocket/client
 *
 * @example
 * ```ts
 * import { shiprocketClient } from "@/lib/shiprocket/client"
 *
 * // Check if delivery is possible
 * const serviceability = await shiprocketClient.checkServiceability(
 *   "400001", // Mumbai pickup
 *   "110001", // Delhi delivery
 *   0.5       // 500g package
 * )
 *
 * // Create shipping order
 * const order = await shiprocketClient.createOrder({
 *   order_id: "ORD-12345",
 *   // ... other order details
 * })
 * ```
 */

import type {
  ShiprocketAuthResponse,
  ServiceabilityResponse,
  TrackingResponse,
  PincodeData,
  CreateShiprocketOrderRequest,
  CreateShiprocketOrderResponse,
  GenerateAWBResponse,
} from './types'

// ============================================================================
// Constants
// ============================================================================

/** Shiprocket API base URL */
const BASE_URL = 'https://apiv2.shiprocket.in/v1'

/**
 * Static mapping of common Indian pincodes to city/state.
 * Used for quick lookups without API calls.
 *
 * Note: For production, consider using India Post API or
 * a comprehensive pincode database.
 */
const PINCODE_MAP: Record<string, { city: string; state: string }> = {
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '560001': { city: 'Bangalore', state: 'Karnataka' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '695001': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
}

// ============================================================================
// Client Class
// ============================================================================

/**
 * Shiprocket API Client
 *
 * Manages authentication and provides methods for all shipping operations.
 * Tokens are cached in memory and automatically refreshed before expiry.
 *
 * Authentication:
 * - Tokens are valid for 10 days
 * - Client refreshes after 9 days to avoid expiry during requests
 * - Credentials come from environment variables
 */
class ShiprocketClient {
  /** Cached authentication token */
  private token: string | null = null

  /** Token expiry timestamp (milliseconds) */
  private tokenExpiry: number | null = null

  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Authenticates with Shiprocket API and retrieves access token.
   * Tokens are cached and reused until near expiry.
   *
   * @returns Valid authentication token
   * @throws Error if credentials are missing or auth fails
   */
  async getAuthToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token
    }

    const email = process.env.SHIPROCKET_EMAIL
    const password = process.env.SHIPROCKET_PASSWORD

    if (!email || !password) {
      throw new Error(
        'Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables.'
      )
    }

    try {
      const response = await fetch(`${BASE_URL}/external/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(
          `Shiprocket authentication failed: ${response.status} ${error}`
        )
      }

      const data: ShiprocketAuthResponse = await response.json()

      this.token = data.token
      // Refresh after 9 days (tokens last 10 days)
      this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000

      return this.token
    } catch (error) {
      console.error('Shiprocket authentication error:', error)
      throw error
    }
  }

  // ==========================================================================
  // Serviceability
  // ==========================================================================

  /**
   * Checks if delivery is possible between two pincodes.
   * Returns available courier options with rates and ETAs.
   *
   * @param pickupPincode - Warehouse/pickup location pincode
   * @param deliveryPincode - Customer delivery pincode
   * @param weight - Package weight in kilograms
   * @param cod - Payment type (0 = prepaid, 1 = COD)
   * @returns Serviceability data with courier options
   * @throws Error if check fails
   *
   * @example
   * ```ts
   * const result = await shiprocketClient.checkServiceability(
   *   "400001",  // Mumbai
   *   "110001",  // Delhi
   *   0.5,       // 500 grams
   *   0          // Prepaid
   * )
   * console.log(result.data.available_courier_companies)
   * ```
   */
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    cod: 0 | 1 = 0
  ): Promise<ServiceabilityResponse> {
    const token = await this.getAuthToken()

    try {
      const params = new URLSearchParams({
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weight.toString(),
        cod: cod.toString(),
      })

      const response = await fetch(
        `${BASE_URL}/external/courier/serviceability?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(
          `Serviceability check failed: ${response.status} ${error}`
        )
      }

      const data: ServiceabilityResponse = await response.json()
      return data
    } catch (error) {
      console.error('Shiprocket serviceability error:', error)
      throw error
    }
  }

  // ==========================================================================
  // Tracking
  // ==========================================================================

  /**
   * Tracks a shipment using its AWB (Air Waybill) number.
   * Returns current status and tracking history.
   *
   * @param awbNumber - The AWB number assigned by the courier
   * @returns Tracking information with status timeline
   * @throws Error if tracking fails
   *
   * @example
   * ```ts
   * const tracking = await shiprocketClient.trackShipment("1234567890")
   * console.log(tracking.tracking_data.shipment_status)
   * ```
   */
  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    const token = await this.getAuthToken()

    try {
      const response = await fetch(
        `${BASE_URL}/external/courier/track/awb/${awbNumber}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Tracking failed: ${response.status} ${error}`)
      }

      const data: TrackingResponse = await response.json()
      return data
    } catch (error) {
      console.error('Shiprocket tracking error:', error)
      throw error
    }
  }

  // ==========================================================================
  // Pincode Lookup
  // ==========================================================================

  /**
   * Gets basic location details for a pincode from static map.
   * Returns null if pincode is not in the local database.
   *
   * Note: For comprehensive coverage, integrate with India Post API
   * or a third-party pincode database.
   *
   * @param pincode - 6-digit Indian pincode
   * @returns Location details or null if not found
   */
  getPincodeDetails(pincode: string): PincodeData | null {
    const details = PINCODE_MAP[pincode]
    if (!details) {
      return null
    }

    return {
      pincode,
      city: details.city,
      state: details.state,
      serviceable: false,
      estimatedDays: 0,
      shippingCost: 0,
    }
  }

  // ==========================================================================
  // Order Management
  // ==========================================================================

  /**
   * Creates a shipping order in Shiprocket.
   * The order will be ready for courier assignment and AWB generation.
   *
   * @param orderData - Complete order details including items and address
   * @returns Created order response with Shiprocket IDs
   * @throws Error if order creation fails
   *
   * @example
   * ```ts
   * const order = await shiprocketClient.createOrder({
   *   order_id: "ORD-12345",
   *   order_date: "2024-12-26",
   *   pickup_location: "Primary",
   *   billing_customer_name: "John",
   *   billing_last_name: "Doe",
   *   billing_address: "123 Main St",
   *   billing_city: "Mumbai",
   *   billing_pincode: "400001",
   *   billing_state: "Maharashtra",
   *   billing_country: "India",
   *   billing_email: "john@example.com",
   *   billing_phone: "9876543210",
   *   shipping_is_billing: true,
   *   order_items: [...],
   *   payment_method: "Prepaid",
   *   sub_total: 1999,
   *   length: 20,
   *   breadth: 15,
   *   height: 10,
   *   weight: 0.5,
   * })
   * ```
   */
  async createOrder(
    orderData: CreateShiprocketOrderRequest
  ): Promise<CreateShiprocketOrderResponse> {
    const token = await this.getAuthToken()

    try {
      const response = await fetch(`${BASE_URL}/external/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Shiprocket order creation failed: ${response.status} ${error}`)
      }

      const data: CreateShiprocketOrderResponse = await response.json()
      return data
    } catch (error) {
      console.error('Shiprocket order creation error:', error)
      throw error
    }
  }

  /**
   * Generates AWB (Air Waybill) for a shipment.
   * This assigns a courier and creates a tracking number.
   *
   * @param shipmentId - Shiprocket shipment ID from order creation
   * @param courierId - Optional specific courier ID (auto-select if omitted)
   * @returns AWB details including tracking number
   * @throws Error if AWB generation fails
   *
   * @example
   * ```ts
   * // Auto-select courier
   * const awb = await shiprocketClient.generateAWB(12345)
   *
   * // Specific courier
   * const awb = await shiprocketClient.generateAWB(12345, 10)
   * ```
   */
  async generateAWB(
    shipmentId: number,
    courierId?: number
  ): Promise<GenerateAWBResponse> {
    const token = await this.getAuthToken()

    try {
      const body: { shipment_id: number; courier_id?: number } = {
        shipment_id: shipmentId,
      }
      if (courierId) {
        body.courier_id = courierId
      }

      const response = await fetch(`${BASE_URL}/external/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`AWB generation failed: ${response.status} ${error}`)
      }

      const data: GenerateAWBResponse = await response.json()
      return data
    } catch (error) {
      console.error('AWB generation error:', error)
      throw error
    }
  }
}

// ============================================================================
// Export
// ============================================================================

/**
 * Singleton Shiprocket client instance.
 * Reuse this across the application to maintain token cache.
 */
export const shiprocketClient = new ShiprocketClient()
