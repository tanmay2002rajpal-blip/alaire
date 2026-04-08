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

const BASE_URL = process.env.BLUEDART_SANDBOX === 'true'
  ? 'https://apigateway-sandbox.bluedart.com/in/transportation'
  : 'https://apigateway.bluedart.com/in/transportation'
const TOKEN_URL = `${BASE_URL}/token/v1/login`

// Refresh token 5 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
// Default token lifetime: 24 hours (BlueDart JWT typical expiry)
const DEFAULT_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000

/**
 * Static mapping of common Indian pincodes to city/state.
 * Used for quick lookups without API calls.
 */
// Map pincode prefixes (first 3 digits) to city/state for fallback lookup
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

// ============================================================================
// Client Class
// ============================================================================

class BlueDartClient {
  private cachedToken: string | null = null
  private tokenExpiresAt: number = 0

  /**
   * Builds the standard Blue Dart profile object from env vars.
   * LoginID and LicenceKey are sent in the request body (Profile section).
   *
   * In sandbox mode, prefers BLUEDART_SANDBOX_LOGIN_ID / BLUEDART_SANDBOX_LICENSE_KEY
   * when set — production credentials get rejected by the sandbox backend with
   * "UserDoesNotExists" / "License Mismatch" because it's a different tenant.
   */
  private getProfile(): BlueDartProfile {
    const isSandbox = process.env.BLUEDART_SANDBOX === 'true'
    const loginId = isSandbox
      ? process.env.BLUEDART_SANDBOX_LOGIN_ID?.trim() || process.env.BLUEDART_LOGIN_ID
      : process.env.BLUEDART_LOGIN_ID
    const licenceKey = isSandbox
      ? process.env.BLUEDART_SANDBOX_LICENSE_KEY?.trim() || process.env.BLUEDART_LICENSE_KEY
      : process.env.BLUEDART_LICENSE_KEY
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
   * Checks if APIGEE token-based auth is configured (ClientID + clientSecret).
   */
  private isTokenAuthConfigured(): boolean {
    return !!(
      process.env.BLUEDART_CLIENT_ID?.trim() &&
      process.env.BLUEDART_CLIENT_SECRET?.trim()
    )
  }

  /**
   * Generates a JWT token from BlueDart APIGEE Authentication API.
   * Endpoint: GET /token/v1/login
   * Headers: ClientID (API Key), clientSecret (API Secret)
   * Returns: { JWTToken: "..." }
   */
  private async generateToken(): Promise<string> {
    const clientId = process.env.BLUEDART_CLIENT_ID?.trim()
    const clientSecret = process.env.BLUEDART_CLIENT_SECRET?.trim()

    if (!clientId || !clientSecret) {
      throw new Error(
        'Blue Dart APIGEE credentials not configured. Please set BLUEDART_CLIENT_ID and BLUEDART_CLIENT_SECRET environment variables.'
      )
    }

    const response = await fetch(TOKEN_URL, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ClientID: clientId,
        clientSecret: clientSecret,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Blue Dart token generation failed: ${response.status} ${error}`
      )
    }

    const data = await response.json()

    if (!data.JWTToken) {
      throw new Error(
        'Blue Dart token generation failed: No JWTToken in response'
      )
    }

    return data.JWTToken
  }

  /**
   * Gets a valid JWT token, generating a new one if needed.
   * Caches the token and refreshes before expiry.
   */
  private async getToken(): Promise<string> {
    const now = Date.now()

    if (this.cachedToken && now < this.tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return this.cachedToken
    }

    const token = await this.generateToken()
    this.cachedToken = token
    // Parse JWT expiry if possible, otherwise use default lifetime
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      )
      if (payload.exp) {
        this.tokenExpiresAt = payload.exp * 1000
      } else {
        this.tokenExpiresAt = now + DEFAULT_TOKEN_LIFETIME_MS
      }
    } catch {
      this.tokenExpiresAt = now + DEFAULT_TOKEN_LIFETIME_MS
    }

    return token
  }

  /**
   * Returns standard headers for Blue Dart API calls.
   * Uses dynamically generated JWT token if APIGEE credentials are configured,
   * otherwise falls back to BLUEDART_LICENSE_KEY as static token.
   */
  private async getHeaders(): Promise<Record<string, string>> {
    if (this.isTokenAuthConfigured()) {
      const token = await this.getToken()
      return {
        'Content-Type': 'application/json',
        JWTToken: token,
      }
    }

    // Fallback: use BLUEDART_LICENSE_KEY as static token (legacy behavior)
    const licenceKey = process.env.BLUEDART_LICENSE_KEY
    if (!licenceKey) {
      throw new Error(
        'Blue Dart not configured. Set BLUEDART_CLIENT_ID + BLUEDART_CLIENT_SECRET for APIGEE auth, or BLUEDART_LICENSE_KEY as static token.'
      )
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
    const headers = await this.getHeaders()

    const response = await fetch(
      `${BASE_URL}/finder/v1/GetServicesforPincode`,
      {
        method: 'POST',
        headers,
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
   *
   * Blue Dart's .NET backend throws "Object reference not set to an instance
   * of an object" when optional string/array fields are omitted entirely.
   * This method pads the incoming minimal request with empty defaults for
   * every field the backend touches, matching the full payload shape from
   * Blue Dart's Waybill Generation PDF sample.
   */
  async generateWaybill(
    request: WaybillRequest['Request']
  ): Promise<WaybillResponse> {
    const profile = this.getProfile()
    const headers = await this.getHeaders()

    // Pad consignee with all fields BD's backend dereferences
    const consigneeDefaults = {
      ConsigneeAddress1: '',
      ConsigneeAddress2: '',
      ConsigneeAddress3: '',
      ConsigneeAddressType: 'R',
      ConsigneeAttention: '',
      ConsigneeEmailID: '',
      ConsigneeGSTNumber: '',
      ConsigneeLatitude: '',
      ConsigneeLongitude: '',
      ConsigneeMaskedContactNumber: '',
      ConsigneeMobile: '',
      ConsigneeName: '',
      ConsigneePincode: '',
      ConsigneeTelephone: '',
    }
    const consignee = { ...consigneeDefaults, ...request.Consignee }

    // Pad shipper similarly
    const shipperDefaults = {
      CustomerAddress1: '',
      CustomerAddress2: '',
      CustomerAddress3: '',
      CustomerCode: '',
      CustomerEmailID: '',
      CustomerGSTNumber: '',
      CustomerLatitude: '',
      CustomerLongitude: '',
      CustomerMaskedContactNumber: '',
      CustomerMobile: '',
      CustomerName: '',
      CustomerPincode: '',
      CustomerTelephone: '',
      IsToPayCustomer: false,
      OriginArea: '',
      Sender: '',
      VendorCode: '',
    }
    const shipper = { ...shipperDefaults, ...request.Shipper }

    // Pad services - arrays/objects are especially error-prone if missing
    const servicesDefaults = {
      AWBNo: '',
      ActualWeight: 0,
      CollectableAmount: 0,
      Commodity: {},
      CreditReferenceNo: '',
      DeclaredValue: 0,
      Dimensions: [],
      PDFOutputNotRequired: true,
      PackType: '',
      PickupDate: '',
      PickupTime: '',
      PieceCount: 1,
      ProductCode: 'A',
      ProductType: 0,
      RegisterPickup: false,
      SpecialInstruction: '',
      SubProductCode: '',
      OTPBasedDelivery: 0,
      OTPCode: '',
      itemdtl: [],
      noOfDCGiven: 0,
    }
    const services = { ...servicesDefaults, ...request.Services }

    // CreditReferenceNo max length is 20 chars (BD enforces). MongoDB ObjectIds
    // are 24 chars, so we truncate from the end to preserve the random+counter
    // portion (more unique than the timestamp prefix).
    if (services.CreditReferenceNo && services.CreditReferenceNo.length > 20) {
      services.CreditReferenceNo = services.CreditReferenceNo.slice(-20)
    }

    // Returnadds is required by BD backend even if not used
    const returnaddsDefaults = {
      ManifestNumber: '',
      ReturnAddress1: shipper.CustomerAddress1,
      ReturnAddress2: shipper.CustomerAddress2,
      ReturnAddress3: shipper.CustomerAddress3,
      ReturnContact: shipper.CustomerName,
      ReturnEmailID: '',
      ReturnLatitude: '',
      ReturnLongitude: '',
      ReturnMaskedContactNumber: '',
      ReturnMobile: shipper.CustomerMobile,
      ReturnPincode: shipper.CustomerPincode,
      ReturnTelephone: '',
    }
    const returnadds = {
      ...returnaddsDefaults,
      ...(request as { Returnadds?: Record<string, unknown> }).Returnadds,
    }

    const payload = {
      Request: {
        Consignee: consignee,
        Returnadds: returnadds,
        Services: services,
        Shipper: shipper,
      },
      Profile: profile,
    }

    const response = await fetch(
      `${BASE_URL}/waybill/v1/GenerateWayBill`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
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
   *
   * Uses the `custawbquery` action which returns JSON. The alternative
   * `cuaborig` action returns XML and requires a different auth model.
   * loginid / lickey are passed as query params alongside the JWT header.
   */
  async trackShipment(waybillNumber: string): Promise<TrackingResponse> {
    const profile = this.getProfile()
    const headers = await this.getHeaders()

    const params = new URLSearchParams({
      handler: 'tnt',
      action: 'custawbquery',
      loginid: profile.LoginID,
      lickey: profile.LicenceKey,
      numbers: waybillNumber,
      scan: 'true',
      format: 'json',
      verbose: '2',
    })

    const response = await fetch(
      `${BASE_URL}/tracking/v1?${params}`,
      {
        method: 'GET',
        headers,
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
   * Registers a pickup request with Blue Dart (standalone).
   *
   * NOTE: This is NOT used by the standard shipment flow — setting
   * `RegisterPickup: true` on `generateWaybill()` registers the pickup inline
   * and returns the token in `GenerateWayBillResult.TokenNumber`. Use that.
   *
   * The standalone endpoint currently returns 500 on the BD sandbox with the
   * documented schema. Kept for future use if/when the exact request shape is
   * clarified with Blue Dart support.
   */
  async registerPickup(
    request: PickupRequest['Request']
  ): Promise<PickupResponse> {
    const profile = this.getProfile()
    const headers = await this.getHeaders()

    const defaults = {
      AWBNo: '',
      AreaCode: '',
      ContactPersonName: '',
      CustomerAddress1: '',
      CustomerAddress2: '',
      CustomerAddress3: '',
      CustomerCode: '',
      CustomerName: '',
      CustomerPincode: '',
      CustomerTelephoneNumber: '',
      DoxNDox: 1,
      EmailID: '',
      IsForcePickup: false,
      IsReversePickup: false,
      MobileTelNo: '',
      NumberofPieces: 1,
      OfficeCloseTime: '',
      OriginArea: '',
      PackType: '',
      ParcelCount: 1,
      PickupDate: '',
      PickupTime: '',
      ProductCode: 'A',
      ReferenceNo: '',
      Remarks: '',
      RouteCode: '',
      ShipmentPickupByLabel: '',
      ShipmentPickupPoint: '',
      SpecialInstructions: '',
      SubProducts: '',
      VolumeWeight: 0,
      WeightofShipment: 0,
      isToPayShipper: false,
      servInstr: '',
    }
    const padded = { ...defaults, ...request }

    const response = await fetch(
      `${BASE_URL}/pickup/v1/RegisterPickup`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          Request: padded,
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
   *
   * NOTE: Currently returns 500 on the BD sandbox against both inline and
   * standalone pickup tokens. The exact request shape needs clarification
   * from Blue Dart support. Not used by any code path today — kept for
   * future implementation.
   */
  async cancelPickup(tokenNumber: string): Promise<CancelPickupResponse> {
    const profile = this.getProfile()
    const headers = await this.getHeaders()

    const response = await fetch(
      `${BASE_URL}/cancel-pickup/v1/CancelPickup`,
      {
        method: 'POST',
        headers,
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
   *
   * Endpoint: POST /transit/v1/GetDomesticTransitTimeForPinCodeandProduct
   * Required: pPinCodeFrom, pPinCodeTo, pProductCode, pSubProductCode,
   *           pPickupDate (/Date(ms)/), pPickupTime (HH:MM - NOT HHMM), profile
   *
   * Response contains AdditionalDays, ExpectedDateDelivery, Area, ServiceCenter.
   * There is no "TransitDays" field — callers must compute effective days.
   */
  async getTransitTime(
    originPincode: string,
    destPincode: string,
    productCode: string = 'A',
    subProductCode: string = 'P',
    pickupDate?: Date
  ): Promise<TransitTimeResponse> {
    const profile = this.getProfile()
    const headers = await this.getHeaders()

    // Default to tomorrow at noon if no pickup date provided
    const pu = pickupDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000)
    const pPickupDate = `/Date(${pu.getTime()})/`
    const hh = String(pu.getHours()).padStart(2, '0')
    const mm = String(pu.getMinutes()).padStart(2, '0')
    const pPickupTime = `${hh}:${mm}` // HH:MM format (NOT HHMM — BD rejects it)

    const response = await fetch(
      `${BASE_URL}/transit/v1/GetDomesticTransitTimeForPinCodeandProduct`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pPinCodeFrom: originPincode,
          pPinCodeTo: destPincode,
          pProductCode: productCode,
          pSubProductCode: subProductCode,
          pPickupDate,
          pPickupTime,
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
    const prefix = pincode.slice(0, 3)
    const details = PINCODE_PREFIX_MAP[prefix]
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
