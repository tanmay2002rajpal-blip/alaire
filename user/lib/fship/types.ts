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

export interface FShipCourier {
  courierId: number
  courierName: string
  logoUrl: string
  isActive: boolean
  marketType: number
}

export interface ServiceabilityResponse {
  source: string
  destination: string
  pickup: string
  reverse: string
  prepaid: string
  cod: string
  status: boolean
  response: string
}

export interface RateCalculatorRequest {
  source_Pincode: string
  destination_Pincode: string
  payment_Mode: string
  amount: number
  express_Type: string
  shipment_Weight: number
  shipment_Length: number
  shipment_Width: number
  shipment_Height: number
  volumetric_Weight: number
}

export interface ShipmentRate {
  courier_name: string
  shipping_charge: number
  cod_charge: number
  rto_charge: number
  service_mode: string
}

export interface RateCalculatorResponse {
  status: boolean
  response: string
  shipment_rates: ShipmentRate[]
}

export interface CreateOrderRequest {
  customer_Name: string
  customer_Mobile: string
  customer_Emailid?: string
  customer_Address: string
  landMark?: string
  customer_Address_Type?: string
  customer_PinCode: string
  customer_City?: string
  orderId: string
  invoice_Number?: string
  payment_Mode: number
  express_Type: string
  is_Ndd?: number
  order_Amount: number
  tax_Amount?: number
  extra_Charges?: number
  total_Amount: number
  cod_Amount?: number
  shipment_Weight: number
  shipment_Length: number
  shipment_Width: number
  shipment_Height: number
  volumetric_Weight?: number
  latitude?: number
  longitude?: number
  pick_Address_ID: number
  return_Address_ID?: number
  products: CreateOrderProduct[]
  courierId?: number
}

export interface CreateOrderProduct {
  productId?: string
  productName: string
  unitPrice: number
  quantity: number
  productCategory?: string
  hsnCode?: string
  sku?: string
  taxRate?: number
  productDiscount?: number
}

export interface CreateOrderResponse {
  route_code: string
  order_status: string
  apiorderid: number
  waybill: string
  status: boolean
  response: string
}

export interface CancelOrderResponse {
  status: boolean
  response: string
}

export interface RegisterPickupResponse {
  apipickuporderids: Array<{
    pickupOrderId: number
    waybills: string[]
  }>
  status: boolean
  response: string
}

export interface TrackingHistoryResponse {
  status: boolean
  error: boolean
  response: string
  summary: {
    waybill: string
    apiorderid: number
    orderid: string
    fulfilledby: string
    statusid: number
    status: string
    lastscandate: string
    orderedon: string
  }
  trackingdata: Array<{
    DateandTime: string
    Status: string
    Remark: string
    Location: string
    shipmentJourney: number
  }>
}

export interface ShipmentSummaryResponse {
  status: boolean
  error: boolean
  response: string
  summary: {
    waybill: string
    orderid: string
    fulfilledby: string
    orderedon: string
    lastscanned: string
    statuscode: string
    status: string
    location: string
    remark: string
  }
}

export interface ShippingLabelResponse {
  status: string
  resultSummary: {
    'Total AWBs': number
    'Valid AWBs': number
    'Invalid AWBs': number
  }
  resultDetails: Record<string, {
    AWBStatus: string
    OrderId: string
    AWBNumber: string
    RoutingCode: string
    ShipmentType: string
    PaymentMode: string
    CODAmount: string
    OrderDate: string
    InvoiceNum: string
    ShipmentWt: string
    FulfilledBy: string
    SellerName: string
    ConsigneeDetails: {
      CustomerName: string
      CustomerContact: string
      CustomerAltContact: string
      CustomerAddress1: string
      CustomerAddress2: string
      City: string
      State: string
      Pincode: string
    }
    ReturnTo: {
      ReturnAddress: string
      ReturnContact: string
      City: string
      State: string
      Pincode: string
    }
    Products: Array<{
      ProductName: string
      ProductSKU: string
      ProductQty: string
      ProductValue: string
    }>
  }>
}
