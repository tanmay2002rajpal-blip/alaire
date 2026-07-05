'use server'

import { fshipClient } from './client'
import type { PincodeData, TrackingActivity } from './types'
import { mapFShipError, getFShipHealthStatus, isFShipConfigured } from './config'
import { createDiagnostic, saveDiagnostic } from './diagnostics'

const DEFAULT_WAREHOUSE_PINCODE = process.env.FSHIP_WAREHOUSE_PINCODE || '125001'
const DEFAULT_SHIPPING_COST = 99
const DEFAULT_ESTIMATED_DAYS = 5

const PINCODE_PREFIX_MAP: Record<string, { city: string; state: string }> = {
  '110': { city: 'New Delhi', state: 'Delhi' },
  '120': { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  '121': { city: 'Faridabad', state: 'Haryana' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '125': { city: 'Hisar', state: 'Haryana' },
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '560': { city: 'Bangalore', state: 'Karnataka' },
  '570': { city: 'Mysore', state: 'Karnataka' },
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '751': { city: 'Bhubaneswar', state: 'Odisha' },
  '781': { city: 'Guwahati', state: 'Assam' },
  '800': { city: 'Patna', state: 'Bihar' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' },
  '180': { city: 'Jammu', state: 'Jammu & Kashmir' },
}

function getPincodeDetails(pincode: string): { city: string; state: string } | null {
  const prefix = pincode.slice(0, 3)
  return PINCODE_PREFIX_MAP[prefix] || null
}

interface ServiceabilityResult {
  success: boolean
  data?: PincodeData
  error?: string
  fshipConfigured?: boolean
}

interface TrackingResult {
  success: boolean
  data?: TrackingActivity[]
  status?: string
  error?: string
}

export async function checkPincodeServiceability(
  pincode: string
): Promise<ServiceabilityResult> {
  try {
    if (!/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        error: 'Invalid pincode. Please enter a valid 6-digit pincode.',
      }
    }

    const pincodeDetails = getPincodeDetails(pincode)

    if (!isFShipConfigured()) {
      console.warn('FShip not configured. Using default shipping values.')
      return {
        success: true,
        data: {
          pincode,
          city: pincodeDetails?.city || 'Unknown',
          state: pincodeDetails?.state || 'Unknown',
          serviceable: true,
          estimatedDays: DEFAULT_ESTIMATED_DAYS,
          shippingCost: DEFAULT_SHIPPING_COST,
          courierName: 'FShip',
        },
        fshipConfigured: false,
      }
    }

    const serviceabilityResponse = await fshipClient.checkServiceability(
      DEFAULT_WAREHOUSE_PINCODE,
      pincode
    )

    if (!serviceabilityResponse.status) {
      return {
        success: false,
        error: serviceabilityResponse.response ||
          'Delivery not available to this pincode. Please try a different pincode or contact support.',
      }
    }

    const isServiceable =
      serviceabilityResponse.delivery === 'Yes' || serviceabilityResponse.cod === 'Yes'

    if (!isServiceable) {
      return {
        success: false,
        error: 'Delivery not available to this pincode. Please try a different pincode or contact support.',
      }
    }

    let shippingCost = DEFAULT_SHIPPING_COST
    try {
      const rateResponse = await fshipClient.calculateRates({
        source_Pincode: DEFAULT_WAREHOUSE_PINCODE,
        destination_Pincode: pincode,
        payment_Mode: 'P',
        amount: 500,
        express_Type: 'air',
        shipment_Weight: 0.5,
        shipment_Length: 20,
        shipment_Width: 15,
        shipment_Height: 10,
        volumetric_Weight: 0,
      })

      if (rateResponse.status && rateResponse.shipment_rates?.length > 0) {
        const cheapest = rateResponse.shipment_rates.reduce((min, rate) =>
          rate.shipping_charge < min.shipping_charge ? rate : min
        )
        shippingCost = Math.ceil(cheapest.shipping_charge)
      }
    } catch {
      // Use default if rate calculation fails
    }

    return {
      success: true,
      data: {
        pincode,
        city: pincodeDetails?.city || 'Unknown',
        state: pincodeDetails?.state || 'Unknown',
        serviceable: true,
        estimatedDays: DEFAULT_ESTIMATED_DAYS,
        shippingCost,
        courierName: 'FShip',
      },
      fshipConfigured: true,
    }
  } catch (error) {
    console.error('Pincode serviceability check error:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('not configured') ||
      errorMessage.includes('401') ||
      errorMessage.includes('API key')
    ) {
      const pincodeDetails = getPincodeDetails(pincode)
      return {
        success: true,
        data: {
          pincode,
          city: pincodeDetails?.city || 'Unknown',
          state: pincodeDetails?.state || 'Unknown',
          serviceable: true,
          estimatedDays: DEFAULT_ESTIMATED_DAYS,
          shippingCost: DEFAULT_SHIPPING_COST,
          courierName: 'FShip',
        },
        fshipConfigured: false,
      }
    }

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to check serviceability. Please try again later.',
    }
  }
}

export async function createShipment(orderData: {
  orderId: string
  consigneeName: string
  consigneeAddress1: string
  consigneeAddress2?: string
  consigneePincode: string
  consigneeMobile: string
  consigneeEmail?: string
  consigneeCity?: string
  productCode?: string
  subProductCode?: string
  pieceCount?: number
  weight: number
  declaredValue: number
  pickupDate: string
  pickupTime: string
  paymentMode?: 'prepaid' | 'cod'
  codAmount?: number
  products?: Array<{
    name: string
    price: number
    quantity: number
    sku?: string
  }>
}) {
  const health = getFShipHealthStatus()
  const mode = health.mode === 'live' ? 'live' : 'sandbox'

  const diagnostic = createDiagnostic(orderData.orderId, {
    orderId: orderData.orderId,
    consigneeName: orderData.consigneeName,
    consigneeAddress1: orderData.consigneeAddress1,
    consigneeAddress2: orderData.consigneeAddress2,
    consigneePincode: orderData.consigneePincode,
    consigneeMobile: orderData.consigneeMobile,
    weight: orderData.weight,
    declaredValue: orderData.declaredValue,
  }, mode as 'live' | 'sandbox')

  try {
    if (!isFShipConfigured()) {
      const error = new Error('FShip is not configured.')
      const errorMapping = mapFShipError(error)
      diagnostic.error = errorMapping
      diagnostic.response = { success: false, error: errorMapping.userMessage }
      await saveDiagnostic(diagnostic)
      return { success: false, error: 'FShip is not configured.' }
    }

    const warehouseId = parseInt(process.env.FSHIP_WAREHOUSE_ID || '0', 10)
    if (!warehouseId) {
      const error = new Error('FShip warehouse ID not configured.')
      const errorMapping = mapFShipError(error)
      diagnostic.error = errorMapping
      diagnostic.response = { success: false, error: errorMapping.userMessage }
      await saveDiagnostic(diagnostic)
      return { success: false, error: 'FShip warehouse ID not configured.' }
    }

    const isCod = orderData.paymentMode === 'cod'
    const products = orderData.products?.map((p) => ({
      productName: p.name,
      unitPrice: p.price,
      quantity: p.quantity,
      sku: p.sku || '',
    })) || [{
      productName: 'Order Item',
      unitPrice: orderData.declaredValue,
      quantity: 1,
    }]

    const createStartTime = Date.now()
    diagnostic.apiCalls.createOrder = {
      requestedAt: new Date().toISOString(),
      success: false,
    }

    let createResponse
    try {
      createResponse = await fshipClient.createForwardOrder({
        customer_Name: orderData.consigneeName,
        customer_Mobile: orderData.consigneeMobile,
        customer_Emailid: orderData.consigneeEmail || '',
        customer_Address: [orderData.consigneeAddress1, orderData.consigneeAddress2].filter(Boolean).join(', '),
        customer_Address_Type: 'Home',
        customer_PinCode: orderData.consigneePincode,
        customer_City: orderData.consigneeCity || '',
        orderId: orderData.orderId,
        payment_Mode: isCod ? 1 : 2,
        express_Type: 'air',
        order_Amount: orderData.declaredValue,
        total_Amount: orderData.declaredValue,
        cod_Amount: isCod ? (orderData.codAmount || orderData.declaredValue) : 0,
        shipment_Weight: orderData.weight,
        shipment_Length: 20,
        shipment_Width: 15,
        shipment_Height: 10,
        volumetric_Weight: 0,
        pick_Address_ID: warehouseId,
        products,
      })

      diagnostic.apiCalls.createOrder.completedAt = new Date().toISOString()
      diagnostic.apiCalls.createOrder.durationMs = Date.now() - createStartTime
      diagnostic.apiCalls.createOrder.success = true
    } catch (createError) {
      diagnostic.apiCalls.createOrder.completedAt = new Date().toISOString()
      diagnostic.apiCalls.createOrder.durationMs = Date.now() - createStartTime
      diagnostic.apiCalls.createOrder.error =
        createError instanceof Error ? createError.message : 'Unknown error'

      const errorMapping = mapFShipError(createError)
      diagnostic.error = errorMapping
      diagnostic.response = { success: false, error: errorMapping.userMessage }
      await saveDiagnostic(diagnostic)
      throw createError
    }

    if (!createResponse.status) {
      const errorMsg = createResponse.response || 'Order creation failed'
      diagnostic.apiCalls.createOrder.success = false
      diagnostic.apiCalls.createOrder.error = errorMsg
      const errorMapping = mapFShipError(new Error(errorMsg))
      diagnostic.error = errorMapping
      diagnostic.response = { success: false, error: errorMsg }
      await saveDiagnostic(diagnostic)
      return { success: false, error: `Order creation failed: ${errorMsg}` }
    }

    // Register pickup
    const pickupStartTime = Date.now()
    diagnostic.apiCalls.registerPickup = {
      requestedAt: new Date().toISOString(),
      success: false,
    }

    let pickupOrderId: number | undefined
    try {
      const pickupResponse = await fshipClient.registerPickup([createResponse.waybill])
      diagnostic.apiCalls.registerPickup.completedAt = new Date().toISOString()
      diagnostic.apiCalls.registerPickup.durationMs = Date.now() - pickupStartTime
      diagnostic.apiCalls.registerPickup.success = pickupResponse.status
      if (pickupResponse.status && pickupResponse.apipickuporderids?.length > 0) {
        pickupOrderId = pickupResponse.apipickuporderids[0].pickupOrderId
      }
    } catch (pickupError) {
      diagnostic.apiCalls.registerPickup.completedAt = new Date().toISOString()
      diagnostic.apiCalls.registerPickup.durationMs = Date.now() - pickupStartTime
      diagnostic.apiCalls.registerPickup.error =
        pickupError instanceof Error ? pickupError.message : 'Unknown error'
      // Non-fatal - order was still created
    }

    diagnostic.response = {
      success: true,
      awbNumber: createResponse.waybill,
      apiOrderId: createResponse.apiorderid,
      courierName: 'FShip',
    }
    await saveDiagnostic(diagnostic)

    return {
      success: true,
      awbNumber: createResponse.waybill,
      apiOrderId: createResponse.apiorderid,
      pickupOrderId,
      labelUrl: createResponse.labelurl,
      routingCode: createResponse.route_code,
      courierName: 'FShip',
    }
  } catch (error) {
    console.error('FShip shipment creation error:', error)

    if (!diagnostic.error) {
      const errorMapping = mapFShipError(error)
      diagnostic.error = errorMapping
      diagnostic.response = { success: false, error: errorMapping.userMessage }
      await saveDiagnostic(diagnostic)
    }

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to create shipment. Please try again later.',
    }
  }
}

export async function getOrderTracking(
  awbNumber: string
): Promise<TrackingResult> {
  try {
    if (!awbNumber || awbNumber.trim().length === 0) {
      return { success: false, error: 'Please provide a valid tracking number.' }
    }

    const trackingResponse = await fshipClient.getTrackingHistory(awbNumber.trim())

    if (trackingResponse.error || !trackingResponse.status) {
      return {
        success: false,
        error: trackingResponse.response ||
          'No tracking information found for this waybill number.',
      }
    }

    if (!trackingResponse.trackingdata || trackingResponse.trackingdata.length === 0) {
      return {
        success: false,
        error: 'No tracking information available yet for this waybill number.',
      }
    }

    const activities: TrackingActivity[] = trackingResponse.trackingdata.map((scan) => ({
      date: scan.dateandTime ?? scan.DateandTime ?? '',
      status: scan.status ?? scan.Status ?? '',
      activity: scan.remark ?? scan.Remark ?? '',
      location: scan.location ?? scan.Location ?? '',
    }))

    return {
      success: true,
      data: activities,
      status: trackingResponse.summary?.status || '',
    }
  } catch (error) {
    console.error('Order tracking error:', error)
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to retrieve tracking information. Please try again later.',
    }
  }
}

interface ShipmentLabelResult {
  success: boolean
  labelUrl?: string
  routingCode?: string
  error?: string
}

export async function getShipmentLabel(awb: string): Promise<ShipmentLabelResult> {
  try {
    if (!awb || awb.trim().length === 0) {
      return { success: false, error: 'Please provide a valid waybill number.' }
    }

    const trimmedAwb = awb.trim()
    const labelResponse = await fshipClient.getShippingLabel(trimmedAwb)

    const statusOk =
      typeof labelResponse.status === 'string'
        ? labelResponse.status.toLowerCase() === 'success'
        : !!labelResponse.status

    if (!statusOk || !labelResponse.resultDetails) {
      return {
        success: false,
        error: 'No label information found for this waybill number.',
      }
    }

    const details =
      labelResponse.resultDetails[trimmedAwb] ||
      Object.values(labelResponse.resultDetails)[0]

    if (!details) {
      return {
        success: false,
        error: 'No label information found for this waybill number.',
      }
    }

    return {
      success: true,
      labelUrl: details.LabelUrl ?? details.labelurl,
      routingCode: details.RoutingCode,
    }
  } catch (error) {
    console.error('FShip label fetch error:', error)
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to retrieve shipping label. Please try again later.',
    }
  }
}
