export interface ShiprocketAuthResponse {
  token: string
}

export interface ServiceabilityRequest {
  pickup_postcode: string
  delivery_postcode: string
  weight: number // in kg
  cod: 0 | 1
}

export interface ServiceabilityResponse {
  status: number
  data: {
    available_courier_companies: CourierCompany[]
  }
}

export interface CourierCompany {
  courier_company_id: number
  courier_name: string
  rate: number
  etd: string
  estimated_delivery_days: number
}

export interface PincodeData {
  pincode: string
  city: string
  state: string
  serviceable: boolean
  estimatedDays: number
  shippingCost: number
  courierName?: string
}

export interface TrackingResponse {
  tracking_data: {
    track_status: number
    shipment_status: number
    shipment_status_text: string
    shipment_track: TrackingEvent[]
    shipment_track_activities: TrackingActivity[]
  }
}

export interface TrackingEvent {
  id: number
  date: string
  status: string
  activity: string
  location: string
}

export interface TrackingActivity {
  date: string
  status: string
  activity: string
  location: string
}

// Order creation types
export interface ShiprocketOrderItem {
  name: string
  sku: string
  units: number
  selling_price: number
  discount?: number
  tax?: number
  hsn?: string
}

export interface CreateShiprocketOrderRequest {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_last_name?: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  shipping_customer_name?: string
  shipping_address?: string
  shipping_city?: string
  shipping_pincode?: string
  shipping_state?: string
  shipping_country?: string
  shipping_phone?: string
  order_items: ShiprocketOrderItem[]
  payment_method: 'Prepaid' | 'COD'
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export interface CreateShiprocketOrderResponse {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
  onboarding_completed_now: number
  awb_code: string | null
  courier_company_id: number | null
  courier_name: string | null
}

export interface GenerateAWBRequest {
  shipment_id: number
  courier_id?: number
}

export interface GenerateAWBResponse {
  awb_assign_status: number
  response: {
    data: {
      awb_code: string
      courier_company_id: number
      courier_name: string
      assigned_date_time: string
    }
  }
}
