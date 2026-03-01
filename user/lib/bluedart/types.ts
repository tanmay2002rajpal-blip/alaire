// ============================================================================
// Shared types for shipping data
// ============================================================================

export interface PincodeData {
  pincode: string
  city: string
  state: string
  serviceable: boolean
  estimatedDays: number
  shippingCost: number
  courierName?: string
}

export interface TrackingActivity {
  date: string
  status: string
  activity: string
  location: string
}

// ============================================================================
// Blue Dart API profile (sent with every request)
// ============================================================================

export interface BlueDartProfile {
  LoginID: string
  LicenceKey: string
  Api_type: string
  Version: string
}

// ============================================================================
// Serviceability (GetServicesforPincode)
// ============================================================================

export interface ServiceabilityRequest {
  pinCode: string
  profile: BlueDartProfile
}

export interface ServiceabilityResponse {
  GetServicesforPincodeResult?: {
    ErrorMessage: string | null
    IsError: boolean
    ApexInbound: string
    ODA: boolean
    GroundInbound: string
    AreaCode: string
    CityCode: string
    StateCode: string
    StateName: string
    CityName: string
  }
}

// ============================================================================
// Waybill generation (GenerateWayBill)
// ============================================================================

export interface WaybillShipper {
  CustomerName: string
  CustomerCode: string
  OriginArea: string
  CustomerAddress1: string
  CustomerAddress2?: string
  CustomerAddress3?: string
  CustomerPincode: string
  CustomerMobile: string
  CustomerTelephone?: string
  Sender: string
}

export interface WaybillServices {
  ProductCode: string // 'A' = Air, 'E' = Express
  ProductType: number // 1 = Dutiable, 2 = Non-Dutiable
  SubProductCode: string // 'P' = Prepaid, 'C' = COD
  PieceCount: string
  ActualWeight: string
  CreditReferenceNo: string
  DeclaredValue: string
  PickupDate: string
  PickupTime: string
  InvoiceNo?: string
}

export interface WaybillConsignee {
  ConsigneeName: string
  ConsigneeAddress1: string
  ConsigneeAddress2?: string
  ConsigneeAddress3?: string
  ConsigneePincode: string
  ConsigneeMobile: string
  ConsigneeTelephone?: string
}

export interface WaybillRequest {
  Request: {
    Consignee: WaybillConsignee
    Shipper: WaybillShipper
    Services: WaybillServices
  }
  Profile: BlueDartProfile
}

export interface WaybillResponse {
  GenerateWayBillResult?: {
    IsError: boolean
    ErrorMessage: string[] | null
    AWBNo: string
    DestinationArea: string
    DestinationLocation: string
    ABORIG: string
    ClusterCode: string
  }
}

// ============================================================================
// Tracking
// ============================================================================

export interface TrackingRequest {
  handler: string
  action: string
  values: {
    WaybillNo: string
  }
}

export interface TrackingResponse {
  ShipmentData?: Array<{
    Shipment?: {
      Status: string
      StatusType: string
      Origin: string
      Destination: string
      Scans?: Array<{
        ScanDetail: {
          ScanDateTime: string
          ScanType: string
          Scan: string
          ScannedLocation: string
          StatusCode: string
          StatusDateTime: string
          Instructions: string
        }
      }>
    }
  }>
}

// ============================================================================
// Pickup registration (RegisterPickup)
// ============================================================================

export interface PickupRequest {
  Request: {
    PickupDate: string
    PickupTime: string
    CustomerCode: string
    OriginArea: string
    CustomerName: string
    CustomerMobile: string
    CustomerAddress1: string
    CustomerAddress2?: string
    CustomerPincode: string
    PackageCount: number
    ProductCode: string
  }
  Profile: BlueDartProfile
}

export interface PickupResponse {
  RegisterPickupResult?: {
    IsError: boolean
    ErrorMessage: string | null
    TokenNumber: string
  }
}

// ============================================================================
// Cancel pickup
// ============================================================================

export interface CancelPickupRequest {
  Request: {
    TokenNumber: string
  }
  Profile: BlueDartProfile
}

export interface CancelPickupResponse {
  CancelPickupResult?: {
    IsError: boolean
    ErrorMessage: string | null
  }
}

// ============================================================================
// Transit time
// ============================================================================

export interface TransitTimeRequest {
  pPinCodeFrom: string
  pPinCodeTo: string
  pProductCode: string
  pSubProductCode: string
  profile: BlueDartProfile
}

export interface TransitTimeResponse {
  GetDomesticTransitTimeForPinCodeandProductResult?: {
    IsError: boolean
    ErrorMessage: string | null
    OriginArea: string
    DestinationArea: string
    TransitDays: number
    ExpectedDateDelivery: string
  }
}
