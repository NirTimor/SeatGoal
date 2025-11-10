# Authentication Setup Guide

## Issue: "Invalid or expired token"

This error occurs because authentication is now required for the checkout flow, but you're not currently signed in.

## Quick Fix Options:

### Option 1: Sign in with Clerk (Recommended)

1. Make sure `CLERK_SECRET_KEY` is set in `apps/api/.env`:
   ```bash
   CLERK_SECRET_KEY="sk_test_your_actual_clerk_secret_key"
   ```

2. Make sure Clerk publishable key is set in `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_actual_clerk_publishable_key"
   ```

3. Navigate to the event page and click the "Sign In" button in the header
4. Sign in or create an account with Clerk
5. Try selecting seats again

### Option 2: Temporarily Disable Auth for Testing (Quick Test)

If you just want to test the checkout flow without setting up Clerk:

1. Add `@Public()` decorator back to cart and checkout controllers
2. Make user parameter optional again
3. Add fallback userId value

**This is NOT recommended for production - only for quick testing!**

## Verifying Clerk Configuration

Check if Clerk is properly configured:

```bash
# In apps/api directory
cat .env | grep CLERK_SECRET_KEY

# In apps/web directory
cat .env.local | grep NEXT_PUBLIC_CLERK
```

## Testing Authentication

Once signed in, you can test the flow:

1. **Open browser console** (F12)
2. **Navigate** to http://localhost:3000/he/events/b49af636-6c1d-4af0-a01a-b483fc95a946
3. **Sign in** using the Clerk UI
4. **Select a seat** (should now work without errors)
5. **Check console** for any errors

## Current Authentication Flow

```
Frontend (EventDetails.tsx)
  ↓
Uses Clerk's useAuth() hook
  ↓
Gets token via getToken()
  ↓
Passes token to API client
  ↓
API client adds Authorization: Bearer <token>
  ↓
Backend AuthGuard validates token
  ↓
Clerk verifies token signature
  ↓
Request proceeds if valid
```

## If Clerk is Not Configured

If you don't have Clerk credentials yet:

1. Go to https://dashboard.clerk.com/
2. Create a new application
3. Copy the API keys:
   - `CLERK_SECRET_KEY` (for backend - starts with `sk_test_`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (for frontend - starts with `pk_test_`)
4. Add them to your .env files
5. Restart both servers

## Alternative: Use Existing Test User

If you have a valid Clerk token from a previous session, you can:

1. Open browser DevTools → Application → Local Storage
2. Check if there's a Clerk session
3. If not, sign in again through the UI
