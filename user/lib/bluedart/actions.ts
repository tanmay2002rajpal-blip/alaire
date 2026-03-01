'use server'

import { blueDartClient } from './client'
import type { PincodeData, TrackingActivity } from './types'

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

    // Get transit time for a more accurate estimate
    let transitDays = DEFAULT_ESTIMATED_DAYS
    try {
      const transitResponse = await blueDartClient.getTransitTime(
        DEFAULT_WAREHOUSE_PINCODE,
        pincode
      )
      const transitResult =
        transitResponse.GetDomesticTransitTimeForPinCodeandProductResult
      if (transitResult && !transitResult.IsError && transitResult.TransitDays) {
        transitDays = transitResult.TransitDays
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

    // If error is about missing credentials, fall back to default shipping
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('credentials not configured')) {
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
  try {
    if (!isBlueDartConfigured()) {
      return {
        success: false,
        error: 'Blue Dart is not configured.',
      }
    }

    const customerName = process.env.BLUEDART_CUSTOMER_NAME || ''
    const customerCode = process.env.BLUEDART_CUSTOMER_CODE || ''
    const originArea = process.env.BLUEDART_ORIGIN_AREA || ''

    // Generate waybill
    const waybillResponse = await blueDartClient.generateWaybill({
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
        PickupDate: orderData.pickupDate,
        PickupTime: orderData.pickupTime,
      },
    })

    const waybillResult = waybillResponse.GenerateWayBillResult

    if (!waybillResult || waybillResult.IsError) {
      const errorMessages = waybillResult?.ErrorMessage?.join(', ') || 'Unknown error'
      return {
        success: false,
        error: `Waybill generation failed: ${errorMessages}`,
      }
    }

    // Register pickup
    const pickupResponse = await blueDartClient.registerPickup({
      PickupDate: orderData.pickupDate,
      PickupTime: orderData.pickupTime,
      CustomerCode: customerCode,
      OriginArea: originArea,
      CustomerName: customerName,
      CustomerMobile: '',
      CustomerAddress1: '',
      CustomerPincode: DEFAULT_WAREHOUSE_PINCODE,
      PackageCount: orderData.pieceCount || 1,
      ProductCode: orderData.productCode || 'A',
    })

    const pickupResult = pickupResponse.RegisterPickupResult

    return {
      success: true,
      awbNumber: waybillResult.AWBNo,
      destinationArea: waybillResult.DestinationArea,
      destinationLocation: waybillResult.DestinationLocation,
      pickupToken: pickupResult?.TokenNumber || null,
    }
  } catch (error) {
    console.error('Blue Dart shipment creation error:', error)
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

    const shipmentData = trackingResponse.ShipmentData?.[0]?.Shipment
    if (!shipmentData || !shipmentData.Scans || shipmentData.Scans.length === 0) {
      return {
        success: false,
        error:
          'No tracking information found for this waybill number. Please verify the tracking number or try again later.',
      }
    }

    // Map Blue Dart scan details to TrackingActivity format
    const activities: TrackingActivity[] = shipmentData.Scans.map((scan) => ({
      date: scan.ScanDetail.ScanDateTime,
      status: scan.ScanDetail.ScanType,
      activity: scan.ScanDetail.Instructions || scan.ScanDetail.Scan,
      location: scan.ScanDetail.ScannedLocation,
    }))

    return {
      success: true,
      data: activities,
      status: shipmentData.Status,
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
