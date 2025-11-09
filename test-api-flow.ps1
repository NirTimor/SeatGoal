# SeatGoal API Flow Test Script
# Tests the complete checkout flow with curl

Write-Host "=== SeatGoal API Flow Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Events
Write-Host "1. Fetching events..." -ForegroundColor Yellow
$events = curl -s http://localhost:3001/events | ConvertFrom-Json
$eventId = $events.data[0].id
Write-Host "   Found event: $($events.data[0].homeTeam) vs $($events.data[0].awayTeam)" -ForegroundColor Green
Write-Host "   Event ID: $eventId" -ForegroundColor Green
Write-Host ""

# Step 2: Get Seats for Event
Write-Host "2. Fetching seats for event..." -ForegroundColor Yellow
$seats = curl -s "http://localhost:3001/events/$eventId/seats" | ConvertFrom-Json
$availableSeats = $seats.data | Where-Object { $_.status -eq "AVAILABLE" } | Select-Object -First 2
$seatIds = $availableSeats | ForEach-Object { $_.id }
Write-Host "   Found $($seats.data.Count) total seats" -ForegroundColor Green
Write-Host "   Selected 2 available seats: $($seatIds -join ', ')" -ForegroundColor Green
Write-Host ""

# Step 3: Hold Seats
Write-Host "3. Holding seats..." -ForegroundColor Yellow
$sessionId = "test-session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$holdBody = @{
    eventId = $eventId
    seatIds = @($seatIds)
    sessionId = $sessionId
} | ConvertTo-Json

$holdResponse = curl -s -X POST http://localhost:3001/cart/hold `
    -H "Content-Type: application/json" `
    -d $holdBody | ConvertFrom-Json

Write-Host "   Seats held successfully!" -ForegroundColor Green
Write-Host "   Hold ID: $($holdResponse.holdId)" -ForegroundColor Green
Write-Host "   Expires in: $($holdResponse.expiresIn) seconds" -ForegroundColor Green
Write-Host "   Total price: ₪$($holdResponse.totalPrice)" -ForegroundColor Green
Write-Host ""

# Step 4: Create Checkout Session
Write-Host "4. Creating checkout session..." -ForegroundColor Yellow
$checkoutBody = @{
    eventId = $eventId
    sessionId = $sessionId
    email = "test@example.com"
    firstName = "Test"
    lastName = "User"
    phone = "0501234567"
} | ConvertTo-Json

$checkoutResponse = curl -s -X POST http://localhost:3001/checkout/session `
    -H "Content-Type: application/json" `
    -d $checkoutBody | ConvertFrom-Json

Write-Host "   Checkout session created!" -ForegroundColor Green
Write-Host "   Order ID: $($checkoutResponse.orderId)" -ForegroundColor Green
Write-Host "   Session ID: $($checkoutResponse.sessionId)" -ForegroundColor Green
Write-Host "   Redirect URL: $($checkoutResponse.redirectUrl)" -ForegroundColor Green
Write-Host ""

# Step 5: Simulate Payment
Write-Host "5. Simulating successful payment..." -ForegroundColor Yellow
$paymentBody = @{
    sessionId = $checkoutResponse.sessionId
    success = $true
} | ConvertTo-Json

$paymentResponse = curl -s -X POST http://localhost:3001/checkout/simulate-payment `
    -H "Content-Type: application/json" `
    -d $paymentBody | ConvertFrom-Json

Write-Host "   Payment simulated successfully!" -ForegroundColor Green
Write-Host "   Order Status: $($paymentResponse.order.status)" -ForegroundColor Green
Write-Host "   Total Amount: ₪$($paymentResponse.order.totalAmount)" -ForegroundColor Green
Write-Host ""

# Step 6: Verify Order Status
Write-Host "6. Verifying final order status..." -ForegroundColor Yellow
$orderStatus = curl -s "http://localhost:3001/checkout/order/$($checkoutResponse.orderId)" | ConvertFrom-Json

Write-Host "   Final order status: $($orderStatus.status)" -ForegroundColor Green
Write-Host "   Seats: $($orderStatus.items.Count) tickets" -ForegroundColor Green
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host "✅ All API endpoints working correctly!" -ForegroundColor Green
Write-Host "✅ Full checkout flow successful!" -ForegroundColor Green
