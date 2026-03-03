# Blue Dart Integration Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [401 Unauthorized - Access Not Allowed](#401-unauthorized---access-not-allowed)
3. [Configuration Issues](#configuration-issues)
4. [Testing and Validation](#testing-and-validation)
5. [Diagnostics and Monitoring](#diagnostics-and-monitoring)
6. [Contact Support](#contact-support)

---

## Common Issues

### Quick Checklist

Before diving into specific issues, verify the following:

- [ ] All required environment variables are set
- [ ] Environment variables do not have leading/trailing whitespace
- [ ] The application has been restarted after setting environment variables
- [ ] Your Blue Dart API Gateway account is active
- [ ] You are using the correct credentials (production vs test)

---

## 401 Unauthorized - Access Not Allowed

### Symptom

```
Blue Dart API error: 401 Unauthorized
Error: Access to the method is not allowed
```

### Root Causes

This error indicates that Blue Dart's API Gateway is rejecting your authentication. The most common causes are:

#### 1. Invalid or Incorrect Credentials

**Problem:** The `BLUEDART_LOGIN_ID` or `BLUEDART_LICENSE_KEY` is incorrect, misspelled, or contains extra characters.

**Solution:**
1. Double-check your credentials in the Blue Dart API Gateway portal
2. Copy-paste the credentials directly (avoid manual typing)
3. Check for hidden characters or whitespace:
   ```bash
   # Check for whitespace
   echo -n "$BLUEDART_LOGIN_ID" | wc -c
   echo -n "$BLUEDART_LICENSE_KEY" | wc -c
   ```
4. Verify the credentials format:
   - Login ID: Usually an email or alphanumeric string
   - License Key: Usually a long alphanumeric string (JWT format)

#### 2. Expired License Key

**Problem:** Your Blue Dart API license key has expired.

**Solution:**
1. Log in to the Blue Dart API Gateway portal
2. Check the expiry date of your license key
3. Generate a new license key if expired
4. Update the `BLUEDART_LICENSE_KEY` environment variable
5. Restart your application

#### 3. Insufficient API Permissions

**Problem:** Your Blue Dart account does not have permission to access the specific API endpoint.

**Solution:**
1. Contact Blue Dart support to verify your account subscription level
2. Ensure your account has access to:
   - Serviceability API (GetServicesforPincode)
   - Waybill Generation API (GenerateWayBill)
   - Tracking API
   - Pickup Registration API
3. Request activation of required APIs if they are disabled

#### 4. Wrong Environment Credentials

**Problem:** Using test credentials in production or vice versa.

**Solution:**
1. Verify the `BLUEDART_API_TYPE` environment variable:
   - `S` = Production (Shipping)
   - `T` = Test environment
2. Ensure your credentials match the environment:
   - Production credentials for production deployments
   - Test credentials for staging/development

#### 5. IP Whitelisting Issues

**Problem:** Blue Dart may require IP whitelisting for API access.

**Solution:**
1. Check with Blue Dart if IP whitelisting is enabled for your account
2. Provide your server's public IP address to Blue Dart support
3. Request whitelisting for your IP addresses

### Verification Steps

After making changes, verify your configuration:

1. **Run the health check script:**
   ```bash
   npm run bluedart:health
   # or
   tsx scripts/bluedart-health.ts
   ```

2. **Test configuration validation:**
   ```bash
   tsx scripts/test-bluedart-config.ts
   ```

3. **Check the health endpoint:**
   ```bash
   curl http://localhost:3000/api/bluedart/health
   ```

4. **Review diagnostics for error patterns:**
   ```bash
   curl http://localhost:3000/api/bluedart/diagnostics?limit=10
   ```

### Example: Fixing 401 Error

```bash
# 1. Verify current credentials
echo "Login ID: $BLUEDART_LOGIN_ID"
echo "License Key (first 10 chars): ${BLUEDART_LICENSE_KEY:0:10}..."

# 2. Update credentials (remove quotes if present)
export BLUEDART_LOGIN_ID="your-actual-login-id"
export BLUEDART_LICENSE_KEY="your-actual-license-key"

# 3. Verify no whitespace
export BLUEDART_LOGIN_ID=$(echo "$BLUEDART_LOGIN_ID" | xargs)
export BLUEDART_LICENSE_KEY=$(echo "$BLUEDART_LICENSE_KEY" | xargs)

# 4. Restart your application
npm run dev  # or your production start command

# 5. Test the health endpoint
curl http://localhost:3000/api/bluedart/health | jq .
```

---

## Configuration Issues

### Missing Environment Variables

**Symptom:**
```
Blue Dart is not configured
Required environment variables not set
```

**Required Variables:**

**Minimum (for serviceability and tracking):**
- `BLUEDART_LOGIN_ID` - Your API Gateway login ID
- `BLUEDART_LICENSE_KEY` - Your API Gateway license key

**Full Configuration (for shipment creation):**
- `BLUEDART_CUSTOMER_NAME` - Your company name
- `BLUEDART_CUSTOMER_CODE` - Your Blue Dart customer code
- `BLUEDART_ORIGIN_AREA` - Your warehouse area code (e.g., "HRY")

**Optional:**
- `BLUEDART_API_TYPE` - "S" for shipping (default) or "T" for test
- `BLUEDART_VERSION` - API version (default: "1.3")
- `BLUEDART_BRANCH` - Your branch code

**Example .env file:**
```env
BLUEDART_LOGIN_ID=your-login-id
BLUEDART_LICENSE_KEY=your-license-key
BLUEDART_API_TYPE=S
BLUEDART_VERSION=1.3
BLUEDART_CUSTOMER_NAME=Your Company Name
BLUEDART_CUSTOMER_CODE=YOUR123
BLUEDART_ORIGIN_AREA=HRY
```

### Mode: Fallback vs Live

The integration operates in three modes:

1. **Unconfigured** - No credentials set
   - Fallback to default shipping values
   - No API calls made

2. **Fallback Mode** - Only basic credentials set
   - Serviceability checks work
   - Tracking works
   - Waybill generation **disabled**
   - Pickup registration **disabled**

3. **Live Mode** - Full configuration
   - All features enabled
   - Complete integration

**Check your mode:**
```bash
npm run bluedart:health
```

---

## Testing and Validation

### Health Check Script

Run the comprehensive health check:

```bash
npm run bluedart:health
```

**Exit codes:**
- `0` - Fully operational (live mode)
- `1` - Degraded (fallback mode)
- `2` - Not configured
- `3` - Fatal error

### Configuration Tests

Test configuration validation and error mapping:

```bash
tsx scripts/test-bluedart-config.ts
```

### Diagnostics Tests

Test diagnostics persistence and retrieval:

```bash
tsx scripts/test-bluedart-diagnostics.ts
```

### API Health Endpoints

#### User App Health Check
```bash
curl http://localhost:3000/api/bluedart/health | jq .
```

#### Admin Dashboard Health Check
```bash
curl http://localhost:3001/api/bluedart/health | jq .
```

#### Admin Diagnostics
```bash
# Recent diagnostics
curl http://localhost:3001/api/bluedart/diagnostics?limit=20 | jq .

# Diagnostics for specific order
curl "http://localhost:3001/api/bluedart/diagnostics?orderId=ORDER-123" | jq .
```

---

## Diagnostics and Monitoring

### Diagnostic Files

Diagnostics are automatically saved to disk for every shipment creation attempt.

**Default location:** `/tmp/bluedart-diagnostics/`

**Configure location:**
```env
BLUEDART_DIAGNOSTICS_DIR=/var/log/bluedart-diagnostics
```

**Disable diagnostics:**
```env
BLUEDART_ENABLE_DIAGNOSTICS=false
```

### Diagnostic File Structure

Each diagnostic file contains:
```json
{
  "id": "unique-diagnostic-id",
  "orderId": "ORDER-123",
  "timestamp": "2026-03-03T10:30:00.000Z",
  "mode": "live",
  "request": {
    "orderId": "ORDER-123",
    "consigneeName": "Customer Name",
    "consigneePincode": "110001",
    ...
  },
  "response": {
    "success": true,
    "awbNumber": "AWB-12345",
    ...
  },
  "apiCalls": {
    "waybill": {
      "requestedAt": "2026-03-03T10:30:00.000Z",
      "completedAt": "2026-03-03T10:30:01.500Z",
      "durationMs": 1500,
      "success": true
    },
    "pickup": {
      "requestedAt": "2026-03-03T10:30:01.500Z",
      "completedAt": "2026-03-03T10:30:02.800Z",
      "durationMs": 1300,
      "success": true
    }
  },
  "error": null,
  "config": {
    "hasLoginId": true,
    "hasLicenseKey": true,
    "hasCustomerName": true,
    "hasCustomerCode": true,
    "hasOriginArea": true,
    "apiType": "S",
    "version": "1.3"
  }
}
```

### Monitoring Dashboard

The admin dashboard provides:
- Real-time health status
- Success/failure rates
- Average API response times
- Common error patterns
- Recent shipment diagnostics

**Access:** `http://localhost:3001/api/bluedart/diagnostics`

---

## Common Error Codes Reference

| Code | Category | Description | Retryable |
|------|----------|-------------|-----------|
| BD_401_UNAUTHORIZED | auth | Invalid credentials or insufficient permissions | No |
| BD_403_FORBIDDEN | permission | Account lacks required permissions | No |
| BD_400_VALIDATION | validation | Invalid request parameters | Yes |
| BD_NETWORK_ERROR | network | Connection or timeout issue | Yes |
| BD_NOT_CONFIGURED | config | Missing environment variables | No |
| BD_GENERIC_ERROR | unknown | Unhandled error | Yes |

---

## Contact Support

### Blue Dart Support

For API-related issues:
- **Email:** apisupport@bluedart.com
- **Portal:** https://apigateway.bluedart.com
- **Phone:** Check Blue Dart website for current support number

**Information to provide:**
1. Your customer code
2. Login ID (do NOT share license key)
3. Error message and HTTP status code
4. Timestamp of the error
5. Endpoint you were trying to access

### Application Support

For integration issues:
1. Run the health check script and share output
2. Share relevant diagnostic files (redact sensitive data)
3. Provide error logs from the application
4. Specify your environment (production/staging/development)

---

## Appendix: Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| BLUEDART_LOGIN_ID | Yes | - | API Gateway login ID |
| BLUEDART_LICENSE_KEY | Yes | - | API Gateway license key (JWT) |
| BLUEDART_API_TYPE | No | "S" | API type: "S" (Shipping) or "T" (Test) |
| BLUEDART_VERSION | No | "1.3" | API version |
| BLUEDART_CUSTOMER_NAME | For shipments | - | Your company name |
| BLUEDART_CUSTOMER_CODE | For shipments | - | Your Blue Dart customer code |
| BLUEDART_ORIGIN_AREA | For shipments | - | Warehouse area code (e.g., "HRY") |
| BLUEDART_BRANCH | No | - | Branch code |
| BLUEDART_DIAGNOSTICS_DIR | No | /tmp/bluedart-diagnostics | Diagnostics storage location |
| BLUEDART_ENABLE_DIAGNOSTICS | No | true | Enable/disable diagnostics |
| BLUEDART_MAX_DIAGNOSTICS_FILES | No | 100 | Max diagnostic files to keep |

---

**Document Version:** 1.0
**Last Updated:** 2026-03-03
**Applies to:** alaire Blue Dart Integration v2.0
