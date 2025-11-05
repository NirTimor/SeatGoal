# 🚀 Authentication Testing & Production Guide

## ✅ How Authentication Works Now

### Current Flow:
1. **User Login** → User enters email/phone + ID card
2. **Verification Code** → Backend generates 6-digit code (currently logs to console)
3. **Code Verification** → User enters code, backend validates
4. **JWT Token** → Backend returns JWT token with user info
5. **Token Storage** → Frontend stores token in `localStorage`
6. **Authenticated Requests** → Token is automatically sent with all API calls via `Authorization: Bearer <token>` header
7. **Auth Guard** → Backend validates token on protected routes

### Key Components:
- **Backend Auth Guard**: `apps/api/src/auth/auth.guard.ts` - validates JWT tokens
- **API Client**: `apps/web/src/lib/api.ts` - automatically includes token in requests
- **Auth Page**: `apps/web/src/app/[locale]/auth/page.tsx` - login/register UI
- **Profile Page**: `apps/web/src/app/[locale]/profile/page.tsx` - tests authenticated route

---

## 🧪 How to Test (Step-by-Step)

### Step 1: Make Sure Database is Ready

```bash
cd apps/api
pnpm prisma migrate dev
```

### Step 2: Start Both Servers

**Terminal 1 - API Server:**
```bash
cd apps/api
pnpm dev
```

**Terminal 2 - Web Server:**
```bash
cd apps/web
pnpm dev
```

### Step 3: Test Authentication Flow

1. **Open Browser** → `http://localhost:3000`

2. **Navigate to Auth Page** → `http://localhost:3000/en/auth`

3. **Enter Credentials:**
   - ID Card: `123456789`
   - Email: `test@example.com` (or Phone: `0501234567`)

4. **Click "Continue"**

5. **Check API Terminal** - You'll see:
   ```
   [DEV ONLY] Verification code for test@example.com: 123456
   ```

6. **Enter the 6-digit code** in the verification screen

7. **Click "Verify"**

8. **Success!** You should be redirected to home page and logged in

### Step 4: Test Protected Route (Profile Page)

1. **Navigate to Profile** → `http://localhost:3000/en/profile`

2. **Check Network Tab (F12):**
   - Look for request to `/auth/me`
   - Verify it has `Authorization: Bearer <token>` header
   - Should return 200 with your user data

3. **Check Console:**
   - Should see your user data logged
   - No errors

4. **Test Token Expiration:**
   - Open localStorage in DevTools
   - Delete or modify `auth_token`
   - Refresh profile page
   - Should redirect to auth page

---

## 🔍 What to Look For

### ✅ Success Indicators:

**In API Terminal:**
- ✅ `[DEV ONLY] Verification code for...` appears
- ✅ No errors when verifying code
- ✅ `/auth/me` request logs show successful auth

**In Browser:**
- ✅ No console errors
- ✅ Token stored in localStorage: `localStorage.getItem('auth_token')`
- ✅ Profile page loads with user data
- ✅ Auth redirects work correctly

**In Network Tab:**
- ✅ `/auth/send-code` → 200 OK
- ✅ `/auth/verify-code` → 200 OK with token
- ✅ `/auth/me` → 200 OK with user data
- ✅ All requests have `Authorization` header (except public routes)

### ❌ Common Issues:

**"No authorization token provided"**
- API client not sending token → Check localStorage has token
- Token not being included → Check `apps/web/src/lib/api.ts` lines 62-69

**"Invalid or expired token"**
- Token format wrong → Should start with `eyJ`
- JWT secret mismatch → Check `apps/api/.env` has `JWT_SECRET`
- Token expired → Request new token by logging in again

**Profile page redirects immediately**
- Token missing or invalid
- Backend not running
- CORS issues

---

## 🚀 Production Checklist

### 1. Environment Variables

**API Server (`apps/api/.env`):**
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/seatgoal_prod"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"  # Generate strong secret!
JWT_EXPIRES_IN="7d"  # Or whatever you prefer

# Email Service (choose one)
EMAIL_SERVICE="sendgrid"  # or "ses", "mailgun", "smtp"
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# SMS Service (choose one)
SMS_SERVICE="twilio"  # or "aws-sns", "nexmo"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Redis (for verification codes)
REDIS_URL="redis://user:password@host:6379"

# App
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://yourdomain.com"
```

**Web App (`apps/web/.env.production`):**
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

### 2. Replace Mock Email/SMS Service

Currently, verification codes are just logged to console. You need to integrate a real service:

**Option A: Email Service (SendGrid/AWS SES/Mailgun)**

Install dependency:
```bash
cd apps/api
pnpm add @sendgrid/mail
```

Update `apps/api/src/auth/auth.service.ts`:
```typescript
import sgMail from '@sendgrid/mail';

// In sendVerificationCode method, replace console.log with:
await sgMail.send({
  to: email,
  from: process.env.EMAIL_FROM,
  subject: 'Your Verification Code',
  text: `Your verification code is: ${code}`,
  html: `<p>Your verification code is: <strong>${code}</strong></p>`,
});
```

**Option B: SMS Service (Twilio/AWS SNS)**

Install dependency:
```bash
cd apps/api
pnpm add twilio
```

Update `apps/api/src/auth/auth.service.ts`:
```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In sendVerificationCode method:
await client.messages.create({
  body: `Your verification code is: ${code}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phone,
});
```

### 3. Security Hardening

**Add Rate Limiting:**
```bash
cd apps/api
pnpm add @nestjs/throttler
```

Update `apps/api/src/app.module.ts`:
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
    // ... other modules
  ],
})
```

**Update Auth Controller:**
```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle(5, 60) // 5 requests per minute for auth endpoints
@Post('send-code')
async sendCode(@Body() dto: SendCodeDto) {
  // ...
}
```

### 4. Token Configuration

**Adjust Token Expiration:**
- Short-lived tokens (1-7 days) are more secure
- Use refresh tokens for longer sessions
- Consider token blacklist for logout

**Add Token Refresh Endpoint** (Optional):
```typescript
@Post('refresh')
async refreshToken(@Body() { refreshToken }: { refreshToken: string }) {
  // Validate refresh token and issue new access token
}
```

### 5. CORS Configuration

Update `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

### 6. Database

- ✅ Run migrations in production
- ✅ Set up database backups
- ✅ Use connection pooling
- ✅ Monitor database performance

### 7. Monitoring & Logging

**Add Logging Service:**
```bash
pnpm add winston
```

**Monitor:**
- Failed login attempts
- Token validation errors
- API response times
- User activity

### 8. SSL/HTTPS

- ✅ Use HTTPS in production
- ✅ Set secure cookie flags
- ✅ Use HSTS headers

---

## 📊 Testing Checklist Before Production

- [ ] User can register with email
- [ ] User can register with phone
- [ ] User receives verification code (real email/SMS)
- [ ] User can verify code successfully
- [ ] Token is stored and persists across page refresh
- [ ] Profile page loads with correct user data
- [ ] Token expiration works correctly
- [ ] Invalid tokens are rejected
- [ ] User can log out and log back in
- [ ] Rate limiting works (test rapid requests)
- [ ] CORS is properly configured
- [ ] All environment variables are set
- [ ] Database connection is secure
- [ ] Logs don't expose sensitive data
- [ ] Error messages are user-friendly

---

## 🎯 Quick Test Commands

**Test Token Validation:**
```bash
# Get token after login from localStorage
TOKEN="your-token-here"

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/auth/me
```

**Test Without Token (should fail):**
```bash
curl http://localhost:3001/auth/me
# Should return: {"statusCode":401,"message":"No authorization token provided"}
```

**Test With Invalid Token (should fail):**
```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:3001/auth/me
# Should return: {"statusCode":401,"message":"Invalid or expired token"}
```

---

## 🎉 You're Ready When:

1. ✅ Authentication flow works end-to-end
2. ✅ Real email/SMS service is integrated
3. ✅ Rate limiting is in place
4. ✅ Environment variables are configured
5. ✅ HTTPS is enabled
6. ✅ Monitoring and logging are set up
7. ✅ All security checks pass
8. ✅ Load testing shows good performance

---

## 📚 Next Steps

1. **Add Password Recovery** - Send reset codes
2. **Add 2FA** - Extra security layer
3. **Add Social Login** - Google, Facebook, etc.
4. **Add Session Management** - Active sessions, revoke tokens
5. **Add Account Deletion** - GDPR compliance
6. **Add Email Verification** - Confirm email ownership

---

## 🆘 Need Help?

- Check `TESTING_CUSTOM_AUTH.md` for detailed testing guide
- Review API logs in terminal for errors
- Use browser DevTools Network tab to debug requests
- Check Redis for stored verification codes: `redis-cli GET "verification:email:test@example.com"`

