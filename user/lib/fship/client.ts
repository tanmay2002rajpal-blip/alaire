import type {
  FShipCourier,
  ServiceabilityResponse,
  RateCalculatorRequest,
  RateCalculatorResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderResponse,
  RegisterPickupResponse,
  TrackingHistoryResponse,
  ShipmentSummaryResponse,
  ShippingLabelResponse,
} from './types'

const BASE_URL = process.env.FSHIP_SANDBOX === 'true'
  ? 'https://capi-qc.fship.in'
  : 'https://capi.fship.in'

class FShipClient {
  private getSignature(): string {
    const key = process.env.FSHIP_API_KEY?.trim()
    if (!key) {
      throw new Error(
        'FShip API key not configured. Please set FSHIP_API_KEY environment variable.'
      )
    }
    return key
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      signature: this.getSignature(),
    }
  }

  private async request<T>(method: 'GET' | 'POST', endpoint: string, body?: unknown): Promise<T> {
    const url = `${BASE_URL}/api/${endpoint}`
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    }
    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`FShip API error (${response.status}): ${error}`)
    }

    return response.json()
  }

  async getAllCouriers(): Promise<FShipCourier[]> {
    return this.request<FShipCourier[]>('GET', 'getallcourier')
  }

  async checkServiceability(
    sourcePincode: string,
    destPincode: string
  ): Promise<ServiceabilityResponse> {
    return this.request<ServiceabilityResponse>('POST', 'pincodeserviceability', {
      source_Pincode: sourcePincode,
      destination_Pincode: destPincode,
    })
  }

  async calculateRates(request: RateCalculatorRequest): Promise<RateCalculatorResponse> {
    return this.request<RateCalculatorResponse>('POST', 'ratecalculator', request)
  }

  async createForwardOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('POST', 'createforwardorder', request)
  }

  async cancelOrder(waybill: string, reason?: string): Promise<CancelOrderResponse> {
    return this.request<CancelOrderResponse>('POST', 'cancelorder', {
      waybill,
      reason: reason || 'Order cancelled by customer',
    })
  }

  async registerPickup(waybills: string[]): Promise<RegisterPickupResponse> {
    return this.request<RegisterPickupResponse>('POST', 'registerpickup', {
      waybills,
    })
  }

  async getTrackingHistory(waybill: string): Promise<TrackingHistoryResponse> {
    return this.request<TrackingHistoryResponse>('POST', 'trackinghistory', {
      waybill,
    })
  }

  async getShipmentSummary(waybill: string): Promise<ShipmentSummaryResponse> {
    return this.request<ShipmentSummaryResponse>('POST', 'shipmentsummary', {
      waybill,
    })
  }

  async getShippingLabel(waybill: string): Promise<ShippingLabelResponse> {
    return this.request<ShippingLabelResponse>('POST', 'shippinglabel', {
      waybill,
    })
  }
}

export const fshipClient = new FShipClient()
