#!/bin/bash

# Authentication Flow Test Script
# This script tests the complete authentication flow

API_URL="http://localhost:3001"
EMAIL="test@example.com"
ID_CARD="123456789"

echo "🔐 Testing Authentication Flow"
echo "================================"
echo ""

# Step 1: Send verification code
echo "📧 Step 1: Sending verification code..."
SEND_RESPONSE=$(curl -s -X POST "$API_URL/auth/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"idCard\":\"$ID_CARD\"}")

echo "Response: $SEND_RESPONSE"

if echo "$SEND_RESPONSE" | grep -q "success"; then
  echo "✅ Code sent successfully!"
else
  echo "❌ Failed to send code"
  exit 1
fi

echo ""
echo "⚠️  Check your API terminal for the verification code"
echo "The code will look like: [DEV ONLY] Verification code for test@example.com: 123456"
echo ""
read -p "Enter the 6-digit verification code: " CODE

# Step 2: Verify code and get token
echo ""
echo "🔑 Step 2: Verifying code and getting token..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/auth/verify-code" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}")

echo "Response: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "token"; then
  echo "✅ Code verified successfully!"
  TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "Token: $TOKEN"
else
  echo "❌ Failed to verify code"
  exit 1
fi

# Step 3: Test protected route
echo ""
echo "👤 Step 3: Testing protected route (/auth/me)..."
PROFILE_RESPONSE=$(curl -s "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $PROFILE_RESPONSE"

if echo "$PROFILE_RESPONSE" | grep -q "id"; then
  echo "✅ Protected route works! Authentication is fully functional!"
else
  echo "❌ Failed to access protected route"
  exit 1
fi

# Step 4: Test without token (should fail)
echo ""
echo "🚫 Step 4: Testing without token (should fail)..."
NO_TOKEN_RESPONSE=$(curl -s "$API_URL/auth/me")

if echo "$NO_TOKEN_RESPONSE" | grep -q "401"; then
  echo "✅ Auth guard is working! Request without token was rejected"
else
  echo "⚠️  Auth guard might not be working properly"
fi

echo ""
echo "================================"
echo "🎉 Authentication test complete!"
echo "================================"

