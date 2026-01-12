'use server'

import { shiprocketClient } from './client'
import type { PincodeData, TrackingActivity } from './types'

// Default warehouse pincode (Mumbai)
const DEFAULT_WAREHOUSE_PINCODE = '400001'

// Default package weight in kg (can be made dynamic based on products)
const DEFAULT_PACKAGE_WEIGHT = 0.5

// Default shipping cost when Shiprocket is not configured
const DEFAULT_SHIPPING_COST = 99

// Estimated delivery days when Shiprocket is not configured
const DEFAULT_ESTIMATED_DAYS = 5

interface ServiceabilityResult {
  success: boolean
  data?: PincodeData
  error?: string
  shiprocketConfigured?: boolean
}

interface TrackingResult {
  success: boolean
  data?: TrackingActivity[]
  status?: string
  error?: string
}

/**
 * Checks if Shiprocket credentials are configured
 */
function isShiprocketConfigured(): boolean {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD)
}

/**
 * Checks if delivery is serviceable to a given pincode
 * Returns the best courier option (cheapest with reasonable delivery time)
 * Falls back to default values if Shiprocket is not configured
 * @param pincode - Customer delivery pincode
 */
export async function checkPincodeServiceability(
  pincode: string
): Promise<ServiceabilityResult> {
  try {
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        error: 'Invalid pincode. Please enter a valid 6-digit pincode.',
      }
    }

    // Get basic pincode details
    const pincodeDetails = shiprocketClient.getPincodeDetails(pincode)

    // If Shiprocket is not configured, return default values
    if (!isShiprocketConfigured()) {
      console.warn('Shiprocket not configured. Using default shipping values.')
      const data: PincodeData = {
        pincode,
        city: pincodeDetails?.city || 'Unknown',
        state: pincodeDetails?.state || 'Unknown',
        serviceable: true,
        estimatedDays: DEFAULT_ESTIMATED_DAYS,
        shippingCost: DEFAULT_SHIPPING_COST,
        courierName: 'Standard Delivery',
      }
      return {
        success: true,
        data,
        shiprocketConfigured: false,
      }
    }

    // Check serviceability with Shiprocket
    const serviceabilityResponse = await shiprocketClient.checkServiceability(
      DEFAULT_WAREHOUSE_PINCODE,
      pincode,
      DEFAULT_PACKAGE_WEIGHT,
      0 // Prepaid
    )

    // Check if any couriers are available
    if (
      !serviceabilityResponse.data?.available_courier_companies ||
      serviceabilityResponse.data.available_courier_companies.length === 0
    ) {
      return {
        success: false,
        error:
          'Delivery not available to this pincode. Please try a different pincode or contact support.',
      }
    }

    // Find the best courier option (cheapest with delivery within 7 days)
    const couriers = serviceabilityResponse.data.available_courier_companies
    const bestCourier = couriers
      .filter((c) => c.estimated_delivery_days <= 7)
      .sort((a, b) => {
        // Sort by rate first, then by delivery days
        if (a.rate === b.rate) {
          return a.estimated_delivery_days - b.estimated_delivery_days
        }
        return a.rate - b.rate
      })[0]

    // If no courier delivers within 7 days, pick the fastest
    const selectedCourier =
      bestCourier ||
      couriers.sort(
        (a, b) => a.estimated_delivery_days - b.estimated_delivery_days
      )[0]

    // Build response
    const data: PincodeData = {
      pincode,
      city: pincodeDetails?.city || 'Unknown',
      state: pincodeDetails?.state || 'Unknown',
      serviceable: true,
      estimatedDays: selectedCourier.estimated_delivery_days,
      shippingCost: Math.round(selectedCourier.rate * 100) / 100,
      courierName: selectedCourier.courier_name,
    }

    return {
      success: true,
      data,
      shiprocketConfigured: true,
    }
  } catch (error) {
    console.error('Pincode serviceability check error:', error)

    // If error is about missing credentials, fall back to default shipping
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('credentials not configured')) {
      const pincodeDetails = shiprocketClient.getPincodeDetails(pincode)
      const data: PincodeData = {
        pincode,
        city: pincodeDetails?.city || 'Unknown',
        state: pincodeDetails?.state || 'Unknown',
        serviceable: true,
        estimatedDays: DEFAULT_ESTIMATED_DAYS,
        shippingCost: DEFAULT_SHIPPING_COST,
        courierName: 'Standard Delivery',
      }
      return {
        success: true,
        data,
        shiprocketConfigured: false,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to check serviceability. Please try again later.',
    }
  }
}

/**
 * Gets tracking information for an order using AWB number
 * @param awbNumber - The AWB (Air Waybill) tracking number
 */
export async function getOrderTracking(
  awbNumber: string
): Promise<TrackingResult> {
  try {
    // Validate AWB number (basic validation)
    if (!awbNumber || awbNumber.trim().length === 0) {
      return {
        success: false,
        error: 'Please provide a valid tracking number.',
      }
    }

    const trackingResponse = await shiprocketClient.trackShipment(
      awbNumber.trim()
    )

    // Extract tracking activities
    const activities =
      trackingResponse.tracking_data?.shipment_track_activities || []
    const status =
      trackingResponse.tracking_data?.shipment_status_text || 'Unknown'

    if (activities.length === 0) {
      return {
        success: false,
        error:
          'No tracking information found for this AWB number. Please verify the tracking number or try again later.',
      }
    }

    return {
      success: true,
      data: activities,
      status,
    }
  } catch (error) {
    console.error('Order tracking error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to retrieve tracking information. Please try again later.',
    }
  }
}
