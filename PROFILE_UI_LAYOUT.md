# User Profile UI Layout & Design Specifications

## Color Scheme

- **Primary:** Blue (#0284c7 - primary-600)
- **Success:** Green (#059669)
- **Warning:** Yellow (#d97706)
- **Error:** Red (#dc2626)
- **Gray Scale:** 50-900 for backgrounds, text, borders

## Page Layout

### Desktop View (≥ 1024px)
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ┌──────────────────────────────────────────┐              │
│  │  אזור אישי                                │              │
│  │  ברוך הבא, John Doe                       │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────────────────────────────────────┐│
│  │ Sidebar  │  │  Content Area                            ││
│  │          │  │                                          ││
│  │ מנויים   │  │  ┌────────────┬────────────┬──────────┐ ││
│  │ ונקודות  │  │  │ Total Pts  │  Home Pts  │ Away Pts │ ││
│  │          │  │  │   1,250    │    800     │   450    │ ││
│  │ פרטים    │  │  └────────────┴────────────┴──────────┘ ││
│  │ אישיים   │  │                                          ││
│  │          │  │  ┌────────────────────────────────────┐ ││
│  │ הזמנות   │  │  │  Points History                    │ ││
│  │          │  │  │  ┌──────────────────────────────┐  │ ││
│  │ מנויים   │  │  │  │ Away Game - +50 pts          │  │ ││
│  │ שפגו     │  │  │  │ Home Game - +25 pts          │  │ ││
│  │          │  │  │  └──────────────────────────────┘  │ ││
│  │ העברות   │  │  └────────────────────────────────────┘ ││
│  │          │  │                                          ││
│  │ תשלומים  │  │  ┌──────────────┬──────────────┐        ││
│  │          │  │  │ Subscription │ Subscription │        ││
│  │          │  │  │ Card 1       │ Card 2       │        ││
│  └──────────┘  │  └──────────────┴──────────────┘        ││
│                │                                          ││
│                └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Mobile View (< 1024px)
```
┌──────────────────────────────┐
│  Header                      │
│  אזור אישי                    │
│  ברוך הבא, John               │
└──────────────────────────────┘
┌──────────────────────────────┐
│  ▼ Select Tab                │
│  [ מנויים ונקודות        ]   │
└──────────────────────────────┘
┌──────────────────────────────┐
│  Content                     │
│  ┌────────────────────────┐  │
│  │ Total Points: 1,250    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Home Points: 800       │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Away Points: 450       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Tab 1: Subscriptions & Loyalty Points

### Stats Cards (Top Section)
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Total Points   │  Home Game Pts  │  Away Game Pts  │
│     1,250       │      800        │      450        │
│  Tier: Gold     │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### Points History
```
┌──────────────────────────────────────────────────┐
│  Points History                                  │
├──────────────────────────────────────────────────┤
│  Away Game - Hapoel vs Maccabi        +50 pts   │
│  01/11/2025                                      │
├──────────────────────────────────────────────────┤
│  Home Game - Beitar vs Bnei Sakhnin  +25 pts   │
│  25/10/2025                                      │
└──────────────────────────────────────────────────┘
```

### Subscription Cards
```
┌────────────────────────┐  ┌────────────────────────┐
│  Maccabi Tel Aviv      │  │  Hapoel Be'er Sheva   │
│  [Active]              │  │  [Active]              │
│                        │  │                        │
│  Season: 2024/25       │  │  Season: 2024/25       │
│  Home Games: 17        │  │  Home Games: 15        │
│  Away Games: 17        │  │  Away Games: 15        │
│  Seat: A-12-15         │  │  Seat: B-8-22          │
│                        │  │                        │
│  01/08/24 - 31/05/25   │  │  01/08/24 - 31/05/25   │
└────────────────────────┘  └────────────────────────┘
```

---

## Tab 2: Personal Details

### Form Layout (2-Column Grid)
```
┌──────────────────────────────────────────────────┐
│  My Personal Details                             │
├──────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ First Name *        │  │ Last Name *      │  │
│  │ [John            ]  │  │ [Doe          ]  │  │
│  └─────────────────────┘  └──────────────────┘  │
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ Email (read-only)   │  │ Phone            │  │
│  │ [john@example.com]  │  │ [052-1234567  ]  │  │
│  └─────────────────────┘  └──────────────────┘  │
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ ID Number           │  │ Birth Date       │  │
│  │ [****5678        ]  │  │ [1990-01-01   ]  │  │
│  └─────────────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────────────┐│
│  │ Address                                     ││
│  │ [123 Main St, Tel Aviv              ]      ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────┐                        │
│  │ Gender              │                        │
│  │ [Select...       ▼] │                        │
│  └─────────────────────┘                        │
│                                                  │
│                    [ Save Changes ]             │
└──────────────────────────────────────────────────┘
```

---

## Tab 3: Order History

### Filter Bar + Orders
```
┌──────────────────────────────────────────────────┐
│  My Orders                    [Filter: All    ▼] │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐ │
│  │  Order: 1a2b3c4d...          [Completed]   │ │
│  │  Maccabi Tel Aviv vs Hapoel Be'er Sheva    │ │
│  │  Bloomfield Stadium                        │ │
│  │  ─────────────────────────────────────────  │ │
│  │  Date: 01/11/2025  │  Amount: ILS 250.00   │ │
│  │  Event: 15/11/2025 │  Seats: 2             │ │
│  │  ─────────────────────────────────────────  │ │
│  │  Seats: A-12-15, A-12-16                   │ │
│  │  ─────────────────────────────────────────  │ │
│  │  View Details | Download Receipt           │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Order: 5e6f7g8h...          [Pending]     │ │
│  │  Beitar Jerusalem vs Bnei Sakhnin          │ │
│  │  Teddy Stadium                             │ │
│  │  ...                                       │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Tab 4: Expired Subscriptions

```
┌──────────────────────────────────────────────────┐
│  Expired Subscriptions                           │
├──────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐ │
│  │  Maccabi Haifa     │  │  Hapoel Tel Aviv  │ │
│  │  [Expired]         │  │  [Expired]         │ │
│  │                    │  │                    │ │
│  │  Season: 2023/24   │  │  Season: 2023/24   │ │
│  │  Home Games: 17    │  │  Home Games: 15    │ │
│  │  Away Games: 17    │  │  Away Games: 15    │ │
│  │                    │  │                    │ │
│  │  [Renew Subscription]│ │[Renew Subscription]│ │
│  └────────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Tab 5: Ticket Transfers

### Toggle Buttons + Transfer List
```
┌──────────────────────────────────────────────────┐
│  Ticket Transfers                                │
│  [ Received (3) ]  [ Sent (1) ]                  │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐ │
│  │  Maccabi vs Hapoel           [Pending]     │ │
│  │  Seat: A-12-15                             │ │
│  │  ─────────────────────────────────────────  │ │
│  │  From: sender@example.com                  │ │
│  │  Date: 01/11/2025                          │ │
│  │  ─────────────────────────────────────────  │ │
│  │  [ Accept ]              [ Reject ]        │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Beitar vs Bnei                [Accepted]  │ │
│  │  Seat: B-8-22                              │ │
│  │  ─────────────────────────────────────────  │ │
│  │  From: friend@example.com                  │ │
│  │  Date: 25/10/2025                          │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Tab 6: Payment Methods

```
┌──────────────────────────────────────────────────┐
│  My Payment Methods          [ Add New Method ]  │
├──────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐ │
│  │  ┌──────┐          │  │  ┌──────┐          │ │
│  │  │ VISA │  [Default]│ │  │ MC  │           │ │
│  │  └──────┘          │  │  └──────┘          │ │
│  │  •••• 1234        │  │  •••• 5678        │ │
│  │  Expires: 12/25   │  │  Expires: 03/26   │ │
│  │                    │  │                    │ │
│  │  [ Set Default ]   │  │  [ Set Default ]   │ │
│  │  [ Remove ]        │  │  [ Remove ]        │ │
│  └────────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Empty States

### Generic Empty State Template
```
┌──────────────────────────────────────┐
│                                      │
│           ┌────────┐                 │
│           │  ICON  │                 │
│           └────────┘                 │
│                                      │
│          No Items Found              │
│                                      │
│     You don't have any items yet     │
│                                      │
│        [ Call to Action ]            │
│                                      │
└──────────────────────────────────────┘
```

---

## Status Badges

### Badge Styles

**Active/Completed (Green):**
```
[Active] - bg-green-100 text-green-800
```

**Pending (Yellow):**
```
[Pending] - bg-yellow-100 text-yellow-800
```

**Expired/Cancelled (Red):**
```
[Expired] - bg-red-100 text-red-800
```

**Default (Blue):**
```
[Default] - bg-primary-100 text-primary-800
```

**Neutral (Gray):**
```
[Info] - bg-gray-100 text-gray-800
```

---

## Responsive Breakpoints

- **Mobile:** < 640px (1 column)
- **Tablet:** 640px - 1023px (2 columns)
- **Desktop:** ≥ 1024px (3 columns + sidebar)

---

## Typography

- **Page Title:** text-3xl font-bold (36px)
- **Section Headers:** text-xl font-bold (20px)
- **Card Titles:** text-lg font-bold (18px)
- **Body Text:** text-base (16px)
- **Small Text:** text-sm (14px)
- **Tiny Text:** text-xs (12px)

---

## Spacing

- **Card Padding:** p-6 (24px)
- **Section Gap:** space-y-6 (24px)
- **Grid Gap:** gap-4 (16px)
- **Button Padding:** px-4 py-2 (16px 8px)

---

## Animations

- **Hover Effects:** hover:shadow-lg transition-shadow
- **Button Transitions:** transition-colors duration-200
- **Loading Spinner:** animate-spin

---

## Accessibility Features

- Semantic HTML elements
- Proper heading hierarchy
- Form labels with associated inputs
- Keyboard navigation support
- Focus states on interactive elements
- ARIA labels (to be enhanced)

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Considerations

- Lazy loading for images
- Code splitting by tab
- Debounced form inputs
- Optimized re-renders with React.memo (can be added)
- Server-side rendering disabled for auth-dependent content
