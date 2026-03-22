# Admin Delivery Partner (DP) API Summary

This document outlines the newly added Admin DP Management API suite, designed for the frontend agent to integrate into the admin dashboard correctly.

**Base Path:** `/api/v1/admin/delivery-partners`
**Authentication:** All routes require a valid JWT with the [admin](file:///d:/Projects/FullStack/Bukizz2/bukizz_node_server/src/routes/adminDeliveryRoutes.js#6-38) role.

---

## 1. Get Delivery Partners List (Hub List)
**Method:** `GET`  
**Endpoint:** `/`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)
- `city` (string, optional)
- `status` (string, optional: `"Idle"`, `"In-Transit"`, `"Inactive"`)
- `kycStatus` (string, optional: `"pending"`, `"approved"`, `"rejected"`)

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "partners": [
      {
        "id": "uuid",
        "full_name": "string",
        "email": "string",
        "phone": "string",
        "is_active": boolean,
        "created_at": "datetime",
        "delivery_partner_data": {
          "vehicle_details": object,
          "kyc_status": "string",
          "is_cod_eligible": boolean,
          "cash_in_hand_limit": number,
          "city": "string"
        },
        "walletBalance": number,
        "activeOrderCount": number,
        "computedStatus": "Idle" | "In-Transit" | "Inactive",
        "cashLimitExceeded": boolean,
        "cashInHandLimit": number
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
  }
}
```

---

## 2. Get DP Details (Profile + Financials)
**Method:** `GET`  
**Endpoint:** [/:id](file:///d:/Projects/FullStack/Bukizz2/bukizz_node_server/src/middleware/validator.js#35-65)

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "profile": {
      "id": "uuid",
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "isActive": boolean,
      "createdAt": "datetime",
      "updatedAt": "datetime"
    },
    "vehicle": {
      "type": "string",
      "registrationNumber": "string"
    },
    "kyc": {
      "status": "string",
      "data": object
    },
    "bank": {
      "accountName": "string",
      "accountNumberMasked": "string",
      "ifsc": "string",
      "verificationStatus": "string"
    },
    "financials": {
      "walletBalance": number,
      "cashInHandLimit": number,
      "isCodEligible": boolean,
      "cashLimitExceeded": boolean
    },
    "activeOrderCount": number
  }
}
```

---

## 3. Get Active Loadout (with SLA Timer)
**Method:** `GET`  
**Endpoint:** `/:id/active-loadout`

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "string",
        "status": "out_for_delivery",
        "total_amount": number,
        "payment_method": "string",
        "shipping_address": object,
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "sla": {
      "oldestOrderTime": "datetime",
      "elapsedMs": number,
      "elapsedFormatted": "string (e.g., '1h 30m')",
      "warning": boolean // True if older than 4 hours
    }
  }
}
```

---

## 4. Force Unassign DP Order
**Method:** `POST`  
**Endpoint:** `/:id/unassign`

**Body Parameters:**
- `orderId` (uuid, required) - The order to unassign
- `reason` (string, required) - Explanation for the audit log

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "dp_id": null,
      "status": "ready_for_pickup"
    },
    "message": "Order unassigned successfully"
  }
}
```

---

## 5. Get Ledger History (with Running Balance)
**Method:** `GET`  
**Endpoint:** `/:id/ledger`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "order_id": "uuid",
        "transaction_type": "string",
        "amount": number,
        "description": "string",
        "created_at": "datetime",
        "runningBalance": number
      }
    ],
    "currentBalance": number,
    "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
}
```

---

## 6. Get Delivery History
**Method:** `GET`  
**Endpoint:** `/:id/history`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "string",
        "status": "delivered",
        "total_amount": number,
        "payment_method": "string",
        "shipping_address": object,
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
  }
}
```
