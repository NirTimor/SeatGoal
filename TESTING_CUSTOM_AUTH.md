# Testing Custom Authentication - Step by Step

## ✅ Everything is Implemented

All the code is in place:
- ✅ Backend auth service and controller
- ✅ Frontend AuthModal component  
- ✅ Database schema updates
- ✅ AuthModule integrated in AppModule
- ✅ JWT authentication configured
- ✅ API client updated to include auth tokens

## 🚀 How to Test

### Step 1: Run Database Migration

First, you need to create the new database tables:

```bash
cd apps/api
pnpm prisma migrate dev --name add_user_and_verification_code
```

**Note:** If you get a database connection error, update your `apps/api/.env` file with correct credentials.

### Step 2: Start the API Server

In the first terminal:
```bash
cd apps/api
pnpm dev
```

You should see:
```
✅ Database connected
✅ Redis connected
🚀 API server running on http://localhost:3001
```

**IMPORTANT:** Keep this terminal open to see verification codes in the console!

### Step 3: Start the Web Server

In a second terminal:
```bash
cd apps/web
pnpm dev
```

You should see:
```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

### Step 4: Test the Authentication Flow

1. **Open your browser** and go to: `http://localhost:3000`

2. **Click "Sign In"** button (top right)

3. **Choose authentication method:**
   - Select **"Email"** or **"Mobile Phone"** tab
   
4. **Enter credentials:**
   - **ID Card:** Enter any 9-digit number (e.g., `123456789`)
   - **Email or Phone:**
     - Email: `test@example.com`
     - OR Phone: `0501234567`

5. **Click "Continue"**

6. **Check the API terminal** - You'll see:
   ```
   [DEV ONLY] Verification code for test@example.com: 123456
   ```
   Note the 6-digit code!

7. **Enter the verification code** in the modal

8. **Click "Verify"**

9. **Success!** You should now see:
   - "Sign In" button replaced with your email and "Sign Out" button
   - You're now authenticated!

### Step 5: Test Authentication Persistence

1. **Refresh the page** - You should still be signed in
2. **Close the browser and reopen** - You should still be signed in (token in localStorage)
3. **Click "Sign Out"** - You should be logged out

## 🧪 Testing Different Scenarios

### Test Email Login:
```
Email: test@example.com
ID Card: 123456789
```

### Test Phone Login:
```
Phone: 0501234567
ID Card: 123456789
```

### Test Code Expiration:
1. Request a code
2. Wait 10 minutes
3. Try to verify - should show "Invalid or expired verification code"

### Test Invalid Code:
1. Request a code
2. Enter wrong code (e.g., 999999)
3. Should show error

## 🔍 What to Check

### In API Terminal:
- ✅ Verification codes are logged to console
- ✅ No errors when sending/verifying codes
- ✅ Database queries are successful

### In Browser Console (F12):
- ✅ No JavaScript errors
- ✅ Auth token is stored in `localStorage.getItem('auth_token')`

### Database:
You can check the database to see created users:
```sql
SELECT * FROM users;
SELECT * FROM verification_codes;
```

## 🐛 Troubleshooting

### "Network error: Unable to connect to API server"
- Make sure API is running on port 3001
- Check `apps/web/.env.local` has correct `NEXT_PUBLIC_API_URL`

### "Invalid or expired verification code"
- Check you entered the correct 6-digit code
- Make sure code hasn't expired (10 minutes)
- Look for the code in API terminal output

### "Database connection error"
- Update `apps/api/.env` with correct `DATABASE_URL`
- Make sure PostgreSQL is running

### "CORS error"
- Check API has CORS enabled
- Verify API URL is correct

## 🎯 Expected Behavior

1. **Sign In Modal Opens** - Should show email/phone tabs
2. **Code Sent** - Modal shows verification step with message
3. **Code Verification** - Enters code, clicks verify
4. **Authentication Success** - Modal closes, user is signed in
5. **Token Persists** - After refresh, still signed in
6. **Sign Out Works** - Clicks sign out, returns to signed out state

## 📝 Quick Test Checklist

- [ ] Migration ran successfully
- [ ] API server starts without errors
- [ ] Web server starts without errors
- [ ] Can open http://localhost:3000
- [ ] Can click "Sign In" button
- [ ] Can see email/phone tabs
- [ ] Can enter credentials and get verification code
- [ ] Can see code in API terminal console
- [ ] Can enter code and verify successfully
- [ ] Signed in user appears after verification
- [ ] Can sign out successfully
- [ ] Can sign in again with same credentials

## 🎉 Success Criteria

When all the above works, your custom authentication is fully functional! 

**Next Steps:**
- For production, integrate real SMS/Email service
- Add proper error handling
- Add rate limiting
- Add session management

