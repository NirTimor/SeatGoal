# User Profile API Documentation

## Overview
This document describes all the API endpoints for the SeatGoal user profile system (אזור אישי).

All endpoints require authentication via Clerk. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. User Profile Management

### Get User Profile
```
GET /user-profile
```
Returns the current user's profile information with censored ID number.

**Response:**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+972501234567",
  "idNumberLast4": "*********1234",
  "birthDate": "1990-01-01T00:00:00Z",
  "gender": "MALE",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4",
  "city": "Tel Aviv",
  "postalCode": "12345",
  "country": "IL",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Create User Profile
```
POST /user-profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+972501234567",
  "idNumber": "123456789",
  "birthDate": "1990-01-01",
  "gender": "MALE",
  "addressLine1": "123 Main St",
  "city": "Tel Aviv",
  "postalCode": "12345"
}
```

### Update User Profile
```
PUT /user-profile
```

**Request Body:** (all fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+972501234567",
  "idNumber": "123456789",
  "birthDate": "1990-01-01",
  "gender": "MALE",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4",
  "city": "Tel Aviv",
  "postalCode": "12345"
}
```

### Delete User Profile
```
DELETE /user-profile
```

---

## 2. Season Subscriptions (מנויים עונתיים)

### Get All Subscriptions
```
GET /subscriptions
```
Returns both active and expired subscriptions.

**Response:**
```json
{
  "active": [
    {
      "id": "uuid",
      "team": "Maccabi Tel Aviv",
      "teamHe": "מכבי תל אביב",
      "season": "2024-2025",
      "startDate": "2024-08-01T00:00:00Z",
      "endDate": "2025-05-31T00:00:00Z",
      "status": "ACTIVE",
      "price": 1200.00,
      "seatInfo": {
        "section": "VIP",
        "row": "5",
        "number": "12"
      },
      "autoRenew": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "expired": [],
  "total": 1
}
```

### Get Active Subscriptions
```
GET /subscriptions/active
```

### Get Expired Subscriptions
```
GET /subscriptions/expired
```

### Create Subscription
```
POST /subscriptions
```

**Request Body:**
```json
{
  "team": "Maccabi Tel Aviv",
  "teamHe": "מכבי תל אביב",
  "season": "2024-2025",
  "startDate": "2024-08-01",
  "endDate": "2025-05-31",
  "price": 1200.00,
  "seatInfo": {
    "section": "VIP",
    "row": "5",
    "number": "12"
  },
  "autoRenew": true
}
```

### Update Subscription
```
PUT /subscriptions/:id
```

**Request Body:**
```json
{
  "autoRenew": false,
  "status": "CANCELLED"
}
```

### Cancel Subscription
```
DELETE /subscriptions/:id
```

### Renew Subscription
```
POST /subscriptions/renew
```

**Request Body:**
```json
{
  "subscriptionId": "uuid",
  "newSeason": "2025-2026",
  "newStartDate": "2025-08-01",
  "newEndDate": "2026-05-31",
  "newPrice": 1300.00
}
```

---

## 3. Loyalty Points (נקודות נאמנות)

### Get Points Balance
```
GET /loyalty/balance
```

**Response:**
```json
{
  "totalPoints": 350,
  "activePoints": 350,
  "expiredPoints": 0,
  "redeemedPoints": 100,
  "expiringWithin30Days": 50
}
```

### Get Points History
```
GET /loyalty/history?page=1&pageSize=20
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "points": 50,
      "type": "AWAY_GAME_PURCHASE",
      "reason": "Purchased ticket for away game: Maccabi Tel Aviv vs Hapoel Beer Sheva",
      "orderId": "uuid",
      "eventId": "uuid",
      "expiresAt": "2025-12-31T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "balance": {
    "totalPoints": 350,
    "activePoints": 350,
    "expiredPoints": 0,
    "redeemedPoints": 100,
    "expiringWithin30Days": 50
  },
  "total": 25,
  "page": 1,
  "pageSize": 20
}
```

### Get Points Calculation
```
GET /loyalty/calculation
```

**Response:**
```json
{
  "awayGamePoints": 250,
  "homeGameAttendancePoints": 150,
  "subscriptionBonusPoints": 200,
  "totalEarned": 600
}
```

### Redeem Points
```
POST /loyalty/redeem
```

**Request Body:**
```json
{
  "points": 100,
  "reason": "Discount on ticket purchase",
  "orderId": "uuid"
}
```

### Mark Attendance
```
POST /loyalty/attendance
```

**Request Body:**
```json
{
  "orderItemId": "uuid"
}
```

**Response:**
```json
{
  "attended": true,
  "pointsAwarded": 30
}
```

---

## 4. Order History (היסטוריית הזמנות)

### Get Order History
```
GET /orders?status=PAID&page=1&pageSize=20&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `status` (optional): PENDING, PAID, CANCELLED, REFUNDED
- `eventId` (optional): Filter by event
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "totalAmount": 250.00,
      "currency": "ILS",
      "status": "PAID",
      "event": {
        "homeTeam": "Maccabi Tel Aviv",
        "awayTeam": "Hapoel Beer Sheva",
        "eventDate": "2024-12-25T20:00:00Z"
      },
      "orderItems": [
        {
          "id": "uuid",
          "price": 125.00,
          "attended": false,
          "seat": {
            "section": "A",
            "row": "10",
            "number": "5"
          }
        }
      ],
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### Get Upcoming Orders
```
GET /orders/upcoming
```
Returns orders for events that haven't occurred yet.

### Get Past Orders
```
GET /orders/past
```
Returns orders for events that have already occurred.

### Get Order Details
```
GET /orders/:id
```

**Response:**
```json
{
  "id": "uuid",
  "totalAmount": 250.00,
  "currency": "ILS",
  "status": "PAID",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+972501234567",
  "event": {
    "id": "uuid",
    "homeTeam": "Maccabi Tel Aviv",
    "homeTeamHe": "מכבי תל אביב",
    "awayTeam": "Hapoel Beer Sheva",
    "awayTeamHe": "הפועל באר שבע",
    "eventDate": "2024-12-25T20:00:00Z",
    "stadium": {
      "name": "Bloomfield Stadium",
      "nameHe": "אצטדיון בלומפילד",
      "city": "Tel Aviv",
      "cityHe": "תל אביב"
    }
  },
  "orderItems": [
    {
      "id": "uuid",
      "price": 125.00,
      "attended": false,
      "attendedAt": null,
      "seat": {
        "section": "A",
        "row": "10",
        "number": "5"
      },
      "transfer": null
    }
  ],
  "createdAt": "2024-11-01T10:00:00Z"
}
```

### Get Order Statistics
```
GET /orders/stats
```

**Response:**
```json
{
  "totalOrders": 45,
  "totalSpent": 5600.00,
  "paidOrders": 40,
  "cancelledOrders": 3,
  "refundedOrders": 2,
  "totalTickets": 95,
  "upcomingEvents": 8,
  "pastEvents": 32
}
```

### Download Receipt
```
GET /orders/:id/receipt
```

**Response:**
```json
{
  "receipt": {
    "orderId": "uuid",
    "orderDate": "2024-11-01T10:00:00Z",
    "status": "PAID",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+972501234567"
    },
    "event": {
      "name": "Maccabi Tel Aviv vs Hapoel Beer Sheva",
      "nameHe": "מכבי תל אביב נגד הפועל באר שבע",
      "date": "2024-12-25T20:00:00Z",
      "venue": "Bloomfield Stadium",
      "venueHe": "אצטדיון בלומפילד"
    },
    "tickets": [
      {
        "section": "A",
        "row": "10",
        "seat": "5",
        "price": 125.00
      }
    ],
    "total": 250.00,
    "currency": "ILS"
  }
}
```

---

## 5. Ticket Transfers (העברות כרטיסים)

### Get All Transfers
```
GET /transfers
```

**Response:**
```json
{
  "sent": [
    {
      "id": "uuid",
      "orderItemId": "uuid",
      "receiverEmail": "friend@example.com",
      "status": "PENDING",
      "message": "Enjoy the game!",
      "expiresAt": "2024-12-20T00:00:00Z",
      "event": {
        "homeTeam": "Maccabi Tel Aviv",
        "eventDate": "2024-12-25T20:00:00Z"
      },
      "seat": {
        "section": "A",
        "row": "10",
        "number": "5"
      },
      "createdAt": "2024-12-13T10:00:00Z"
    }
  ],
  "received": [],
  "pendingReceived": 0,
  "total": 1
}
```

### Get Sent Transfers
```
GET /transfers/sent
```

### Get Received Transfers
```
GET /transfers/received
```

### Get Pending Transfers
```
GET /transfers/pending
```
Returns transfers pending acceptance by the current user.

### Get Transfer Statistics
```
GET /transfers/stats
```

**Response:**
```json
{
  "totalSent": 10,
  "totalReceived": 5,
  "pendingSent": 2,
  "pendingReceived": 1,
  "acceptedSent": 6,
  "acceptedReceived": 3,
  "rejectedSent": 2,
  "rejectedReceived": 1
}
```

### Create Transfer
```
POST /transfers
```

**Request Body:**
```json
{
  "orderItemId": "uuid",
  "receiverEmail": "friend@example.com",
  "message": "Enjoy the game!",
  "expiresInDays": 7
}
```

### Accept Transfer
```
POST /transfers/accept
```

**Request Body:**
```json
{
  "transferId": "uuid"
}
```

### Reject Transfer
```
POST /transfers/reject
```

**Request Body:**
```json
{
  "transferId": "uuid",
  "reason": "Cannot attend"
}
```

### Cancel Transfer
```
POST /transfers/cancel
```

**Request Body:**
```json
{
  "transferId": "uuid"
}
```

---

## 6. Payment Methods (אמצעי תשלום)

### Get All Payment Methods
```
GET /payment-methods
```

**Response:**
```json
{
  "methods": [
    {
      "id": "uuid",
      "type": "CARD",
      "provider": "stripe",
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "holderName": "John Doe",
      "isDefault": true,
      "billingAddress": {
        "line1": "123 Main St",
        "city": "Tel Aviv",
        "postalCode": "12345",
        "country": "IL"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "defaultMethod": {
    "id": "uuid",
    "last4": "4242",
    "brand": "visa",
    "isDefault": true
  },
  "total": 2
}
```

### Get Default Payment Method
```
GET /payment-methods/default
```

### Get Payment Method by ID
```
GET /payment-methods/:id
```

### Add Payment Method
```
POST /payment-methods
```

**Request Body:**
```json
{
  "type": "CARD",
  "provider": "stripe",
  "providerMethodId": "pm_1234567890",
  "last4": "4242",
  "brand": "visa",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "holderName": "John Doe",
  "isDefault": true,
  "billingAddress": {
    "line1": "123 Main St",
    "city": "Tel Aviv",
    "postalCode": "12345",
    "country": "IL"
  }
}
```

### Update Payment Method
```
PUT /payment-methods/:id
```

**Request Body:**
```json
{
  "holderName": "John Smith",
  "isDefault": false,
  "billingAddress": {
    "line1": "456 Oak Ave",
    "city": "Tel Aviv",
    "postalCode": "12345",
    "country": "IL"
  }
}
```

### Set Default Payment Method
```
POST /payment-methods/set-default
```

**Request Body:**
```json
{
  "paymentMethodId": "uuid"
}
```

### Delete Payment Method
```
DELETE /payment-methods/:id
```

---

## Enums

### Gender
- `MALE`
- `FEMALE`
- `OTHER`
- `PREFER_NOT_TO_SAY`

### SubscriptionStatus
- `ACTIVE`
- `EXPIRED`
- `CANCELLED`
- `SUSPENDED`

### LoyaltyPointType
- `AWAY_GAME_PURCHASE` - 50 points
- `HOME_GAME_ATTENDANCE` - 30 points (verified)
- `SUBSCRIPTION_BONUS` - 200 points
- `REFERRAL` - 100 points
- `REDEEMED` - Negative value
- `EXPIRED` - Negative value
- `ADMIN_ADJUSTMENT`

### TransferStatus
- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `CANCELLED`
- `EXPIRED`

### OrderStatus
- `PENDING`
- `PAID`
- `CANCELLED`
- `REFUNDED`

### PaymentMethodType
- `CARD`
- `PAYPAL`
- `BANK_ACCOUNT`
- `DIGITAL_WALLET`

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "You are not authorized to access this resource",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Conflict"
}
```
