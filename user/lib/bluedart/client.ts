import type {
  BlueDartProfile,
  ServiceabilityResponse,
  WaybillRequest,
  WaybillResponse,
  TrackingResponse,
  PickupRequest,
  PickupResponse,
  CancelPickupResponse,
  TransitTimeResponse,
  PincodeData,
} from './types'

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = 'https://apigateway.bluedart.com/in/transportation'

/**
 * Static mapping of common Indian pincodes to city/state.
 * Used for quick lookups without API calls.
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

class BlueDartClient {
  /**
   * Builds the standard Blue Dart profile object from env vars.
   */
  private getProfile(): BlueDartProfile {
    const loginId = process.env.BLUEDART_LOGIN_ID
    const licenceKey = process.env.BLUEDART_LICENSE_KEY
    const apiType = process.env.BLUEDART_API_TYPE || 'S'
    const version = process.env.BLUEDART_VERSION || '1.3'

    if (!loginId || !licenceKey) {
      throw new Error(
        'Blue Dart credentials not configured. Please set BLUEDART_LOGIN_ID and BLUEDART_LICENSE_KEY environment variables.'
      )
    }

    return {
      LoginID: loginId,
      LicenceKey: licenceKey,
      Api_type: apiType,
      Version: version,
    }
  }

  /**
   * Returns standard headers for Blue Dart API calls.
   */
  private getHeaders(): Record<string, string> {
    const licenceKey = process.env.BLUEDART_LICENSE_KEY
    if (!licenceKey) {
      throw new Error('BLUEDART_LICENSE_KEY not configured.')
    }
    return {
      'Content-Type': 'application/json',
      JWTToken: licenceKey,
    }
  }

  // ==========================================================================
  // Serviceability
  // ==========================================================================

  /**
   * Checks serviceability for a destination pincode.
   * Returns area details including city, state, and whether the pincode is serviceable.
   */
  async checkServiceability(
    originPincode: string,
    destPincode: string
  ): Promise<ServiceabilityResponse> {
    const profile = this.getProfile()

    const response = await fetch(
      `${BASE_URL}/finder/v1/GetServicesforPincode`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          pinCode: destPincode,
          profile,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart serviceability check failed: ${response.status} ${error}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Waybill Generation
  // ==========================================================================

  /**
   * Generates a waybill (AWB) for a shipment.
   */
  async generateWaybill(
    request: WaybillRequest['Request']
  ): Promise<WaybillResponse> {
    const profile = this.getProfile()

    const response = await fetch(
      `${BASE_URL}/waybill/v1/GenerateWayBill`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          Request: request,
          Profile: profile,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart waybill generation failed: ${response.status} ${error}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Tracking
  // ==========================================================================

  /**
   * Tracks a shipment using its waybill number.
   */
  async trackShipment(waybillNumber: string): Promise<TrackingResponse> {
    const params = new URLSearchParams({
      handler: 'tnt',
      action: 'cuaborig',
      'values.WaybillNo': waybillNumber,
    })

    const response = await fetch(
      `${BASE_URL}/tracking/v1?${params}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart tracking failed: ${response.status} ${error}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Pickup Registration
  // ==========================================================================

  /**
   * Registers a pickup request with Blue Dart.
   */
  async registerPickup(
    request: PickupRequest['Request']
  ): Promise<PickupResponse> {
    const profile = this.getProfile()

    const response = await fetch(
      `${BASE_URL}/pickup/v1/RegisterPickup`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          Request: request,
          Profile: profile,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart pickup registration failed: ${response.status} ${error}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Cancel Pickup
  // ==========================================================================

  /**
   * Cancels a previously registered pickup.
   */
  async cancelPickup(tokenNumber: string): Promise<CancelPickupResponse> {
    const profile = this.getProfile()

    const response = await fetch(
      `${BASE_URL}/cancel-pickup/v1/CancelPickup`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          Request: { TokenNumber: tokenNumber },
          Profile: profile,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart cancel pickup failed: ${response.status} ${error}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Transit Time
  // ==========================================================================

  /**
   * Gets estimated transit time between two pincodes.
   */
  async getTransitTime(
    originPincode: string,
    destPincode: string,
    productCode: string = 'A',
    subProductCode: string = 'P'
  ): Promise<TransitTimeResponse> {
    const profile = this.getProfile()

    const response = await fetch(
      `${BASE_URL}/time-finder/v1/GetDomesticTransitTimeForPinCodeandProduct`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          pPinCodeFrom: originPincode,
          pPinCodeTo: destPincode,
          pProductCode: productCode,
          pSubProductCode: subProductCode,
          profile,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart transit time check failed: ${response.status} ${error}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Pincode Lookup
  // ==========================================================================

  /**
   * Gets basic location details for a pincode from static map.
   * Returns null if pincode is not in the local database.
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
}

// ============================================================================
// Export
// ============================================================================

export const blueDartClient = new BlueDartClient()
