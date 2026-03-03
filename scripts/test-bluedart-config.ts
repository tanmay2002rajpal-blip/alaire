#!/usr/bin/env tsx
/**
 * Test Script: Blue Dart Configuration Validation
 *
 * Tests the enhanced configuration validation, error mapping,
 * and health status reporting.
 */

import {
  validateBlueDartConfig,
  getBlueDartHealthStatus,
  mapBlueDartError,
  isBlueDartConfigured,
  isBlueDartFullyConfigured,
} from '../user/lib/bluedart/config'

console.log('=== Blue Dart Configuration Validation Tests ===\n')

// Test 1: Validate configuration
console.log('Test 1: Validate Configuration')
const validation = validateBlueDartConfig()
console.log('Valid:', validation.isValid)
console.log('Mode:', validation.mode)
console.log('Errors:', validation.errors)
console.log('Warnings:', validation.warnings)
console.log('Features:', validation.features)
console.log()

// Test 2: Check configuration helpers
console.log('Test 2: Configuration Helpers')
console.log('isBlueDartConfigured():', isBlueDartConfigured())
console.log('isBlueDartFullyConfigured():', isBlueDartFullyConfigured())
console.log()

// Test 3: Health status
console.log('Test 3: Health Status')
const health = getBlueDartHealthStatus()
console.log('Status:', JSON.stringify(health, null, 2))
console.log()

// Test 4: Error mapping
console.log('Test 4: Error Mapping')
const testErrors = [
  new Error('Blue Dart API error: 401 Unauthorized - Access to the method is not allowed'),
  new Error('Blue Dart API error: 403 Forbidden'),
  new Error('Blue Dart API error: 400 Bad Request - Invalid pincode'),
  new Error('Network error: ECONNREFUSED'),
  new Error('Blue Dart credentials not configured'),
  new Error('Unknown error occurred'),
]

for (const error of testErrors) {
  const mapping = mapBlueDartError(error)
  console.log(`\nOriginal: ${error.message}`)
  console.log(`Code: ${mapping.code}`)
  console.log(`Category: ${mapping.category}`)
  console.log(`User Message: ${mapping.userMessage}`)
  console.log(`Retryable: ${mapping.retryable}`)
  console.log(`Troubleshooting Steps: ${mapping.troubleshootingSteps.length} steps`)
}

console.log('\n=== Tests Completed ===')
