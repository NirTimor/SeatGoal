# Bloomfield Stadium Interactive Seat Map Integration

## Overview

Created a complete interactive seat map for Bloomfield Stadium with **29,400 seats** across 4 stands (North, South, East, West). Users can select seats, view pricing, and prepare for ordering.

## 📊 Stadium Data

**Bloomfield Stadium, Tel Aviv, Israel**
- **Total Capacity**: 29,400 seats
- **Layout**:
  - North Stand: Single tier (~350 seats per section)
  - South Stand: Single tier (~350 seats per section)
  - West Stand: VIP/Premium seating
  - East Stand: Two-tier (Lower: Premium/Standard, Upper: Economy)

### Seating Breakdown

| Price Zone | Seats | Price |
|-----------|-------|-------|
| VIP | ~672 | ₪400 |
| PREMIUM | ~7,500+ | ₪200 |
| STANDARD | ~14,000+ | ₪100 |
| ECONOMY | ~7,000+ | ₪50 |
| Accessible | ~1,470 (5%) | Varies |

## 🗂️ Files Created

### 1. **Seat Data Generator** (`/apps/web/src/data/bloomfield-stadium-seats.ts`)
   - Generates all 29,400 seats with exact properties
   - Section configurations with rows and pricing
   - SVG coordinate calculation for visual mapping
   - Statistics function for dashboard info

   **Export Functions:**
   - `generateBloomfieldStadiumSeats()` — returns all Seat objects
   - `getBloomfieldStadiumStats()` — returns capacity breakdown

### 2. **Interactive Map Component** (`/apps/web/src/components/BloomfieldStadiumMap.tsx`)
   - Full-featured seat selection UI
   - Real-time price calculation
   - Accessibility filtering
   - Price zone color coding
   - Multi-language support (English/Hebrew)
   - Callbacks for seat selection

   **Features:**
   - ✅ Visual seat map with SVG rendering
   - ✅ Click to select/deselect seats
   - ✅ Filter by accessibility
   - ✅ Filter by price zone
   - ✅ Live total price calculation
   - ✅ Selected seats list with quick removal
   - ✅ Stadium statistics dashboard

### 3. **Demo Page** (`/apps/web/src/app/[locale]/bloomfield/page.tsx`)
   - Direct access at `/en/bloomfield`
   - Full integration with app layout
   - Ready for seat ordering flow

## 🚀 Usage

### Basic Integration

```tsx
import BloomfieldStadiumMap from '@/components/BloomfieldStadiumMap';

function MyComponent() {
  const handleSeatsSelected = (seats: Seat[]) => {
    console.log('Selected seats:', seats);
    // Save to order, send to checkout, etc.
  };

  return (
    <BloomfieldStadiumMap
      locale="en"
      onSeatsSelected={handleSeatsSelected}
    />
  );
}
```

### Data Access Only

```tsx
import { generateBloomfieldStadiumSeats, getBloomfieldStadiumStats } from '@/data/bloomfield-stadium-seats';

// Get all seats
const allSeats = generateBloomfieldStadiumSeats();

// Get statistics
const stats = getBloomfieldStadiumStats();
console.log(`Total: ${stats.totalSeats}, VIP: ${stats.byZone.VIP}`);

// Filter by price zone
const premiumSeats = allSeats.filter(s => s.priceZone === 'PREMIUM');
```

## 📋 Seat Object Structure

```typescript
interface Seat {
  id: string;              // Unique identifier
  seatId: string;          // Human-readable (SEC 301-1-1)
  section: string;         // Section name (SEC 301)
  row: string;             // Row number
  number: string;          // Seat number
  x?: number;              // SVG X coordinate
  y?: number;              // SVG Y coordinate
  price: string;           // Price in ₪
  status: 'AVAILABLE' | 'HELD' | 'SOLD' | 'UNAVAILABLE';
  priceZone: 'VIP' | 'PREMIUM' | 'STANDARD' | 'ECONOMY';
  isAccessible: boolean;   // Wheelchair accessible
  amenities?: Record<string, any>; // Accessibility amenities
  viewRating?: number;     // View quality rating (7-9)
}
```

## 🎯 Next Steps

### To Connect with Backend

1. **API Integration** — Update `BloomfieldStadiumMap.tsx` to fetch real seat data:
```tsx
const allSeats = await fetchSeatsForStadium('bloomfield');
```

2. **Real-Time Status** — Update seat `status` from database (AVAILABLE, SOLD, HELD)

3. **Checkout Integration** — Wire `onSeatsSelected` to shopping cart:
```tsx
onSeatsSelected={(seats) => {
  addToCart(seats);
  navigateTo('/checkout');
}}
```

4. **Database Schema** — Ensure seats table has columns:
   - seatId (unique)
   - section, row, number
   - priceZone, price
   - status
   - isAccessible

### Current Limitations

- ⚠️ All seats show as AVAILABLE (hardcoded for demo)
- ⚠️ No real-time synchronization with database
- ⚠️ SVG coordinates use fixed layout (not responsive to stadium changes)

### Production Checklist

- [ ] Connect to real seat database
- [ ] Implement real-time availability updates (WebSocket/polling)
- [ ] Add checkout flow integration
- [ ] Load pricing from backend
- [ ] Implement hold/reserve functionality
- [ ] Add payment processing
- [ ] Email confirmation after booking
- [ ] Admin dashboard for seat management

## 📊 Statistics Example

```javascript
{
  totalSeats: 29400,
  byZone: {
    VIP: 672,
    PREMIUM: 7532,
    STANDARD: 14196,
    ECONOMY: 7000
  },
  accessible: 1470,
  byStand: {
    NORTH: ~4100,
    SOUTH: ~4100,
    WEST: ~1680,
    EAST: ~19520
  }
}
```

## 🌍 Localization

Component supports English and Hebrew:
```tsx
<BloomfieldStadiumMap locale="en" />  // English
<BloomfieldStadiumMap locale="he" />  // Hebrew
```

## 🎨 Customization

### Change Price Zones
Edit `PRICE_MAP` in `bloomfield-stadium-seats.ts`:
```typescript
const PRICE_MAP: Record<string, string> = {
  'VIP': '500',      // Changed from 400
  'PREMIUM': '250',  // Changed from 200
  // ...
};
```

### Change Colors
Edit `getPriceZoneColor()` in `StadiumSeatMap.tsx`:
```typescript
case 'VIP': return '#ff6b6b'; // Red instead of purple
```

### Add Section Images
Add to `seatViewImages` in `BloomfieldStadiumMap.tsx`:
```typescript
const seatViewImages: Record<string, string> = {
  'SEC 301': 'https://...',
  'SEC 302': 'https://...',
  // ...
};
```

## 📞 Support

For seat booking issues or modifications to stadium layout:
1. Edit `SECTION_CONFIGS` in `bloomfield-stadium-seats.ts`
2. Adjust `STAND_POSITIONS` for visual alignment
3. Update `PRICE_MAP` for pricing changes
4. Test with `generateBloomfieldStadiumSeats()` before deployment

---

**Created**: 2026-03-14
**Component**: React + TypeScript
**Total Seats Generated**: 29,400
**Accessibility Seats**: ~1,470 (5%)
