#!/usr/bin/env tsx
/**
 * Blue Dart Health Check CLI Tool
 *
 * Usage:
 *   npm run bluedart:health
 *   tsx scripts/bluedart-health.ts
 *
 * Checks Blue Dart integration configuration and displays health status.
 */

import { getBlueDartHealthStatus, mapBlueDartError } from '../user/lib/bluedart/config'
import { getDiagnosticsSummary } from '../user/lib/bluedart/diagnostics'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function printHeader(text: string) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`)
}

function printSection(text: string) {
  console.log(`\n${colors.bright}${colors.blue}${text}${colors.reset}`)
  console.log(`${colors.blue}${'-'.repeat(40)}${colors.reset}`)
}

function printSuccess(text: string) {
  console.log(`${colors.green}✓${colors.reset} ${text}`)
}

function printWarning(text: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`)
}

function printError(text: string) {
  console.log(`${colors.red}✗${colors.reset} ${text}`)
}

function printInfo(text: string) {
  console.log(`  ${text}`)
}

async function main() {
  printHeader('Blue Dart Integration Health Check')

  // Get health status
  const health = getBlueDartHealthStatus()

  // Overall Status
  printSection('Overall Status')
  const statusIcon =
    health.mode === 'live' ? '🟢' : health.mode === 'fallback' ? '🟡' : '🔴'
  console.log(`${statusIcon} Mode: ${colors.bright}${health.mode.toUpperCase()}${colors.reset}`)
  console.log(`  Configured: ${health.configured ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`)
  console.log(`  Fully Configured: ${health.fullyConfigured ? colors.green + 'Yes' + colors.reset : colors.yellow + 'No' + colors.reset}`)
  console.log(`  Timestamp: ${health.timestamp}`)

  // Configuration Details
  printSection('Configuration Validation')

  if (health.validation.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`)
    health.validation.errors.forEach((error) => printError(error))
  } else {
    printSuccess('No configuration errors')
  }

  if (health.validation.warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`)
    health.validation.warnings.forEach((warning) => printWarning(warning))
  } else if (health.validation.errors.length === 0) {
    printSuccess('No configuration warnings')
  }

  // Feature Availability
  printSection('Feature Availability')
  const features = health.features
  console.log(`Serviceability Check: ${features.serviceability ? printSuccess('Enabled') : printError('Disabled')}`)
  console.log(`Waybill Generation: ${features.waybillGeneration ? printSuccess('Enabled') : printError('Disabled')}`)
  console.log(`Tracking: ${features.tracking ? printSuccess('Enabled') : printError('Disabled')}`)
  console.log(`Pickup Registration: ${features.pickup ? printSuccess('Enabled') : printError('Disabled')}`)

  // Diagnostics Summary
  try {
    printSection('Recent Diagnostics Summary')
    const summary = await getDiagnosticsSummary()

    if (summary.total === 0) {
      printInfo('No diagnostics available yet')
    } else {
      console.log(`  Total Operations: ${summary.total}`)
      console.log(`  Successful: ${colors.green}${summary.successCount}${colors.reset} (${Math.round((summary.successCount / summary.total) * 100)}%)`)
      console.log(`  Failed: ${colors.red}${summary.failureCount}${colors.reset} (${Math.round((summary.failureCount / summary.total) * 100)}%)`)
      console.log(`  Live Mode: ${summary.liveCount}`)
      console.log(`  Fallback Mode: ${summary.fallbackCount}`)

      if (summary.avgWaybillDurationMs > 0) {
        console.log(`  Avg Waybill Duration: ${summary.avgWaybillDurationMs}ms`)
      }
      if (summary.avgPickupDurationMs > 0) {
        console.log(`  Avg Pickup Duration: ${summary.avgPickupDurationMs}ms`)
      }

      if (summary.commonErrors.length > 0) {
        console.log(`\n${colors.yellow}Common Errors:${colors.reset}`)
        summary.commonErrors.forEach((error) => {
          console.log(`  ${error.code} (${error.count}x): ${error.message}`)
        })
      }
    }
  } catch (error) {
    printWarning('Could not load diagnostics summary')
    if (error instanceof Error) {
      printInfo(`Error: ${error.message}`)
    }
  }

  // Recommendations
  printSection('Recommendations')

  if (health.mode === 'unconfigured') {
    printError('Blue Dart is not configured')
    printInfo('Set BLUEDART_LOGIN_ID and BLUEDART_LICENSE_KEY to enable the integration')
  } else if (health.mode === 'fallback') {
    printWarning('Blue Dart is in fallback mode (limited features)')
    printInfo('Set the following environment variables for full functionality:')
    if (!health.validation.config?.customerName) {
      printInfo('  - BLUEDART_CUSTOMER_NAME')
    }
    if (!health.validation.config?.customerCode) {
      printInfo('  - BLUEDART_CUSTOMER_CODE')
    }
    if (!health.validation.config?.originArea) {
      printInfo('  - BLUEDART_ORIGIN_AREA')
    }
  } else {
    printSuccess('Blue Dart is fully configured and operational')
  }

  // Exit code
  const exitCode = health.mode === 'unconfigured' ? 2 : health.mode === 'fallback' ? 1 : 0
  console.log(`\n${colors.bright}Exit Code: ${exitCode}${colors.reset}`)
  console.log(`  0 = Fully operational`)
  console.log(`  1 = Degraded (fallback mode)`)
  console.log(`  2 = Not configured\n`)

  process.exit(exitCode)
}

main().catch((error) => {
  console.error(`\n${colors.red}Fatal Error:${colors.reset}`, error)
  process.exit(3)
})
