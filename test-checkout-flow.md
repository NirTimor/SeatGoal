# Full Checkout Flow Test Guide

## Prerequisites
- API server running on http://localhost:3001
- Web server running on http://localhost:3000
- User signed in to Clerk

## Test Steps

### 1. Navigate to Event Page
- URL: http://localhost:3000/he/events/b49af636-6c1d-4af0-a01a-b483fc95a946
- Verify: Event details are displayed (Maccabi Tel Aviv vs Hapoel Beer Sheva)

### 2. Select Seat(s)
- Click on an available seat (green color)
- Verify: Seat turns blue and appears in the shopping cart sidebar
- Verify: Total price is displayed (e.g., ₪120 for 1 seat)

### 3. Hold Seats
- Click "החזק מושבים" (Hold Seats) button
- Expected: Button changes to "מחזיק..." (Holding...)
- Verify: After success:
  - Timer appears showing 10:00 countdown
  - "שחרר מושבים" (Release Seats) button appears
  - "המשך לתשלום" (Proceed to Checkout) button appears

### 4. Proceed to Checkout
- Click "המשך לתשלום" (Proceed to Checkout) button
- Verify: Redirected to checkout page with session and event parameters

### 5. Fill Checkout Form
- Enter customer details:
  - Email
  - First Name
  - Last Name
  - Phone
- Click submit/proceed button

### 6. Payment Simulation
Since Stripe is not configured, the app will use simulation mode:
- You'll be redirected to a mock payment page
- Click the "Complete Payment" or similar button
- Expected: Payment simulation API call to `/checkout/simulate-payment`

### 7. Verify Success
- Verify: Redirected to success page
- Verify: Order confirmation displayed with order ID
- Verify: Order status is PAID
- Expected: Seat status changed from HELD to SOLD

## API Endpoints Used

1. **Hold Seats**: `POST /cart/hold`
   - Requires authentication (Clerk token)
   - Sets seat to HELD status
   - Creates 10-minute hold in Redis

2. **Create Checkout Session**: `POST /checkout/session`
   - Requires authentication
   - Creates order in PENDING status
   - Returns checkout URL

3. **Simulate Payment**: `POST /checkout/simulate-payment`
   - Public endpoint (for testing)
   - Updates order to PAID status
   - Updates seats to SOLD status

## Manual API Testing

If you want to test the API directly without the UI:

```bash
# 1. Hold a seat (replace with your Clerk token)
curl -X POST http://localhost:3001/cart/hold \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "eventId": "b49af636-6c1d-4af0-a01a-b483fc95a946",
    "seatIds": ["889ef25d-b0fd-4bd2-bd74-8bf8af252c9e"],
    "sessionId": "test-session-789"
  }'

# 2. Create checkout session
curl -X POST http://localhost:3001/checkout/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "eventId": "b49af636-6c1d-4af0-a01a-b483fc95a946",
    "sessionId": "test-session-789",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "0501234567"
  }'

# 3. Simulate payment (use sessionId from step 2 response)
curl -X POST http://localhost:3001/checkout/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sim_XXXX_XXXX",
    "success": true
  }'

# 4. Check order status (use orderId from step 2 response)
curl http://localhost:3001/checkout/order/ORDER_ID
```

## Expected Database State

After successful checkout:

### Order Table
```
id: UUID
status: PAID
totalAmount: 120
userId: clerk_user_id
eventId: b49af636-6c1d-4af0-a01a-b483fc95a946
```

### Ticket Inventory
```
seatId: 889ef25d-b0fd-4bd2-bd74-8bf8af252c9e
status: SOLD (changed from HELD)
holdExpiresAt: null
```

### Redis
- Hold key removed after payment
- Payment session created and then removed

## Troubleshooting

### "Please sign in to hold seats"
- Authentication is now required
- Sign in with Clerk before attempting to hold seats

### "Event is not currently on sale"
- Check event `saleStartDate` and `saleEndDate` in database
- Current time must be between these dates
- Event `status` must be "ON_SALE"

### "No seats are held for this session"
- Seats may have expired (10-minute timeout)
- Re-hold the seats before creating checkout session

### "Foreign key constraint violated"
- User must exist in database
- Clerk authentication creates user automatically
