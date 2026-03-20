// ═══════════════════════════════════════════════════════
// Teddy Stadium (Teddy Kollek Stadium) — Jerusalem
// ~31,733 capacity
// TODO: Fill sections and seats from Vivenu seatmap data
// ViewBox: placeholder — update after fetching real SVG
// ═══════════════════════════════════════════════════════

export interface RealSection {
  idx: number;
  name: string;
  stand: 'north' | 'south' | 'east' | 'west';
  fill: string;
  stroke: string;
  d: string;
  seatCount: number;
  centroidX: number;
  centroidY: number;
}

export interface RealSeat {
  cx: number;
  cy: number;
  fill: string;
}

export interface RealStadiumData {
  viewBox: string;
  fieldCenter: { x: number; y: number };
  sections: RealSection[];
  seats: RealSeat[];
  totalSeats: number;
}

// Gate positions for labels
// Teddy Stadium has gates 1-14 around the perimeter
// TODO: Adjust x,y positions after real SVG data is available
export const GATE_POSITIONS = [
  { gate: 1, x: -4500, y: 3500, label: 'שער 1' },
  { gate: 2, x: -2500, y: 3500, label: 'שער 2' },
  { gate: 3, x: -500, y: 3500, label: 'שער 3' },
  { gate: 4, x: 1500, y: 3500, label: 'שער 4' },
  { gate: 5, x: 3500, y: 3500, label: 'שער 5' },
  { gate: 6, x: 5000, y: 1500, label: 'שער 6' },
  { gate: 7, x: 5000, y: -1500, label: 'שער 7' },
  { gate: 8, x: 3500, y: -3500, label: 'שער 8' },
  { gate: 9, x: 1500, y: -3500, label: 'שער 9' },
  { gate: 10, x: -500, y: -3500, label: 'שער 10' },
  { gate: 11, x: -2500, y: -3500, label: 'שער 11' },
  { gate: 12, x: -4500, y: -3500, label: 'שער 12' },
  { gate: 13, x: -5500, y: -1500, label: 'שער 13' },
  { gate: 14, x: -5500, y: 1500, label: 'שער 14' },
];

// ─── Section path data ───
// TODO: Replace with real SVG paths from Vivenu seatmap
// Each section needs: idx, name, stand, fill, stroke, d (SVG path), seatCount, centroidX, centroidY
const SECTION_PATHS: RealSection[] = [
  // ══════ PLACEHOLDER SECTIONS ══════
  // These will be replaced with real data from the Vivenu SVG
  // Follow STADIUM_GUIDE.md Step 1-3 to extract real data
];

// ─── All seat positions ───
// TODO: Replace with real seat circles from Vivenu SVG
// Each seat needs: cx, cy, fill
const ALL_SEATS: RealSeat[] = [
  // ══════ PLACEHOLDER ══════
  // These will be replaced with real <circle> elements from the SVG
];

export function buildRealTeddyData(): RealStadiumData {
  const totalSeats = ALL_SEATS.length || SECTION_PATHS.reduce((sum, s) => sum + s.seatCount, 0);
  return {
    // TODO: Update viewBox from real SVG
    viewBox: '-6000 -5000 12000 10000',
    fieldCenter: { x: 0, y: 0 },
    sections: SECTION_PATHS,
    seats: ALL_SEATS,
    totalSeats,
  };
}
