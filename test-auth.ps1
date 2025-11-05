# Authentication Flow Test Script (PowerShell)
# This script tests the complete authentication flow

$API_URL = "http://localhost:3001"
$EMAIL = "test@example.com"
$ID_CARD = "123456789"

Write-Host "🔐 Testing Authentication Flow" -ForegroundColor Cyan
Write-Host "================================"
Write-Host ""

# Step 1: Send verification code
Write-Host "📧 Step 1: Sending verification code..." -ForegroundColor Yellow
$sendBody = @{
    email = $EMAIL
    idCard = $ID_CARD
} | ConvertTo-Json

try {
    $sendResponse = Invoke-RestMethod -Uri "$API_URL/auth/send-code" `
        -Method Post `
        -ContentType "application/json" `
        -Body $sendBody

    Write-Host "Response: $($sendResponse | ConvertTo-Json)" -ForegroundColor Gray

    if ($sendResponse.success) {
        Write-Host "✅ Code sent successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to send code" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  Check your API terminal for the verification code" -ForegroundColor Yellow
Write-Host "The code will look like: [DEV ONLY] Verification code for test@example.com: 123456"
Write-Host ""
$CODE = Read-Host "Enter the 6-digit verification code"

# Step 2: Verify code and get token
Write-Host ""
Write-Host "🔑 Step 2: Verifying code and getting token..." -ForegroundColor Yellow
$verifyBody = @{
    email = $EMAIL
    code = $CODE
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri "$API_URL/auth/verify-code" `
        -Method Post `
        -ContentType "application/json" `
        -Body $verifyBody

    Write-Host "Response: $($verifyResponse | ConvertTo-Json)" -ForegroundColor Gray

    if ($verifyResponse.token) {
        Write-Host "✅ Code verified successfully!" -ForegroundColor Green
        $TOKEN = $verifyResponse.token
        Write-Host "Token: $TOKEN" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to verify code" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Test protected route
Write-Host ""
Write-Host "👤 Step 3: Testing protected route (/auth/me)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
    }
    $profileResponse = Invoke-RestMethod -Uri "$API_URL/auth/me" `
        -Method Get `
        -Headers $headers

    Write-Host "Response: $($profileResponse | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host "✅ Protected route works! Authentication is fully functional!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to access protected route: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Test without token (should fail)
Write-Host ""
Write-Host "🚫 Step 4: Testing without token (should fail)..." -ForegroundColor Yellow
try {
    
    Write-Host "⚠️  Auth guard might not be working properly" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✅ Auth guard is working! Request without token was rejected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected error: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 Authentication test complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

