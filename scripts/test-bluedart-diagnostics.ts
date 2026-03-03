#!/usr/bin/env tsx
/**
 * Test Script: Blue Dart Diagnostics
 *
 * Tests the diagnostics persistence and retrieval functionality.
 */

import {
  createDiagnostic,
  saveDiagnostic,
  getRecentDiagnostics,
  getDiagnosticsSummary,
} from '../user/lib/bluedart/diagnostics'
import { mapBlueDartError } from '../user/lib/bluedart/config'

console.log('=== Blue Dart Diagnostics Tests ===\n')

async function runTests() {
  // Test 1: Create and save a diagnostic
  console.log('Test 1: Create and Save Diagnostic')

  const testRequest = {
    orderId: 'TEST-ORDER-001',
    consigneeName: 'Test Customer',
    consigneeAddress1: '123 Test Street',
    consigneePincode: '110001',
    consigneeMobile: '9876543210',
    weight: 0.5,
    declaredValue: 1000,
    pickupDate: '2026-03-05',
    pickupTime: '1400',
  }

  const diagnostic = createDiagnostic('TEST-ORDER-001', testRequest, 'live')
  console.log('Created diagnostic:', diagnostic.id)

  // Simulate a successful waybill call
  diagnostic.apiCalls.waybill = {
    requestedAt: new Date().toISOString(),
    completedAt: new Date(Date.now() + 1500).toISOString(),
    durationMs: 1500,
    success: true,
  }

  // Simulate a successful pickup call
  diagnostic.apiCalls.pickup = {
    requestedAt: new Date(Date.now() + 1500).toISOString(),
    completedAt: new Date(Date.now() + 2800).toISOString(),
    durationMs: 1300,
    success: true,
  }

  diagnostic.response = {
    success: true,
    awbNumber: 'TEST-AWB-12345',
    destinationArea: 'DEL',
    destinationLocation: 'Delhi',
    pickupToken: 'PICKUP-TOKEN-123',
  }

  await saveDiagnostic(diagnostic)
  console.log('Saved diagnostic successfully')
  console.log()

  // Test 2: Create a failed diagnostic
  console.log('Test 2: Create Failed Diagnostic')

  const failedDiagnostic = createDiagnostic('TEST-ORDER-002', testRequest, 'live')
  failedDiagnostic.apiCalls.waybill = {
    requestedAt: new Date().toISOString(),
    completedAt: new Date(Date.now() + 800).toISOString(),
    durationMs: 800,
    success: false,
    error: '401 Unauthorized - Access to the method is not allowed',
    httpStatus: 401,
  }

  const error = new Error('401 Unauthorized - Access to the method is not allowed')
  failedDiagnostic.error = mapBlueDartError(error)
  failedDiagnostic.response = {
    success: false,
    error: failedDiagnostic.error.userMessage,
  }

  await saveDiagnostic(failedDiagnostic)
  console.log('Saved failed diagnostic successfully')
  console.log()

  // Test 3: Retrieve recent diagnostics
  console.log('Test 3: Retrieve Recent Diagnostics')
  const recent = await getRecentDiagnostics(5)
  console.log(`Found ${recent.length} recent diagnostics`)
  for (const diag of recent) {
    console.log(`  - ${diag.orderId} (${diag.mode}): ${diag.response?.success ? 'SUCCESS' : 'FAILED'}`)
  }
  console.log()

  // Test 4: Get diagnostics summary
  console.log('Test 4: Diagnostics Summary')
  const summary = await getDiagnosticsSummary()
  console.log('Summary:', JSON.stringify(summary, null, 2))
  console.log()
}

runTests()
  .then(() => {
    console.log('=== Tests Completed ===')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
