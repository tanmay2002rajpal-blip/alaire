/**
 * Blue Dart Configuration and Validation Module
 *
 * Centralizes all Blue Dart configuration validation and access.
 * Use this module instead of directly accessing process.env for Blue Dart credentials.
 *
 * Hardening features:
 * - Comprehensive validation with detailed error categorization
 * - Live vs fallback mode detection
 * - Enhanced error mapping for common API failures
 * - Configuration health status reporting
 */

// ============================================================================
// Types
// ============================================================================

export interface BlueDartConfig {
  loginId: string
  licenseKey: string
  clientId?: string
  clientSecret?: string
  apiType: string
  version: string
  customerName: string
  customerCode: string
  originArea: string
  branch?: string
}

export interface BlueDartConfigValidation {
  isValid: boolean
  config: BlueDartConfig | null
  errors: string[]
  warnings: string[]
  mode: 'live' | 'fallback' | 'unconfigured'
  features: {
    serviceability: boolean
    waybillGeneration: boolean
    tracking: boolean
    pickup: boolean
  }
}

export interface BlueDartHealthStatus {
  configured: boolean
  fullyConfigured: boolean
  mode: 'live' | 'fallback' | 'unconfigured'
  features: {
    serviceability: boolean
    waybillGeneration: boolean
    tracking: boolean
    pickup: boolean
  }
  validation: BlueDartConfigValidation
  timestamp: string
}

export interface BlueDartErrorMapping {
  code: string
  category: 'auth' | 'validation' | 'network' | 'config' | 'permission' | 'unknown'
  message: string
  userMessage: string
  troubleshootingSteps: string[]
  retryable: boolean
}

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validates all Blue Dart environment variables.
 * Returns detailed validation results with helpful error messages.
 * Enhanced with mode detection and feature availability mapping.
 */
export function validateBlueDartConfig(): BlueDartConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Required credentials (Profile body)
  const loginId = process.env.BLUEDART_LOGIN_ID?.trim()
  const licenseKey = process.env.BLUEDART_LICENSE_KEY?.trim()

  if (!loginId) {
    errors.push(
      'BLUEDART_LOGIN_ID is not set. Get your Login ID from Blue Dart API Gateway portal.'
    )
  }

  if (!licenseKey) {
    errors.push(
      'BLUEDART_LICENSE_KEY is not set. Get your License Key from Blue Dart API Gateway portal.'
    )
  }

  // APIGEE token auth credentials
  const clientId = process.env.BLUEDART_CLIENT_ID?.trim()
  const clientSecret = process.env.BLUEDART_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    warnings.push(
      'BLUEDART_CLIENT_ID and BLUEDART_CLIENT_SECRET not set. These are required for APIGEE JWT token generation. Falling back to BLUEDART_LICENSE_KEY as static token.'
    )
  }

  // Optional but recommended fields
  const apiType = process.env.BLUEDART_API_TYPE?.trim() || 'S'
  const version = process.env.BLUEDART_VERSION?.trim() || '1.3'
  const customerName = process.env.BLUEDART_CUSTOMER_NAME?.trim() || ''
  const customerCode = process.env.BLUEDART_CUSTOMER_CODE?.trim() || ''
  const originArea = process.env.BLUEDART_ORIGIN_AREA?.trim() || ''
  const branch = process.env.BLUEDART_BRANCH?.trim()

  // Warn about missing shipment creation fields
  if (!customerName) {
    warnings.push(
      'BLUEDART_CUSTOMER_NAME not set. Required for waybill generation and pickup registration.'
    )
  }

  if (!customerCode) {
    warnings.push(
      'BLUEDART_CUSTOMER_CODE not set. Required for waybill generation and pickup registration.'
    )
  }

  if (!originArea) {
    warnings.push(
      'BLUEDART_ORIGIN_AREA not set. Required for waybill generation and pickup registration.'
    )
  }

  // Validate API type
  if (apiType && !['S', 'T'].includes(apiType)) {
    warnings.push(
      `BLUEDART_API_TYPE="${apiType}" is not standard. Expected 'S' (Shipping) or 'T' (Testing).`
    )
  }

  // Determine mode and feature availability
  const hasCredentials = !!loginId && !!licenseKey
  const hasShipmentFields = !!customerName && !!customerCode && !!originArea

  let mode: 'live' | 'fallback' | 'unconfigured'
  if (!hasCredentials) {
    mode = 'unconfigured'
  } else if (hasShipmentFields) {
    mode = 'live'
  } else {
    mode = 'fallback'
  }

  const features = {
    serviceability: hasCredentials, // Only needs basic auth
    waybillGeneration: hasCredentials && hasShipmentFields,
    tracking: hasCredentials, // Only needs basic auth
    pickup: hasCredentials && hasShipmentFields,
  }

  // Return validation result
  if (errors.length > 0) {
    return {
      isValid: false,
      config: null,
      errors,
      warnings,
      mode: 'unconfigured',
      features: {
        serviceability: false,
        waybillGeneration: false,
        tracking: false,
        pickup: false,
      },
    }
  }

  return {
    isValid: true,
    config: {
      loginId: loginId!,
      licenseKey: licenseKey!,
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
      apiType,
      version,
      customerName,
      customerCode,
      originArea,
      branch,
    },
    errors: [],
    warnings,
    mode,
    features,
  }
}

/**
 * Checks if basic Blue Dart credentials are configured.
 * Use this for quick checks before attempting API calls.
 */
export function isBlueDartConfigured(): boolean {
  return !!(
    process.env.BLUEDART_LOGIN_ID?.trim() &&
    process.env.BLUEDART_LICENSE_KEY?.trim()
  )
}

/**
 * Checks if Blue Dart is fully configured for shipment creation.
 * Returns true only if all required fields for waybill generation are present.
 */
export function isBlueDartFullyConfigured(): boolean {
  return !!(
    isBlueDartConfigured() &&
    process.env.BLUEDART_CUSTOMER_NAME?.trim() &&
    process.env.BLUEDART_CUSTOMER_CODE?.trim() &&
    process.env.BLUEDART_ORIGIN_AREA?.trim()
  )
}

/**
 * Gets validated Blue Dart configuration.
 * Throws an error if configuration is invalid.
 * Use this when you need guaranteed valid config.
 */
export function getBlueDartConfig(): BlueDartConfig {
  const validation = validateBlueDartConfig()

  if (!validation.isValid || !validation.config) {
    const errorMessage = [
      'Blue Dart is not properly configured:',
      ...validation.errors,
      ...validation.warnings,
    ].join('\n  - ')

    throw new Error(errorMessage)
  }

  // Log warnings even if config is valid
  if (validation.warnings.length > 0) {
    console.warn('Blue Dart configuration warnings:')
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`))
  }

  return validation.config
}

/**
 * Gets Blue Dart configuration or returns null if not configured.
 * Use this when you want to gracefully handle missing config.
 */
export function getBlueDartConfigOrNull(): BlueDartConfig | null {
  const validation = validateBlueDartConfig()
  return validation.config
}

/**
 * Returns a user-friendly error message for common Blue Dart API errors.
 * Masks sensitive information while providing actionable guidance.
 * Legacy function - prefer mapBlueDartError for detailed error information.
 */
export function getBlueDartErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred with Blue Dart integration.'
  }

  const message = error.message.toLowerCase()

  // 401 Unauthorized
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'Blue Dart API authentication failed. Please verify BLUEDART_LOGIN_ID and BLUEDART_LICENSE_KEY are correct. Error: Access to the method is not allowed - this usually indicates invalid credentials or insufficient API permissions.'
  }

  // 403 Forbidden
  if (message.includes('403') || message.includes('forbidden')) {
    return 'Blue Dart API access forbidden. Your account may not have permission for this operation. Please contact Blue Dart support to verify your API access level.'
  }

  // 400 Bad Request / Validation
  if (message.includes('400') || message.includes('bad request') || message.includes('validation')) {
    return 'Blue Dart API request validation failed. Please verify the shipment details are correct (pincode, address, customer code, etc.).'
  }

  // Network/timeout errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('fetch failed')
  ) {
    return 'Unable to connect to Blue Dart API. Please check your internet connection and try again.'
  }

  // Configuration errors
  if (message.includes('not configured') || message.includes('credentials')) {
    return 'Blue Dart integration is not configured. Please set the required environment variables.'
  }

  // Return sanitized original message
  return `Blue Dart API error: ${error.message.substring(0, 200)}`
}

/**
 * Maps Blue Dart errors to structured error objects with troubleshooting steps.
 * Enhanced error categorization for better diagnostics and user guidance.
 */
export function mapBlueDartError(error: unknown): BlueDartErrorMapping {
  if (!(error instanceof Error)) {
    return {
      code: 'UNKNOWN',
      category: 'unknown',
      message: 'An unknown error occurred',
      userMessage: 'An unexpected error occurred with Blue Dart integration.',
      troubleshootingSteps: [
        'Try again in a few moments',
        'Contact support if the issue persists',
      ],
      retryable: true,
    }
  }

  const message = error.message.toLowerCase()
  const originalMessage = error.message

  // 401 Unauthorized - Access Not Allowed
  if (message.includes('401') || message.includes('unauthorized') || message.includes('access to the method is not allowed')) {
    return {
      code: 'BD_401_UNAUTHORIZED',
      category: 'auth',
      message: originalMessage,
      userMessage: 'Blue Dart API authentication failed. Invalid credentials or insufficient permissions.',
      troubleshootingSteps: [
        'Verify BLUEDART_LOGIN_ID is correct (check for typos, extra spaces)',
        'Verify BLUEDART_LICENSE_KEY is correct and not expired',
        'Confirm your Blue Dart account has API access enabled',
        'Check if your API credentials have the required permissions for this operation',
        'Contact Blue Dart support to verify your API Gateway account status',
        'Ensure you are using production credentials for production environment',
      ],
      retryable: false,
    }
  }

  // 403 Forbidden
  if (message.includes('403') || message.includes('forbidden')) {
    return {
      code: 'BD_403_FORBIDDEN',
      category: 'permission',
      message: originalMessage,
      userMessage: 'Access forbidden. Your account does not have permission for this operation.',
      troubleshootingSteps: [
        'Verify your Blue Dart account subscription level',
        'Contact Blue Dart support to enable required API features',
        'Check if your account is active and not suspended',
        'Confirm you have access to the specific API endpoint (e.g., waybill generation)',
      ],
      retryable: false,
    }
  }

  // 400 Bad Request / Validation
  if (message.includes('400') || message.includes('bad request') || message.includes('validation')) {
    return {
      code: 'BD_400_VALIDATION',
      category: 'validation',
      message: originalMessage,
      userMessage: 'Request validation failed. Please check the shipment details.',
      troubleshootingSteps: [
        'Verify pincode is valid and serviceable',
        'Check address format and ensure all required fields are provided',
        'Confirm BLUEDART_CUSTOMER_CODE matches your Blue Dart account',
        'Verify BLUEDART_ORIGIN_AREA is correct for your warehouse location',
        'Ensure declared value and weight are valid numbers',
        'Check pickup date is in the future and in YYYY-MM-DD format',
      ],
      retryable: true,
    }
  }

  // Network/timeout errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('fetch failed') ||
    message.includes('enotfound')
  ) {
    return {
      code: 'BD_NETWORK_ERROR',
      category: 'network',
      message: originalMessage,
      userMessage: 'Unable to connect to Blue Dart API. Network connection issue.',
      troubleshootingSteps: [
        'Check your internet connection',
        'Verify the server can reach apigateway.bluedart.com',
        'Check for firewall rules blocking outbound HTTPS requests',
        'Try again in a few moments (Blue Dart API may be temporarily unavailable)',
        'Check Blue Dart API status at their support portal',
      ],
      retryable: true,
    }
  }

  // Configuration errors
  if (message.includes('not configured') || message.includes('credentials')) {
    return {
      code: 'BD_NOT_CONFIGURED',
      category: 'config',
      message: originalMessage,
      userMessage: 'Blue Dart integration is not properly configured.',
      troubleshootingSteps: [
        'Set BLUEDART_LOGIN_ID environment variable',
        'Set BLUEDART_LICENSE_KEY environment variable',
        'For shipment creation: set BLUEDART_CUSTOMER_NAME',
        'For shipment creation: set BLUEDART_CUSTOMER_CODE',
        'For shipment creation: set BLUEDART_ORIGIN_AREA',
        'Restart the application after setting environment variables',
      ],
      retryable: false,
    }
  }

  // Generic error
  return {
    code: 'BD_GENERIC_ERROR',
    category: 'unknown',
    message: originalMessage.substring(0, 200),
    userMessage: `Blue Dart API error: ${originalMessage.substring(0, 200)}`,
    troubleshootingSteps: [
      'Check the error message for specific details',
      'Try again in a few moments',
      'Contact support if the issue persists',
    ],
    retryable: true,
  }
}

/**
 * Gets comprehensive health status of Blue Dart integration.
 * Useful for admin dashboards and health-check endpoints.
 */
export function getBlueDartHealthStatus(): BlueDartHealthStatus {
  const validation = validateBlueDartConfig()

  return {
    configured: isBlueDartConfigured(),
    fullyConfigured: isBlueDartFullyConfigured(),
    mode: validation.mode,
    features: validation.features,
    validation,
    timestamp: new Date().toISOString(),
  }
}
