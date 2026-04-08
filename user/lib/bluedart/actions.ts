'use server'

import { blueDartClient } from './client'
import type { PincodeData, TrackingActivity } from './types'
import { mapBlueDartError, getBlueDartHealthStatus } from './config'
import { createDiagnostic, saveDiagnostic, type ShipmentDiagnostic } from './diagnostics'

// Default warehouse pincode (Hissar / origin area)
const DEFAULT_WAREHOUSE_PINCODE = '125001'

// Default shipping cost when Blue Dart is not configured
const DEFAULT_SHIPPING_COST = 99

// Estimated delivery days when Blue Dart is not configured
const DEFAULT_ESTIMATED_DAYS = 5

interface ServiceabilityResult {
  success: boolean
  data?: PincodeData
  error?: string
  bluedartConfigured?: boolean
}

interface TrackingResult {
  success: boolean
  data?: TrackingActivity[]
  status?: string
  error?: string
}

/**
 * Checks if Blue Dart credentials are configured
 */
function isBlueDartConfigured(): boolean {
  return !!(process.env.BLUEDART_LOGIN_ID && process.env.BLUEDART_LICENSE_KEY)
}

/**
 * Checks if delivery is serviceable to a given pincode.
 * Returns the best courier option with shipping cost and estimated days.
 * Falls back to default values if Blue Dart is not configured.
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

    // Get basic pincode details from static map
    const pincodeDetails = blueDartClient.getPincodeDetails(pincode)

    // If Blue Dart is not configured, return default values
    if (!isBlueDartConfigured()) {
      console.warn('Blue Dart not configured. Using default shipping values.')
      const data: PincodeData = {
        pincode,
        city: pincodeDetails?.city || 'Unknown',
        state: pincodeDetails?.state || 'Unknown',
        serviceable: true,
        estimatedDays: DEFAULT_ESTIMATED_DAYS,
        shippingCost: DEFAULT_SHIPPING_COST,
        courierName: 'Blue Dart',
      }
      return {
        success: true,
        data,
        bluedartConfigured: false,
      }
    }

    // Check serviceability with Blue Dart API
    const serviceabilityResponse = await blueDartClient.checkServiceability(
      DEFAULT_WAREHOUSE_PINCODE,
      pincode
    )

    const result = serviceabilityResponse.GetServicesforPincodeResult

    // Check for errors or non-serviceable pincode
    if (!result || result.IsError) {
      return {
        success: false,
        error:
          result?.ErrorMessage ||
          'Delivery not available to this pincode. Please try a different pincode or contact support.',
      }
    }

    // If no area code returned, the pincode is not serviceable
    if (!result.AreaCode) {
      return {
        success: false,
        error:
          'Delivery not available to this pincode. Please try a different pincode or contact support.',
      }
    }

    // Get transit time for a more accurate estimate.
    // Blue Dart's response doesn't include a "TransitDays" field — it returns
    // AdditionalDays (over a product base) plus an ExpectedDateDelivery string.
    // Base transit for Air (A): ~2 days; Ground (S): ~4 days.
    let transitDays = DEFAULT_ESTIMATED_DAYS
    try {
      const transitResponse = await blueDartClient.getTransitTime(
        DEFAULT_WAREHOUSE_PINCODE,
        pincode
      )
      const transitResult =
        transitResponse.GetDomesticTransitTimeForPinCodeandProductResult
      if (transitResult && !transitResult.IsError) {
        // Prefer ExpectedDateDelivery if BD populated it
        if (transitResult.ExpectedDateDelivery) {
          const match = transitResult.ExpectedDateDelivery.match(/Date\((\d+)/)
          if (match) {
            const delivery = new Date(parseInt(match[1], 10))
            const now = new Date()
            const diff = Math.ceil(
              (delivery.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            )
            if (diff > 0) transitDays = diff
          }
        } else {
          // Fallback: base 2 (Air) + additional days reported by BD
          transitDays = 2 + (transitResult.AdditionalDays || 0)
        }
      }
    } catch {
      // Use default if transit time lookup fails
    }

    const data: PincodeData = {
      pincode,
      city: result.CityName || pincodeDetails?.city || 'Unknown',
      state: result.StateName || pincodeDetails?.state || 'Unknown',
      serviceable: true,
      estimatedDays: transitDays,
      shippingCost: DEFAULT_SHIPPING_COST,
      courierName: 'Blue Dart',
    }

    return {
      success: true,
      data,
      bluedartConfigured: true,
    }
  } catch (error) {
    console.error('Pincode serviceability check error:', error)

    // If error is about missing credentials or API authorization, fall back to default shipping
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('credentials not configured') ||
      errorMessage.includes('401') ||
      errorMessage.includes('Access to the method is not allowed')
    ) {
      const pincodeDetails = blueDartClient.getPincodeDetails(pincode)
      const data: PincodeData = {
        pincode,
        city: pincodeDetails?.city || 'Unknown',
        state: pincodeDetails?.state || 'Unknown',
        serviceable: true,
        estimatedDays: DEFAULT_ESTIMATED_DAYS,
        shippingCost: DEFAULT_SHIPPING_COST,
        courierName: 'Blue Dart',
      }
      return {
        success: true,
        data,
        bluedartConfigured: false,
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
 * Creates a shipment by generating a waybill and registering a pickup.
 * Enhanced with diagnostics persistence and detailed error tracking.
 */
export async function createShipment(orderData: {
  orderId: string
  consigneeName: string
  consigneeAddress1: string
  consigneeAddress2?: string
  consigneePincode: string
  consigneeMobile: string
  productCode?: string
  subProductCode?: string
  pieceCount?: number
  weight: number
  declaredValue: number
  pickupDate: string
  pickupTime: string
}) {
  // Determine mode
  const health = getBlueDartHealthStatus()
  const mode = health.mode === 'live' ? 'live' : 'fallback'

  // Create diagnostic record
  const diagnostic = createDiagnostic(orderData.orderId, orderData, mode)

  try {
    if (!isBlueDartConfigured()) {
      const error = new Error('Blue Dart is not configured.')
      const errorMapping = mapBlueDartError(error)
      diagnostic.error = errorMapping
      diagnostic.response = {
        success: false,
        error: errorMapping.userMessage,
      }
      await saveDiagnostic(diagnostic)

      return {
        success: false,
        error: 'Blue Dart is not configured.',
      }
    }

    const isSandbox = process.env.BLUEDART_SANDBOX === 'true'
    const customerName = isSandbox
      ? process.env.BLUEDART_SANDBOX_CUSTOMER_NAME?.trim() || process.env.BLUEDART_CUSTOMER_NAME || ''
      : process.env.BLUEDART_CUSTOMER_NAME || ''
    const customerCode = isSandbox
      ? process.env.BLUEDART_SANDBOX_CUSTOMER_CODE?.trim() || process.env.BLUEDART_CUSTOMER_CODE || ''
      : process.env.BLUEDART_CUSTOMER_CODE || ''
    const originArea = isSandbox
      ? process.env.BLUEDART_SANDBOX_ORIGIN_AREA?.trim() || process.env.BLUEDART_ORIGIN_AREA || ''
      : process.env.BLUEDART_ORIGIN_AREA || ''

    // Generate waybill with timing
    const waybillStartTime = Date.now()
    diagnostic.apiCalls.waybill = {
      requestedAt: new Date().toISOString(),
      success: false,
    }

    let waybillResponse
    try {
      waybillResponse = await blueDartClient.generateWaybill({
        Consignee: {
          ConsigneeName: orderData.consigneeName,
          ConsigneeAddress1: orderData.consigneeAddress1,
          ConsigneeAddress2: orderData.consigneeAddress2,
          ConsigneePincode: orderData.consigneePincode,
          ConsigneeMobile: orderData.consigneeMobile,
        },
        Shipper: {
          CustomerName: customerName,
          CustomerCode: customerCode,
          OriginArea: originArea,
          CustomerAddress1: '',
          CustomerPincode: DEFAULT_WAREHOUSE_PINCODE,
          CustomerMobile: '',
          Sender: customerName,
        },
        Services: {
          ProductCode: orderData.productCode || 'A',
          ProductType: 1,
          SubProductCode: orderData.subProductCode || 'P',
          PieceCount: String(orderData.pieceCount || 1),
          ActualWeight: String(orderData.weight),
          CreditReferenceNo: orderData.orderId,
          DeclaredValue: String(orderData.declaredValue),
          // Convert to /Date(epoch_ms)/ format if not already
          PickupDate: orderData.pickupDate.startsWith('/Date(')
            ? orderData.pickupDate
            : `/Date(${new Date(orderData.pickupDate).getTime()})/`,
          PickupTime: orderData.pickupTime,
          RegisterPickup: true,
        },
      })

      diagnostic.apiCalls.waybill.completedAt = new Date().toISOString()
      diagnostic.apiCalls.waybill.durationMs = Date.now() - waybillStartTime
      diagnostic.apiCalls.waybill.success = true
    } catch (waybillError) {
      diagnostic.apiCalls.waybill.completedAt = new Date().toISOString()
      diagnostic.apiCalls.waybill.durationMs = Date.now() - waybillStartTime
      diagnostic.apiCalls.waybill.error =
        waybillError instanceof Error ? waybillError.message : 'Unknown error'

      const errorMapping = mapBlueDartError(waybillError)
      diagnostic.error = errorMapping
      diagnostic.response = {
        success: false,
        error: errorMapping.userMessage,
      }
      await saveDiagnostic(diagnostic)

      throw waybillError
    }

    const waybillResult = waybillResponse.GenerateWayBillResult

    if (!waybillResult || waybillResult.IsError) {
      const errorMessages =
        waybillResult?.ErrorMessage?.join(', ') || 'Unknown error'
      const error = new Error(`Waybill generation failed: ${errorMessages}`)

      diagnostic.apiCalls.waybill.success = false
      diagnostic.apiCalls.waybill.error = errorMessages

      const errorMapping = mapBlueDartError(error)
      diagnostic.error = errorMapping
      diagnostic.response = {
        success: false,
        error: errorMapping.userMessage,
      }
      await saveDiagnostic(diagnostic)

      return {
        success: false,
        error: `Waybill generation failed: ${errorMessages}`,
      }
    }

    // Pickup is already registered inline when RegisterPickup=true on the
    // waybill request above — Blue Dart returns the TokenNumber directly in
    // GenerateWayBillResult. No second call needed.
    const pickupToken = waybillResult.TokenNumber || undefined
    diagnostic.apiCalls.pickup = {
      requestedAt: diagnostic.apiCalls.waybill.requestedAt,
      completedAt: diagnostic.apiCalls.waybill.completedAt,
      durationMs: 0,
      success: !!pickupToken,
    }

    // Success
    diagnostic.response = {
      success: true,
      awbNumber: waybillResult.AWBNo,
      destinationArea: waybillResult.DestinationArea,
      destinationLocation: waybillResult.DestinationLocation,
      pickupToken,
    }
    await saveDiagnostic(diagnostic)

    return {
      success: true,
      awbNumber: waybillResult.AWBNo,
      destinationArea: waybillResult.DestinationArea,
      destinationLocation: waybillResult.DestinationLocation,
      pickupToken,
    }
  } catch (error) {
    console.error('Blue Dart shipment creation error:', error)

    // Map error if not already done
    if (!diagnostic.error) {
      const errorMapping = mapBlueDartError(error)
      diagnostic.error = errorMapping
      diagnostic.response = {
        success: false,
        error: errorMapping.userMessage,
      }
      await saveDiagnostic(diagnostic)
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create shipment. Please try again later.',
    }
  }
}

/**
 * Gets tracking information for a shipment using waybill number.
 */
export async function getOrderTracking(
  awbNumber: string
): Promise<TrackingResult> {
  try {
    if (!awbNumber || awbNumber.trim().length === 0) {
      return {
        success: false,
        error: 'Please provide a valid tracking number.',
      }
    }

    const trackingResponse = await blueDartClient.trackShipment(
      awbNumber.trim()
    )

    // The custawbquery JSON endpoint returns an object, not an array.
    // Shape: { ShipmentData: { Error?: string, Shipment?: Shipment | Shipment[] } }
    const data = trackingResponse.ShipmentData
    if (!data || data.Error) {
      return {
        success: false,
        error:
          data?.Error ||
          'No tracking information found for this waybill number. Please verify the tracking number or try again later.',
      }
    }

    // Shipment can be either a single object or an array
    const shipment = Array.isArray(data.Shipment) ? data.Shipment[0] : data.Shipment
    if (!shipment || !shipment.Scans || shipment.Scans.length === 0) {
      return {
        success: false,
        error:
          'No tracking information available yet for this waybill number.',
      }
    }

    // Map Blue Dart scan details to TrackingActivity format
    const activities: TrackingActivity[] = shipment.Scans.map((scan) => ({
      date: scan.ScanDetail.ScanDateTime,
      status: scan.ScanDetail.ScanType,
      activity: scan.ScanDetail.Instructions || scan.ScanDetail.Scan,
      location: scan.ScanDetail.ScannedLocation,
    }))

    return {
      success: true,
      data: activities,
      status: shipment.Status,
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
