# Profile Section Quick Start Guide

## Getting Started in 5 Minutes

### 1. Access the Profile Page

**Development URL:**
- Hebrew: `http://localhost:3000/he/profile`
- English: `http://localhost:3000/en/profile`

**Requirements:**
- User must be signed in via Clerk
- Backend API running at `http://localhost:3001` (optional for testing with mock data)

---

### 2. Add Profile Link to Navigation

Add the profile button to any page:

```typescript
import ProfileLink from '@/components/ProfileLink';

// In your component JSX:
<ProfileLink />
```

The component automatically shows/hides based on user authentication status.

---

### 3. Test with Mock Data (No Backend Required)

To test the UI without backend, modify any tab component to use mock data:

**Example: SubscriptionsTab.tsx**
```typescript
// Replace the loadData function with:
const loadData = async () => {
  setLoading(true);

  // Mock subscriptions
  setSubscriptions([
    {
      id: '1',
      teamId: 'team-1',
      teamName: 'Maccabi Tel Aviv',
      teamNameHe: 'מכבי תל אביב',
      season: '2024/25',
      startDate: '2024-08-01',
      endDate: '2025-05-31',
      status: 'ACTIVE',
      homeGamesIncluded: 17,
      awayGamesIncluded: 17,
      seatSection: 'A',
      seatRow: '12',
      seatNumber: '15',
    },
  ]);

  // Mock loyalty data
  setLoyaltyData({
    totalPoints: 1250,
    awayGamePoints: 450,
    homeGamePoints: 800,
    tier: 'GOLD',
    history: [
      {
        id: '1',
        points: 50,
        type: 'AWAY_GAME',
        description: 'Away Game',
        descriptionHe: 'משחק חוץ',
        createdAt: '2025-11-01T10:00:00Z',
      },
    ],
  });

  setLoading(false);
};
```

---

### 4. Environment Variables

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
```

---

### 5. File Structure Overview

```
apps/web/src/
├── app/[locale]/
│   └── profile/
│       └── page.tsx              # Main profile page
│
├── components/
│   ├── profile/
│   │   ├── ProfileCard.tsx       # Reusable card wrapper
│   │   ├── StatsCard.tsx         # Stats display card
│   │   ├── EmptyState.tsx        # Empty state component
│   │   ├── SubscriptionsTab.tsx  # Tab 1
│   │   ├── PersonalDetailsTab.tsx# Tab 2
│   │   ├── OrderHistoryTab.tsx   # Tab 3
│   │   ├── ExpiredSubscriptionsTab.tsx # Tab 4
│   │   ├── TransfersTab.tsx      # Tab 5
│   │   └── PaymentMethodsTab.tsx # Tab 6
│   │
│   └── ProfileLink.tsx           # Navigation button
│
├── lib/
│   └── api-profile.ts            # Profile API client
│
└── messages/
    ├── profile-he.json           # Hebrew translations
    └── profile-en.json           # English translations
```

---

### 6. Common Customizations

#### Change Color Scheme

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#your-color',
        // ... other shades
        600: '#your-main-color',
      },
    },
  },
}
```

#### Add a New Tab

1. Create new tab component:
```typescript
// apps/web/src/components/profile/MyNewTab.tsx
'use client';

export default function MyNewTab({ locale }: { locale: string }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">My New Tab</h2>
      {/* Your content */}
    </div>
  );
}
```

2. Add to profile page:
```typescript
// In apps/web/src/app/[locale]/profile/page.tsx

// Import
import MyNewTab from '@/components/profile/MyNewTab';

// Add to tabs array
const tabs = [
  // ... existing tabs
  { key: 'myNewTab', label: 'My Tab' },
];

// Add to switch statement
case 'myNewTab':
  return <MyNewTab locale={locale} />;
```

3. Add translations:
```json
// messages/profile-he.json
{
  "Profile": {
    "tabs": {
      "myNewTab": "הכרטיסייה שלי"
    }
  }
}
```

#### Modify Grid Layouts

Change the number of columns:

```typescript
// 2 columns on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 4 columns on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

### 7. Backend Integration

When backend is ready, the API endpoints should return data in these formats:

**GET /profile**
```json
{
  "data": {
    "id": "user-123",
    "clerkId": "clerk-456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "052-1234567",
    "idNumber": "12345678",
    "birthDate": "1990-01-01",
    "address": "123 Main St",
    "gender": "MALE"
  }
}
```

**GET /profile/subscriptions**
```json
{
  "data": {
    "subscriptions": [
      {
        "id": "sub-1",
        "teamId": "team-1",
        "teamName": "Maccabi Tel Aviv",
        "teamNameHe": "מכבי תל אביב",
        "season": "2024/25",
        "startDate": "2024-08-01T00:00:00Z",
        "endDate": "2025-05-31T23:59:59Z",
        "status": "ACTIVE",
        "homeGamesIncluded": 17,
        "awayGamesIncluded": 17,
        "seatSection": "A",
        "seatRow": "12",
        "seatNumber": "15"
      }
    ]
  }
}
```

**GET /profile/loyalty**
```json
{
  "data": {
    "totalPoints": 1250,
    "awayGamePoints": 450,
    "homeGamePoints": 800,
    "tier": "GOLD",
    "history": [
      {
        "id": "hist-1",
        "points": 50,
        "type": "AWAY_GAME",
        "description": "Attended away game",
        "descriptionHe": "השתתפות במשחק חוץ",
        "eventDate": "2025-11-01T19:00:00Z",
        "createdAt": "2025-11-01T22:00:00Z"
      }
    ]
  }
}
```

See `PROFILE_IMPLEMENTATION_SUMMARY.md` for complete API documentation.

---

### 8. Troubleshooting

#### Profile page shows "Please sign in"
- Ensure user is authenticated via Clerk
- Check Clerk configuration in `.env.local`
- Verify Clerk provider is wrapping the app

#### API errors / No data showing
- Check API URL in environment variables
- Verify backend is running
- Check browser console for error messages
- Use mock data for testing (see section 3)

#### Translations not showing
- Check locale is correctly passed to components
- Verify translation files exist
- Clear Next.js cache: `rm -rf .next`

#### Styling issues
- Run `npm install` to ensure Tailwind is installed
- Check `tailwind.config.js` includes profile components
- Rebuild: `npm run dev`

#### TypeScript errors
- Run `npm run type-check` to identify issues
- Ensure all dependencies are installed
- Check import paths are correct

---

### 9. Performance Tips

#### Implement Caching

Use React Query or SWR:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['subscriptions'],
  queryFn: async () => {
    const token = await getToken();
    return profileEndpoints.getSeasonSubscriptions(API_URL, token);
  },
});
```

#### Add Loading Skeletons

Replace spinners with content placeholders:

```typescript
{loading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-24 bg-gray-200 rounded"></div>
    <div className="h-24 bg-gray-200 rounded"></div>
  </div>
) : (
  // Actual content
)}
```

#### Optimize Images

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/team-logo.png"
  alt="Team"
  width={48}
  height={48}
  loading="lazy"
/>
```

---

### 10. Deployment Checklist

Before deploying to production:

- [ ] Test all tabs with real data
- [ ] Verify authentication flow
- [ ] Test both Hebrew and English languages
- [ ] Check mobile responsiveness
- [ ] Validate form inputs
- [ ] Test error states
- [ ] Ensure API endpoints are secured
- [ ] Add analytics tracking
- [ ] Test with different user roles
- [ ] Verify loading states
- [ ] Check empty states display correctly
- [ ] Test confirmation dialogs
- [ ] Validate date formatting
- [ ] Check RTL layout for Hebrew
- [ ] Test keyboard navigation
- [ ] Run accessibility audit
- [ ] Check console for errors
- [ ] Test on different browsers
- [ ] Verify environment variables are set
- [ ] Test with slow network
- [ ] Check error messages are user-friendly

---

## Need Help?

- **Documentation:** See `PROFILE_IMPLEMENTATION_SUMMARY.md` for detailed implementation guide
- **UI Specs:** See `PROFILE_UI_LAYOUT.md` for design specifications
- **API Reference:** See `apps/web/src/lib/api-profile.ts` for endpoint documentation

---

## Quick Commands

```bash
# Start development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Format code
npm run format
```

---

**You're ready to go!** The profile section is fully functional and ready for customization and backend integration.
