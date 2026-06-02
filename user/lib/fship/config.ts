export interface FShipConfig {
  apiKey: string
  warehouseId: number
  sandbox: boolean
}

export interface FShipConfigValidation {
  isValid: boolean
  config: FShipConfig | null
  errors: string[]
  warnings: string[]
  mode: 'live' | 'sandbox' | 'unconfigured'
  features: {
    serviceability: boolean
    orderCreation: boolean
    tracking: boolean
    cancellation: boolean
  }
}

export interface FShipHealthStatus {
  configured: boolean
  fullyConfigured: boolean
  mode: 'live' | 'sandbox' | 'unconfigured'
  features: {
    serviceability: boolean
    orderCreation: boolean
    tracking: boolean
    cancellation: boolean
  }
  validation: FShipConfigValidation
  timestamp: string
}

export interface FShipErrorMapping {
  code: string
  category: 'auth' | 'validation' | 'network' | 'config' | 'unknown'
  message: string
  userMessage: string
  troubleshootingSteps: string[]
  retryable: boolean
}

export function validateFShipConfig(): FShipConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []

  const apiKey = process.env.FSHIP_API_KEY?.trim()
  const warehouseIdStr = process.env.FSHIP_WAREHOUSE_ID?.trim()
  const sandbox = process.env.FSHIP_SANDBOX === 'true'

  if (!apiKey) {
    errors.push('FSHIP_API_KEY is not set. Get your Client Key from FShip Dashboard > Settings > API Details.')
  }

  if (!warehouseIdStr) {
    warnings.push('FSHIP_WAREHOUSE_ID is not set. Get your Warehouse ID from FShip Dashboard > Settings > Manage Pickup Address.')
  }

  const warehouseId = warehouseIdStr ? parseInt(warehouseIdStr, 10) : 0

  if (sandbox) {
    warnings.push('FShip is running in sandbox mode. Orders will be created on the staging server.')
  }

  const hasKey = !!apiKey
  const hasWarehouse = warehouseId > 0

  let mode: 'live' | 'sandbox' | 'unconfigured'
  if (!hasKey) {
    mode = 'unconfigured'
  } else if (sandbox) {
    mode = 'sandbox'
  } else {
    mode = 'live'
  }

  const features = {
    serviceability: hasKey,
    orderCreation: hasKey && hasWarehouse,
    tracking: hasKey,
    cancellation: hasKey,
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      config: null,
      errors,
      warnings,
      mode: 'unconfigured',
      features: { serviceability: false, orderCreation: false, tracking: false, cancellation: false },
    }
  }

  return {
    isValid: true,
    config: { apiKey: apiKey!, warehouseId, sandbox },
    errors: [],
    warnings,
    mode,
    features,
  }
}

export function isFShipConfigured(): boolean {
  return !!process.env.FSHIP_API_KEY?.trim()
}

export function isFShipFullyConfigured(): boolean {
  return !!(
    process.env.FSHIP_API_KEY?.trim() &&
    process.env.FSHIP_WAREHOUSE_ID?.trim()
  )
}

export function getFShipHealthStatus(): FShipHealthStatus {
  const validation = validateFShipConfig()
  return {
    configured: isFShipConfigured(),
    fullyConfigured: isFShipFullyConfigured(),
    mode: validation.mode,
    features: validation.features,
    validation,
    timestamp: new Date().toISOString(),
  }
}

export function mapFShipError(error: unknown): FShipErrorMapping {
  if (!(error instanceof Error)) {
    return {
      code: 'FSHIP_UNKNOWN',
      category: 'unknown',
      message: 'An unknown error occurred',
      userMessage: 'An unexpected error occurred with FShip integration.',
      troubleshootingSteps: ['Try again in a few moments', 'Contact support if the issue persists'],
      retryable: true,
    }
  }

  const message = error.message.toLowerCase()
  const originalMessage = error.message

  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      code: 'FSHIP_401_UNAUTHORIZED',
      category: 'auth',
      message: originalMessage,
      userMessage: 'FShip API authentication failed. Invalid API key.',
      troubleshootingSteps: [
        'Verify FSHIP_API_KEY matches the Client Key in FShip Dashboard > Settings > API Details',
        'Check if your FShip account has API access activated',
        'Contact FShip support at support@fship.in',
      ],
      retryable: false,
    }
  }

  if (message.includes('400') || message.includes('bad request')) {
    return {
      code: 'FSHIP_400_VALIDATION',
      category: 'validation',
      message: originalMessage,
      userMessage: 'Request validation failed. Please check the shipment details.',
      troubleshootingSteps: [
        'Verify pincode is valid and serviceable',
        'Check address and all required fields',
        'Ensure weight and dimensions are valid',
        'Verify FSHIP_WAREHOUSE_ID is correct',
      ],
      retryable: true,
    }
  }

  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('fetch failed')
  ) {
    return {
      code: 'FSHIP_NETWORK_ERROR',
      category: 'network',
      message: originalMessage,
      userMessage: 'Unable to connect to FShip API. Network connection issue.',
      troubleshootingSteps: [
        'Check your internet connection',
        'Verify the server can reach capi.fship.in',
        'Try again in a few moments',
      ],
      retryable: true,
    }
  }

  if (message.includes('not configured') || message.includes('api key')) {
    return {
      code: 'FSHIP_NOT_CONFIGURED',
      category: 'config',
      message: originalMessage,
      userMessage: 'FShip integration is not properly configured.',
      troubleshootingSteps: [
        'Set FSHIP_API_KEY environment variable',
        'Set FSHIP_WAREHOUSE_ID environment variable',
        'Restart the application after setting environment variables',
      ],
      retryable: false,
    }
  }

  return {
    code: 'FSHIP_GENERIC_ERROR',
    category: 'unknown',
    message: originalMessage.substring(0, 200),
    userMessage: `FShip API error: ${originalMessage.substring(0, 200)}`,
    troubleshootingSteps: ['Check the error message for details', 'Try again in a few moments'],
    retryable: true,
  }
}
