# How to Add a New Stadium Seatmap

## Prerequisites

- Node.js installed
- Access to the project repo (`https://github.com/NirTimor/SeatGoal`)
- The leaan.co.il event URL for the stadium

---

## Step 1: Get the Seatmap Data from Vivenu

### 1a. Find the `seating_event_id` from the leaan event page

```bash
curl -s 'https://www.leaan.co.il/events/YOUR_EVENT_URL' | grep -oE '"seating_event_id":"[^"]*"'
```

This gives you something like: `"seating_event_id":"68340ea45c858ccd0eb5d189"`

### 1b. Fetch the full seatmap JSON from the vivenu public API

```bash
curl -s "https://seatmap.vivenu.com/api/public/event/SEATING_EVENT_ID/map" -o stadium_map.json
```

### 1c. Find the seatmap ID inside the JSON

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('stadium_map.json','utf8')); console.log('seatMapId:', d.seatMapId)"
```

### 1d. Download the SVG using the seatmap ID

```bash
curl -s "https://seatmap.vivenu.com/api/seatmap/SEATMAP_ID/svg?theme=light" -o stadium.svg
```

---

## Step 2: Analyze the Data

### 2a. Check SVG stats

```js
// parse_svg.js
const fs = require('fs');
const svg = fs.readFileSync('stadium.svg', 'utf8');

const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
const paths = svg.match(/<path[^>]+>/g) || [];
const circles = svg.match(/<circle[^>]+>/g) || [];

console.log('ViewBox:', viewBox);
console.log('Section paths:', paths.length);
console.log('Seats (circles):', circles.length);
```

### 2b. Check JSON structure for section names, gates, categories

```js
// parse_json.js
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('stadium_map.json', 'utf8'));
const sm = data.seatMap;

console.log('Categories:');
sm.categories.forEach(c => console.log(`  ${c.name} | ${c.color} | ${c._id}`));

console.log('\nSections:');
sm.layers[0].sections.forEach(s => {
  let seats = 0;
  (s.groups || []).forEach(g =>
    (g.rows || []).forEach(r => seats += (r.seats || []).length)
  );
  console.log(`  ${s.name} | gate: ${s.gate} | cat: ${s.categoryId} | seats: ${seats}`);
});
```

---

## Step 3: Create the Stadium Data File

Create `apps/web/src/stadiums/STADIUM_NAME/data/stadiumData.ts`

Follow the exact pattern from existing stadiums. The file needs:

### Interfaces

Copy from `stadiums/bloomfield/data/stadiumData.ts` (same `RealSection`, `RealSeat`, `RealStadiumData`).

### GATE_POSITIONS

Array of `{ gate, x, y, label }` with Hebrew labels (`שער X`). Position each gate near its associated sections.

### SECTION_PATHS

For each `<path>` in the SVG, extract:

| Field | Source |
|-------|--------|
| `d` | SVG path `d` attribute |
| `fill` | SVG `fill` attribute |
| `stroke` | SVG `stroke` attribute |
| `name` | JSON section name (match by position) |
| `stand` | `'east'\|'west'\|'north'\|'south'` based on position relative to field |
| `seatCount` | JSON: groups -> rows -> seats count |
| `centroidX/Y` | Average of the path's coordinate points |

**Matching SVG paths to JSON sections:** The path bounds (min/max of x,y coordinates in the `d` attribute) align with each section's `x,y` position in the JSON. Path 0's top-left corner = first section's `(x, y)`.

### ALL_SEATS

Extract all `<circle>` elements from SVG as `{ cx, cy, fill }`.

### Export function

`buildRealXxxData()` returning `{ viewBox, fieldCenter, sections, seats, totalSeats }`.

---

## Step 4: Create the Map Component

Create `apps/web/src/stadiums/STADIUM_NAME/components/XxxMap.tsx`

Copy from an existing map component (e.g., `stadiums/hamoshava/components/HaMoshavaMap.tsx`) and adjust:

- Import from `'../data/stadiumData'`
- Rename the function (`export default function XxxMap()`)
- Update the `buildRealXxxData()` call
- Adjust the **football field** coordinates to center on `data.fieldCenter`
- Adjust `strokeWidth` and `fontSize` values based on the SVG coordinate scale (larger viewBox = larger values)
- Adjust seat radius (`r`) and gate label sizes proportionally
- The seat filter radius in `selectedSectionSeats` may need tuning (use ~1/4 of the viewBox width)

---

## Step 5: Create the Page Route

Create `apps/web/src/app/[locale]/STADIUM_NAME/page.tsx`:

```tsx
import XxxMap from '@/stadiums/STADIUM_NAME/components/XxxMap';

export const metadata = {
  title: 'Xxx Stadium - Interactive Seat Map',
  description: 'Interactive seat map for Xxx Stadium with X,XXX seats across XX sections',
};

export default function XxxPage() {
  return <XxxMap />;
}
```

---

## Step 6: Verify

```bash
cd apps/web
npx tsc --noEmit          # type-check
npm run dev               # start dev server
# visit http://localhost:3000/en/STADIUM_NAME
```

---

## File Structure

```
apps/web/src/stadiums/STADIUM_NAME/
├── components/
│   └── XxxMap.tsx
└── data/
    └── stadiumData.ts

apps/web/src/app/[locale]/STADIUM_NAME/
└── page.tsx
```

---

## Tips

- The vivenu SVG endpoint `api/seatmap/{ID}/svg?theme=light` is **public** (no auth needed)
- The JSON endpoint `api/public/event/{SEATING_EVENT_ID}/map` is also **public**
- If the SVG endpoint returns 500, you have the wrong ID. Use the `seatMapId` from the JSON, **not** the `seating_event_id`
- Section colors come from the SVG `fill` attribute, not the JSON category colors
- All seat coordinates in the SVG are already in global space (no transform needed)

---

## Existing Stadiums for Reference

| Stadium | Sections | Seats | Route |
|---------|----------|-------|-------|
| Bloomfield | 93 | 29,942 | `/en/bloomfield` |
| HaMoshava | 25 | 10,961 | `/en/hamoshava` |
