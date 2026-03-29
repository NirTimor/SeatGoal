'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
} from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { buildRealBloomfieldData, GATE_POSITIONS } from '../data/stadiumData';
import type { RealSection, RealSeat } from '../data/stadiumData';
import {
  bloomfieldDisplayBlock,
  bloomfieldGateBadgeLabel,
  bloomfieldNearestGate,
  bloomfieldOfficialZone,
  bloomfieldStandLabelForSection,
} from '../data/bloomfieldZones';

const ZOOM_ANIM_MS = 420;
/** Padding around the whole stadium in overview (fraction of union size) — lower = tighter fit on screen */
const OVERVIEW_PAD_FR = 0.038;
/**
 * Extra horizontal widening after aspect fit (fraction of current width). Narrow viewports need more
 * world-units left/right so east/west stands stay in frame — otherwise the pitch dominates the strip.
 */
const OVERVIEW_PAD_X_EXTRA_FR = 0.1;
/** Max width of the map column on large screens (stadium feels less “stretched” on wide viewports). */
const PAGE_MAX_W = 'min(100%, 32rem)';
/** Padding around a focused section */
const FOCUS_PAD_FR = 0.14;
/** After focus, section bbox fills ~this fraction of the map viewport (0.75 = uses ~75% of width/height). */
const FOCUS_SCREEN_FR = 0.75;
const FIELD_RECT = { x: 5800, y: 4800, w: 4800, h: 5200 };

const MACCABI_STADIUM_INFO =
  'https://www.maccabi-tlv.co.il/%D7%94%D7%9E%D7%95%D7%A2%D7%93%D7%95%D7%9F/%D7%94%D7%90%D7%99%D7%A6%D7%98%D7%93%D7%99%D7%95%D7%9F/';

/** Muted display colors — same “families” as source data */
const FRIENDLY_FILL: Record<string, string> = {
  '#fda1ff': '#d8bae8',
  '#0062b1': '#5a94c7',
  '#68ccca': '#8cc9c8',
  '#16a5a5': '#6bb0b0',
  '#7b64ff': '#a89ee0',
  '#fcdc00': '#efe29a',
  '#653294': '#9b7ab8',
  '#ab149e': '#c97fb8',
  '#fa28ff': '#df9ae0',
  '#666666': '#8b9099',
  '#000c38': '#4a5d78',
  '#fcc400': '#e8cf8a',
  '#c45100': '#c97d62',
  '#fe9200': '#e8a878',
};

type Rect = { x: number; y: number; w: number; h: number };

function friendlyFill(hex: string): string {
  return FRIENDLY_FILL[hex.toLowerCase()] ?? hex;
}

function parseViewBox(s: string): Rect {
  const p = s.trim().split(/[\s,]+/).map(Number);
  return { x: p[0], y: p[1], w: p[2], h: p[3] };
}

function rectToVB(r: Rect): string {
  return `${r.x} ${r.y} ${r.w} ${r.h}`;
}

function unionRect(a: Rect, b: Rect): Rect {
  const x2 = Math.max(a.x + a.w, b.x + b.w);
  const y2 = Math.max(a.y + a.h, b.y + b.h);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: x2 - Math.min(a.x, b.x),
    h: y2 - Math.min(a.y, b.y),
  };
}

function expandRect(r: Rect, padFraction: number): Rect {
  const px = r.w * padFraction;
  const py = r.h * padFraction;
  return { x: r.x - px, y: r.y - py, w: r.w + 2 * px, h: r.h + 2 * py };
}

/** Widen rect symmetrically on X only (fraction of width on each side). */
function expandRectWidthX(r: Rect, padFractionEachSide: number): Rect {
  const px = r.w * padFractionEachSide;
  return { x: r.x - px, y: r.y, w: r.w + 2 * px, h: r.h };
}

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Fit rect to container aspect (letterbox inside, expand minimum dimension) */
function matchAspect(r: Rect, aspect: number): Rect {
  if (r.w <= 0 || r.h <= 0) return r;
  const cur = r.w / r.h;
  if (Math.abs(cur - aspect) < 1e-6) return r;
  if (cur > aspect) {
    const nh = r.w / aspect;
    return { x: r.x, y: r.y - (nh - r.h) / 2, w: r.w, h: nh };
  }
  const nw = r.h * aspect;
  return { x: r.x - (nw - r.w) / 2, y: r.y, w: nw, h: r.h };
}

function clampRectToBounds(r: Rect, bounds: Rect): Rect {
  let { x, y, w, h } = r;
  if (w > bounds.w) {
    w = bounds.w;
    x = bounds.x;
  } else {
    x = Math.max(bounds.x, Math.min(x, bounds.x + bounds.w - w));
  }
  if (h > bounds.h) {
    h = bounds.h;
    y = bounds.y;
  } else {
    y = Math.max(bounds.y, Math.min(y, bounds.y + bounds.h - h));
  }
  return { x, y, w, h };
}

/**
 * Overview must stay inside the official SVG canvas so every pixel has artwork/background,
 * and aspect ratio is preserved (letterboxing inside canvas, not outside).
 */
function fitOverviewRectInsideFullCanvas(r: Rect, bounds: Rect): Rect {
  const ar = r.w / r.h;
  let w = Math.min(r.w, bounds.w);
  let h = w / ar;
  if (h > bounds.h) {
    h = bounds.h;
    w = h * ar;
  }
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  let x = cx - w / 2;
  let y = cy - h / 2;
  x = Math.max(bounds.x, Math.min(x, bounds.x + bounds.w - w));
  y = Math.max(bounds.y, Math.min(y, bounds.y + bounds.h - h));
  return { x, y, w, h };
}

function seatKey(s: Pick<RealSeat, 'cx' | 'cy'>): string {
  return `${s.cx},${s.cy}`;
}

/**
 * Row / seat labels from dot layout (no official row data).
 * Merges adjacent cy “steps” into one logical row unless the gap is clearly a new row —
 * so one long curved row with a visual break / gap in the middle stays **one row**.
 */
function computeSeatLabels(seats: RealSeat[]): Map<string, { row: number; seat: number }> {
  const map = new Map<string, { row: number; seat: number }>();
  if (seats.length === 0) return map;

  const cySorted = [...new Set(seats.map((s) => s.cy))].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < cySorted.length; i++) gaps.push(cySorted[i] - cySorted[i - 1]);

  let breakThreshold = 56;
  if (gaps.length > 0) {
    const gAsc = [...gaps].sort((a, b) => a - b);
    const med = gAsc[Math.floor(gAsc.length / 2)];
    const p85 = gAsc[Math.min(gAsc.length - 1, Math.floor(gAsc.length * 0.85))];
    breakThreshold = Math.max(52, med * 2.45, p85 * 1.5);
  }

  const cyRuns: number[][] = [];
  let run: number[] = [cySorted[0]];
  for (let i = 1; i < cySorted.length; i++) {
    if (cySorted[i] - cySorted[i - 1] > breakThreshold) {
      cyRuns.push(run);
      run = [cySorted[i]];
    } else {
      run.push(cySorted[i]);
    }
  }
  cyRuns.push(run);

  const cyToRunId = new Map<number, number>();
  cyRuns.forEach((group, runId) => {
    for (const cy of group) cyToRunId.set(cy, runId);
  });

  const runOrder = cyRuns
    .map((group, runId) => ({
      runId,
      mean: group.reduce((s, c) => s + c, 0) / group.length,
    }))
    .sort((a, b) => b.mean - a.mean)
    .map((x) => x.runId);
  const displayRowForRun = new Map<number, number>();
  runOrder.forEach((runId, i) => displayRowForRun.set(runId, i + 1));

  function closestCyValue(cy: number): number {
    let lo = 0;
    let hi = cySorted.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (cySorted[mid] < cy) lo = mid + 1;
      else hi = mid;
    }
    let idx = lo;
    if (idx > 0 && Math.abs(cySorted[idx - 1] - cy) < Math.abs(cySorted[idx] - cy)) idx -= 1;
    if (idx < cySorted.length - 1 && Math.abs(cySorted[idx + 1] - cy) < Math.abs(cySorted[idx] - cy)) idx += 1;
    return cySorted[idx];
  }

  const byDisplayRow = new Map<number, RealSeat[]>();
  for (const s of seats) {
    const runId = cyToRunId.get(closestCyValue(s.cy))!;
    const displayRow = displayRowForRun.get(runId)!;
    if (!byDisplayRow.has(displayRow)) byDisplayRow.set(displayRow, []);
    byDisplayRow.get(displayRow)!.push(s);
  }

  const rowsOrdered = [...byDisplayRow.keys()].sort((a, b) => a - b);
  for (const displayRow of rowsOrdered) {
    const row = byDisplayRow.get(displayRow)!;
    row.sort((a, b) => a.cx - b.cx);
    row.forEach((s, seatIdx) => {
      map.set(seatKey(s), { row: displayRow, seat: seatIdx + 1 });
    });
  }
  return map;
}

function isSeatDotTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-seat-dot]') !== null;
}

function isSectionPathTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-section-path]') !== null;
}

export default function BloomfieldMap() {
  const locale = useLocale();
  const data = useMemo(() => buildRealBloomfieldData(), []);
  const fullVB = useMemo(() => parseViewBox(data.viewBox), [data.viewBox]);

  const isHe = locale === 'he' || locale.startsWith('he');

  const bloomfieldPitch = useMemo(() => {
    const fx = FIELD_RECT.x;
    const fy = FIELD_RECT.y;
    const fw = FIELD_RECT.w;
    const fh = FIELD_RECT.h;
    const grassInset = Math.min(fw, fh) * 0.038;
    const ix = fx + grassInset;
    const iy = fy + grassInset;
    const iw = fw - 2 * grassInset;
    const ih = fh - 2 * grassInset;
    const icx = ix + iw / 2;
    const icy = iy + ih / 2;
    const line = '#f8fafc';
    const mPxPerM = Math.min(iw / 105, ih / 68);
    const centerR = 9.15 * mPxPerM;
    const rxPenM = (9.15 * iw) / 105;
    const ryPenM = (9.15 * ih) / 68;
    const paDepth = (16.5 / 105) * iw;
    const paSpan = (40.32 / 68) * ih;
    const gaDepth = (5.5 / 105) * iw;
    const gaSpan = (18.32 / 68) * ih;
    const spotD = (11 / 105) * iw;
    const cR = Math.max(70, 1 * mPxPerM);
    const innerBoundaryPath = `M ${ix + cR} ${iy} L ${ix + iw - cR} ${iy} A ${cR} ${cR} 0 0 1 ${ix + iw} ${iy + cR} L ${ix + iw} ${iy + ih - cR} A ${cR} ${cR} 0 0 1 ${ix + iw - cR} ${iy + ih} L ${ix + cR} ${iy + ih} A ${cR} ${cR} 0 0 1 ${ix} ${iy + ih - cR} L ${ix} ${iy + cR} A ${cR} ${cR} 0 0 1 ${ix + cR} ${iy} Z`;
    const gmouthSpan = ih * 0.22;
    const netDepth = Math.max(40, fw * 0.018);
    const spotXL = ix + spotD;
    const spotXR = ix + iw - spotD;
    const postW = Math.max(8, ih * 0.018);
    const dxSpotToPaFront = paDepth - spotD;
    const cosPen = Math.min(1, Math.max(-1, dxSpotToPaFront / rxPenM));
    const paArcH = ryPenM * Math.sqrt(Math.max(0, 1 - cosPen * cosPen));
    const paLineLeftX = ix + paDepth;
    const paLineRightX = ix + iw - paDepth;
    const penaltyArcLeft = `M ${paLineLeftX} ${icy - paArcH} A ${rxPenM} ${ryPenM} 0 0 1 ${paLineLeftX} ${icy + paArcH}`;
    const penaltyArcRight = `M ${paLineRightX} ${icy - paArcH} A ${rxPenM} ${ryPenM} 0 0 0 ${paLineRightX} ${icy + paArcH}`;
    return {
      fx,
      fy,
      fw,
      fh,
      ix,
      iy,
      iw,
      ih,
      icx,
      icy,
      line,
      centerR,
      paDepth,
      paSpan,
      gaDepth,
      gaSpan,
      spotD,
      cR,
      innerBoundaryPath,
      gmouthSpan,
      netDepth,
      spotXL,
      spotXR,
      postW,
      penaltyArcLeft,
      penaltyArcRight,
    };
  }, []);

  const sectionMapFontSize = (seatCount: number) => {
    const vbW = fullVB.w;
    const minFs = vbW * 0.017;
    const maxFs = vbW * 0.03;
    const t = (Math.sqrt(Math.max(seatCount, 64)) / 15) * (vbW * 0.00285);
    return Math.max(minFs, Math.min(maxFs, t));
  };
  const gateBadgeFontSize = fullVB.w * 0.0062;
  const gateBadgePadX = fullVB.w * 0.012;
  const gateBadgePadY = fullVB.h * 0.022;
  const standBannerFs = fullVB.w * 0.019;

  const [compactVB, setCompactVB] = useState<Rect | null>(null);
  const [currentVB, setCurrentVB] = useState<Rect>(() => fullVB);
  const [mapReady, setMapReady] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, vb: fullVB });
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [infoPanelData, setInfoPanelData] = useState<RealSection | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<RealSeat[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const currentVBRef = useRef<Rect>(fullVB);
  const animRef = useRef<number | null>(null);
  const lastTouchDist = useRef<number | null>(null);

  currentVBRef.current = currentVB;

  const cancelAnim = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (from: Rect, to: Rect, duration = ZOOM_ANIM_MS) => {
      cancelAnim();
      const t0 = performance.now();
      const tick = (now: number) => {
        const raw = Math.min(1, (now - t0) / duration);
        const t = easeOutCubic(raw);
        setCurrentVB(lerpRect(from, to, t));
        if (raw < 1) animRef.current = requestAnimationFrame(tick);
        else animRef.current = null;
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [cancelAnim],
  );

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>('[data-section-path]');
    if (paths.length === 0) return;

    let u: Rect | null = null;
    paths.forEach((p) => {
      const b = p.getBBox();
      const r = { x: b.x, y: b.y, w: b.width, h: b.height };
      u = u ? unionRect(u, r) : r;
    });
    u = u ? unionRect(u, FIELD_RECT) : FIELD_RECT;
    const aspect =
      containerRef.current && containerRef.current.clientHeight > 0
        ? containerRef.current.clientWidth / containerRef.current.clientHeight
        : u.w / u.h;
    let padded = expandRect(matchAspect(u, aspect), OVERVIEW_PAD_FR);
    padded = expandRectWidthX(padded, OVERVIEW_PAD_X_EXTRA_FR);
    padded = fitOverviewRectInsideFullCanvas(padded, fullVB);
    setCompactVB(padded);
    setCurrentVB(padded);
    setMapReady(true);
  }, [data, fullVB]);

  const zoomRatio = compactVB ? compactVB.w / currentVB.w : 1;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      cancelAnim();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      setCurrentVB((prev) => {
        const factor = e.deltaY > 0 ? 1.08 : 0.92;
        let nw = prev.w * factor;
        let nh = prev.h * factor;

        const minW = fullVB.w / 40;
        const maxW = fullVB.w * 1.05;
        nw = Math.min(maxW, Math.max(minW, nw));
        nh = nw * (prev.h / prev.w);

        const focusX = prev.x + mx * prev.w;
        const focusY = prev.y + my * prev.h;
        let nx = focusX - mx * nw;
        let ny = focusY - my * nh;

        nx = Math.max(fullVB.x - fullVB.w * 0.02, Math.min(nx, fullVB.x + fullVB.w - nw + fullVB.w * 0.02));
        ny = Math.max(fullVB.y - fullVB.h * 0.02, Math.min(ny, fullVB.y + fullVB.h - nh + fullVB.h * 0.02));

        return { x: nx, y: ny, w: nw, h: nh };
      });
    },
    [cancelAnim, fullVB],
  );

  const zoomIn = () => {
    cancelAnim();
    setCurrentVB((prev) => {
      const nw = Math.min(fullVB.w * 1.05, prev.w * 0.88);
      const nh = nw * (prev.h / prev.w);
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    });
  };

  const zoomOut = () => {
    cancelAnim();
    setCurrentVB((prev) => {
      const nw = Math.max(fullVB.w / 35, prev.w * 1.12);
      const nh = nw * (prev.h / prev.w);
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      let nx = cx - nw / 2;
      let ny = cy - nh / 2;
      nx = Math.max(fullVB.x - fullVB.w * 0.02, Math.min(nx, fullVB.x + fullVB.w - nw + fullVB.w * 0.02));
      ny = Math.max(fullVB.y - fullVB.h * 0.02, Math.min(ny, fullVB.y + fullVB.h - nh + fullVB.h * 0.02));
      return { x: nx, y: ny, w: nw, h: nh };
    });
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (isSeatDotTarget(e.target)) return;
      if (isSectionPathTarget(e.target)) return;
      cancelAnim();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, vb: { ...currentVB } });
    },
    [cancelAnim, currentVB],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      const scaleX = panStart.vb.w / rect.width;
      const scaleY = panStart.vb.h / rect.height;
      let nx = panStart.vb.x - dx * scaleX;
      let ny = panStart.vb.y - dy * scaleY;
      nx = Math.max(fullVB.x - fullVB.w * 0.02, Math.min(nx, fullVB.x + fullVB.w - panStart.vb.w + fullVB.w * 0.02));
      ny = Math.max(fullVB.y - fullVB.h * 0.02, Math.min(ny, fullVB.y + fullVB.h - panStart.vb.h + fullVB.h * 0.02));
      setCurrentVB({ ...panStart.vb, x: nx, y: ny });
    },
    [isPanning, panStart, fullVB],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isSeatDotTarget(e.target)) return;
      if (e.touches.length === 1 && isSectionPathTarget(e.target)) return;
      if (e.touches.length === 1) {
        cancelAnim();
        setIsPanning(true);
        setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, vb: { ...currentVB } });
      } else if (e.touches.length === 2) {
        lastTouchDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    },
    [cancelAnim, currentVB],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      if (e.touches.length === 1 && isPanning) {
        const dx = e.touches[0].clientX - panStart.x;
        const dy = e.touches[0].clientY - panStart.y;
        const scaleX = panStart.vb.w / rect.width;
        const scaleY = panStart.vb.h / rect.height;
        let nx = panStart.vb.x - dx * scaleX;
        let ny = panStart.vb.y - dy * scaleY;
        nx = Math.max(fullVB.x - fullVB.w * 0.02, Math.min(nx, fullVB.x + fullVB.w - panStart.vb.w + fullVB.w * 0.02));
        ny = Math.max(fullVB.y - fullVB.h * 0.02, Math.min(ny, fullVB.y + fullVB.h - panStart.vb.h + fullVB.h * 0.02));
        setCurrentVB({ ...panStart.vb, x: nx, y: ny });
      } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
        cancelAnim();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const factor = dist / lastTouchDist.current;
        lastTouchDist.current = dist;
        setCurrentVB((prev) => {
          let nw = prev.w / factor;
          let nh = prev.h / factor;
          const minW = fullVB.w / 40;
          const maxW = fullVB.w * 1.05;
          nw = Math.min(maxW, Math.max(minW, nw));
          nh = nw * (prev.h / prev.w);
          const cx = prev.x + prev.w / 2;
          const cy = prev.y + prev.h / 2;
          let nx = cx - nw / 2;
          let ny = cy - nh / 2;
          nx = Math.max(fullVB.x - fullVB.w * 0.02, Math.min(nx, fullVB.x + fullVB.w - nw + fullVB.w * 0.02));
          ny = Math.max(fullVB.y - fullVB.h * 0.02, Math.min(ny, fullVB.y + fullVB.h - nh + fullVB.h * 0.02));
          return { x: nx, y: ny, w: nw, h: nh };
        });
      }
    },
    [isPanning, panStart, fullVB, cancelAnim],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDist.current = null;
  }, []);

  const exitToOverview = useCallback(() => {
    if (!compactVB) return;
    cancelAnim();
    animateTo({ ...currentVBRef.current }, compactVB);
    setSelectedSection(null);
    setInfoPanelData(null);
    setSelectedSeats([]);
  }, [compactVB, cancelAnim, animateTo]);

  const resetView = exitToOverview;
  const clearSelection = exitToOverview;

  const handleSectionClick = useCallback(
    (e: React.MouseEvent, section: RealSection) => {
      e.stopPropagation();
      const path = e.currentTarget as SVGPathElement;
      const b = path.getBBox();
      const pad = Math.max(b.width, b.height) * FOCUS_PAD_FR;
      let target: Rect = {
        x: b.x - pad,
        y: b.y - pad,
        w: b.width + 2 * pad,
        h: b.height + 2 * pad,
      };
      const el = containerRef.current;
      if (el && el.clientHeight > 0) {
        const aspect = el.clientWidth / el.clientHeight;
        target = matchAspect(target, aspect);
      }
      const tcx = target.x + target.w / 2;
      const tcy = target.y + target.h / 2;
      const expand = 1 / FOCUS_SCREEN_FR;
      target = {
        x: tcx - (target.w * expand) / 2,
        y: tcy - (target.h * expand) / 2,
        w: target.w * expand,
        h: target.h * expand,
      };
      target = clampRectToBounds(target, fullVB);
      cancelAnim();
      animateTo({ ...currentVBRef.current }, target);
      setSelectedSeats([]);
      setSelectedSection(section.idx);
      setInfoPanelData(section);
    },
    [animateTo, cancelAnim, fullVB],
  );

  const handleSeatClick = useCallback((e: React.MouseEvent, seat: RealSeat) => {
    e.stopPropagation();
    const k = seatKey(seat);
    setSelectedSeats((prev) => {
      const i = prev.findIndex((s) => seatKey(s) === k);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      return [...prev, seat];
    });
  }, []);

  const showSeats = selectedSection !== null;
  const showSparseLabels = zoomRatio < 2.8;

  const selectedSectionSeats = useMemo(() => {
    if (!showSeats || selectedSection === null) return [];
    const sec = data.sections.find((s) => s.idx === selectedSection);
    if (!sec) return [];
    return data.seats.filter(
      (seat) =>
        seat.fill === sec.fill &&
        Math.abs(seat.cx - sec.centroidX) < 2000 &&
        Math.abs(seat.cy - sec.centroidY) < 2000,
    );
  }, [showSeats, selectedSection, data]);

  const seatLabels = useMemo(
    () => computeSeatLabels(selectedSectionSeats),
    [selectedSectionSeats],
  );

  /** `selectedSection` holds `section.idx`, not array index — resolve with `.find`. */
  const panelSection = useMemo((): RealSection | null => {
    if (selectedSection === null) return null;
    return (
      infoPanelData ?? data.sections.find((s) => s.idx === selectedSection) ?? null
    );
  }, [selectedSection, infoPanelData, data.sections]);

  const panelZone = useMemo(() => {
    if (!panelSection) return null;
    return bloomfieldOfficialZone(panelSection);
  }, [panelSection]);

  const panelGate = useMemo(() => {
    if (!panelSection) return null;
    return bloomfieldNearestGate(panelSection);
  }, [panelSection]);

  const panelSeatGrid = useMemo(() => {
    if (!panelSection || panelGate === null) return null;
    const primarySeat = selectedSeats.length > 0 ? selectedSeats[selectedSeats.length - 1]! : null;
    const pl = primarySeat ? seatLabels.get(seatKey(primarySeat)) : null;
    return [
      { lab: isHe ? 'אזור' : 'Section', val: panelSection.name },
      { lab: isHe ? 'בלוק' : 'Block', val: bloomfieldDisplayBlock(panelSection) },
      { lab: isHe ? 'שורה' : 'Row', val: pl ? String(pl.row) : '—' },
      { lab: isHe ? 'מושב' : 'Seat', val: pl ? String(pl.seat) : '—' },
      { lab: isHe ? 'שער קרוב' : 'Nearest gate', val: String(panelGate) },
    ];
  }, [panelSection, panelGate, selectedSeats, seatLabels, isHe]);

  const purchaseQuery = useMemo(() => {
    if (!panelSection || selectedSeats.length === 0) return '';
    const q = new URLSearchParams();
    q.set('stadium', 'bloomfield');
    q.set('section', String(panelSection.name));
    q.set('qty', String(selectedSeats.length));
    for (const s of selectedSeats) {
      const rs = seatLabels.get(seatKey(s));
      if (rs) q.append('mapSeat', `${rs.row}-${rs.seat}`);
      else q.append('mapSeat', `dot:${s.cx},${s.cy}`);
    }
    return q.toString();
  }, [panelSection, selectedSeats, seatLabels]);

  const selectedSeatKeySet = useMemo(
    () => new Set(selectedSeats.map(seatKey)),
    [selectedSeats],
  );

  useEffect(() => {
    if (!showSeats) setSelectedSeats([]);
  }, [showSeats]);

  useEffect(() => {
    if (selectedSection === null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') exitToOverview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSection, exitToOverview]);

  const pctLabel = compactVB ? Math.round((compactVB.w / currentVB.w) * 100) : 100;

  /** Top-right; explicit colors so dark OS / body theme does not paint white-on-white */
  const selectionPanelStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 2147483647,
    left: 'auto',
    right: 12,
    top: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)',
    bottom: 'auto',
    width: 'min(24rem, calc(100vw - 20px))',
    maxHeight: 'min(58vh, 480px)',
    boxSizing: 'border-box',
    color: '#0f172a',
    background: 'linear-gradient(165deg, #ffffff 0%, #f1f5f9 55%, #f8fafc 100%)',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(13, 148, 136, 0.12)',
    colorScheme: 'light',
  };

  return (
    <>
      <div
        className="flex min-h-[100dvh] min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden text-slate-900"
        style={{ colorScheme: 'light', backgroundColor: '#d8dee8' }}
      >
        <div
          className="flex min-h-0 shrink-0 flex-col overflow-hidden self-center shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
          style={{
            width: PAGE_MAX_W,
            maxWidth: '32rem',
            marginInline: 'auto',
            height: 'min(92dvh, 92svh)',
            maxHeight: 'min(100dvh, 100svh)',
            backgroundColor: '#e8ecf4',
          }}
        >
        <div
          className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5 shadow-sm"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          <div className="min-w-0 pr-3">
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              {isHe ? 'אצטדיון בלומפילד' : 'Bloomfield Stadium'}
            </h1>
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              {isHe ? 'בית מכבי תל אביב · כ־30,000 מושבים · נפתח מחדש 2019' : 'Maccabi Tel Aviv · ~30,000 seats · reopened 2019'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-slate-500 sm:text-sm">
            <span title={isHe ? 'יחס תצוגה ביחס לתצוגה מלאה' : 'Zoom vs overview'}>{pctLabel}%</span>
            <span className="text-slate-300">·</span>
            <span>
              {data.totalSeats.toLocaleString()} {isHe ? 'מושבים' : 'seats'}
            </span>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative min-h-0 flex-1 overflow-hidden transition-opacity duration-150 ${mapReady ? 'cursor-grab opacity-100 active:cursor-grabbing' : 'pointer-events-none opacity-0'}`}
          style={{ backgroundColor: '#dce3ee' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {selectedSection !== null && (
            <>
              <button
                type="button"
                className="absolute bottom-24 left-0 top-0 z-[21] w-[min(4rem,14vw)] cursor-pointer border-0 bg-slate-900/15 transition hover:bg-slate-900/25"
                aria-label={isHe ? 'חזרה לאצטדיון מלא' : 'Back to full stadium'}
                onClick={(ev) => {
                  ev.stopPropagation();
                  exitToOverview();
                }}
              />
              <button
                type="button"
                className="absolute bottom-24 right-0 top-0 z-[21] w-[min(4rem,14vw)] cursor-pointer border-0 bg-slate-900/15 transition hover:bg-slate-900/25"
                aria-label={isHe ? 'חזרה לאצטדיון מלא' : 'Back to full stadium'}
                onClick={(ev) => {
                  ev.stopPropagation();
                  exitToOverview();
                }}
              />
            </>
          )}
          <svg
            ref={svgRef}
            viewBox={rectToVB(currentVB)}
            className="block h-full w-full max-h-full max-w-full drop-shadow-sm"
            preserveAspectRatio="xMidYMid meet"
            style={{ backgroundColor: '#e5eaf2' }}
            role="img"
            aria-label={isHe ? 'מפת אצטדיון בלומפילד' : 'Bloomfield Stadium seat map'}
          >
            <defs>
              <linearGradient id="bloomfield-grass-c" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4faa56" />
                <stop offset="45%" stopColor="#3d9142" />
                <stop offset="100%" stopColor="#2d722f" />
              </linearGradient>
              <pattern
                id="bloomfield-grass-stripes"
                width={56}
                height={56}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(6)"
              >
                <rect width={56} height={56} fill="#000" fillOpacity={0} />
                <line x1={0} y1={0} x2={56} y2={0} stroke="#000" strokeWidth={16} strokeOpacity={0.035} />
              </pattern>
              <filter id="section-depth" x="-8%" y="-8%" width="116%" height="116%">
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#1e293b" floodOpacity="0.11" />
              </filter>
            </defs>
            <rect
              x={currentVB.x}
              y={currentVB.y}
              width={currentVB.w}
              height={currentVB.h}
              fill="#e4e9f0"
            />

            <ellipse
              cx={data.fieldCenter.x}
              cy={data.fieldCenter.y}
              rx={6200}
              ry={5800}
              fill="#d1dae8"
              fillOpacity={0.4}
              stroke="#b8c4d4"
              strokeWidth="5"
            />

            <g id="bloomfield-pitch-fifa">
              <rect
                x={bloomfieldPitch.fx}
                y={bloomfieldPitch.fy}
                width={bloomfieldPitch.fw}
                height={bloomfieldPitch.fh}
                rx={88}
                fill="url(#bloomfield-grass-c)"
                stroke="#1b4d18"
                strokeWidth={5}
              />
              <rect
                x={bloomfieldPitch.fx}
                y={bloomfieldPitch.fy}
                width={bloomfieldPitch.fw}
                height={bloomfieldPitch.fh}
                rx={88}
                fill="url(#bloomfield-grass-stripes)"
              />
              <path
                d={bloomfieldPitch.innerBoundaryPath}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={3}
                strokeOpacity={0.94}
                strokeLinejoin="round"
              />
              <g opacity={0.96}>
                <rect
                  x={bloomfieldPitch.ix - bloomfieldPitch.netDepth}
                  y={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                  width={bloomfieldPitch.netDepth}
                  height={bloomfieldPitch.gmouthSpan}
                  rx={4}
                  fill="#d4dde8"
                  stroke="#94a3b8"
                  strokeWidth={2}
                />
                <rect
                  x={bloomfieldPitch.ix + bloomfieldPitch.iw}
                  y={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                  width={bloomfieldPitch.netDepth}
                  height={bloomfieldPitch.gmouthSpan}
                  rx={4}
                  fill="#d4dde8"
                  stroke="#94a3b8"
                  strokeWidth={2}
                />
                <line
                  x1={bloomfieldPitch.ix - bloomfieldPitch.netDepth}
                  y1={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                  x2={bloomfieldPitch.ix + bloomfieldPitch.netDepth * 0.15}
                  y2={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                  stroke={bloomfieldPitch.line}
                  strokeWidth={Math.max(10, bloomfieldPitch.postW)}
                  strokeLinecap="round"
                />
                <line
                  x1={bloomfieldPitch.ix - bloomfieldPitch.netDepth}
                  y1={bloomfieldPitch.icy + bloomfieldPitch.gmouthSpan / 2}
                  x2={bloomfieldPitch.ix + bloomfieldPitch.netDepth * 0.15}
                  y2={bloomfieldPitch.icy + bloomfieldPitch.gmouthSpan / 2}
                  stroke={bloomfieldPitch.line}
                  strokeWidth={Math.max(10, bloomfieldPitch.postW)}
                  strokeLinecap="round"
                />
                <line
                  x1={bloomfieldPitch.ix + bloomfieldPitch.iw - bloomfieldPitch.netDepth * 0.15}
                  y1={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                  x2={bloomfieldPitch.ix + bloomfieldPitch.iw + bloomfieldPitch.netDepth}
                  y2={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                  stroke={bloomfieldPitch.line}
                  strokeWidth={Math.max(10, bloomfieldPitch.postW)}
                  strokeLinecap="round"
                />
                <line
                  x1={bloomfieldPitch.ix + bloomfieldPitch.iw - bloomfieldPitch.netDepth * 0.15}
                  y1={bloomfieldPitch.icy + bloomfieldPitch.gmouthSpan / 2}
                  x2={bloomfieldPitch.ix + bloomfieldPitch.iw + bloomfieldPitch.netDepth}
                  y2={bloomfieldPitch.icy + bloomfieldPitch.gmouthSpan / 2}
                  stroke={bloomfieldPitch.line}
                  strokeWidth={Math.max(10, bloomfieldPitch.postW)}
                  strokeLinecap="round"
                />
              </g>
              <line
                x1={bloomfieldPitch.icx}
                y1={bloomfieldPitch.iy}
                x2={bloomfieldPitch.icx}
                y2={bloomfieldPitch.iy + bloomfieldPitch.ih}
                stroke={bloomfieldPitch.line}
                strokeWidth={2.6}
                strokeOpacity={0.9}
              />
              <circle
                cx={bloomfieldPitch.icx}
                cy={bloomfieldPitch.icy}
                r={bloomfieldPitch.centerR}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2.6}
                strokeOpacity={0.88}
              />
              <rect
                x={bloomfieldPitch.ix}
                y={bloomfieldPitch.icy - bloomfieldPitch.paSpan / 2}
                width={bloomfieldPitch.paDepth}
                height={bloomfieldPitch.paSpan}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2.4}
                strokeOpacity={0.88}
              />
              <rect
                x={bloomfieldPitch.ix + bloomfieldPitch.iw - bloomfieldPitch.paDepth}
                y={bloomfieldPitch.icy - bloomfieldPitch.paSpan / 2}
                width={bloomfieldPitch.paDepth}
                height={bloomfieldPitch.paSpan}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2.4}
                strokeOpacity={0.88}
              />
              <rect
                x={bloomfieldPitch.ix}
                y={bloomfieldPitch.icy - bloomfieldPitch.gaSpan / 2}
                width={bloomfieldPitch.gaDepth}
                height={bloomfieldPitch.gaSpan}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2}
                strokeOpacity={0.82}
              />
              <rect
                x={bloomfieldPitch.ix + bloomfieldPitch.iw - bloomfieldPitch.gaDepth}
                y={bloomfieldPitch.icy - bloomfieldPitch.gaSpan / 2}
                width={bloomfieldPitch.gaDepth}
                height={bloomfieldPitch.gaSpan}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2}
                strokeOpacity={0.82}
              />
              <line
                x1={bloomfieldPitch.ix}
                y1={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                x2={bloomfieldPitch.ix}
                y2={bloomfieldPitch.icy + bloomfieldPitch.gmouthSpan / 2}
                stroke={bloomfieldPitch.line}
                strokeWidth={10}
                strokeLinecap="round"
                strokeOpacity={0.95}
              />
              <line
                x1={bloomfieldPitch.ix + bloomfieldPitch.iw}
                y1={bloomfieldPitch.icy - bloomfieldPitch.gmouthSpan / 2}
                x2={bloomfieldPitch.ix + bloomfieldPitch.iw}
                y2={bloomfieldPitch.icy + bloomfieldPitch.gmouthSpan / 2}
                stroke={bloomfieldPitch.line}
                strokeWidth={10}
                strokeLinecap="round"
                strokeOpacity={0.95}
              />
              <circle cx={bloomfieldPitch.spotXL} cy={bloomfieldPitch.icy} r={8} fill={bloomfieldPitch.line} fillOpacity={0.95} />
              <circle cx={bloomfieldPitch.spotXR} cy={bloomfieldPitch.icy} r={8} fill={bloomfieldPitch.line} fillOpacity={0.95} />
              <path
                d={bloomfieldPitch.penaltyArcLeft}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2}
                strokeOpacity={0.86}
              />
              <path
                d={bloomfieldPitch.penaltyArcRight}
                fill="none"
                stroke={bloomfieldPitch.line}
                strokeWidth={2}
                strokeOpacity={0.86}
              />
            </g>

            <g
              id="bloomfield-stand-names"
              style={{ pointerEvents: 'none' }}
              opacity={showSparseLabels ? 0.55 : 0.35}
            >
              <text
                x={8200}
                y={1920}
                textAnchor="middle"
                fill="#475569"
                fontSize={standBannerFs}
                fontWeight="700"
                fontFamily="system-ui,Segoe UI,sans-serif"
              >
                {isHe ? 'יציע מערבי' : 'West stand'}
              </text>
              <text
                x={8200}
                y={12720}
                textAnchor="middle"
                fill="#475569"
                fontSize={standBannerFs}
                fontWeight="700"
                fontFamily="system-ui,Segoe UI,sans-serif"
              >
                {isHe ? 'יציע מזרחי · ש׳ 7–8' : 'East · gates 7–8'}
              </text>
              <text
                x={2640}
                y={7450}
                textAnchor="middle"
                transform="rotate(-90 2640 7450)"
                fill="#475569"
                fontSize={standBannerFs * 0.92}
                fontWeight="700"
                fontFamily="system-ui,Segoe UI,sans-serif"
              >
                {isHe ? 'יציע דרומי · ש׳ 10–11' : 'South · gates 10–11'}
              </text>
              <text
                x={13660}
                y={7450}
                textAnchor="middle"
                transform="rotate(90 13660 7450)"
                fill="#475569"
                fontSize={standBannerFs * 0.92}
                fontWeight="700"
                fontFamily="system-ui,Segoe UI,sans-serif"
              >
                {isHe ? 'שערים 4 · 5' : 'Gates 4 · 5'}
              </text>
            </g>

            <g filter="url(#section-depth)">
              {data.sections.map((section) => {
                const isSelected = selectedSection === section.idx;
                const isHovered = hoveredSection === section.idx;
                const fill = friendlyFill(section.fill);
                const strokeColor = isSelected ? '#0f766e' : isHovered ? '#0d9488' : '#ffffff';
                return (
                  <path
                    key={section.idx}
                    data-section-path
                    data-section-idx={section.idx}
                    d={section.d}
                    fill={fill}
                    fillOpacity={isSelected ? 1 : isHovered ? 0.92 : 0.88}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 18 : isHovered ? 12 : 2.5}
                    strokeLinejoin="round"
                    strokeOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.55}
                    className="transition-[fill-opacity,stroke-width,stroke-opacity] duration-150 ease-out"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredSection(section.idx)}
                    onMouseLeave={() => setHoveredSection(null)}
                    onMouseDown={(ev) => ev.stopPropagation()}
                    onTouchStart={(ev) => ev.stopPropagation()}
                    onClick={(e) => handleSectionClick(e, section)}
                  />
                );
              })}
            </g>

            {data.sections.map((section) => {
              if (section.seatCount < 30) return null;
              if (!showSparseLabels && section.idx !== selectedSection) return null;
              const fontSize = sectionMapFontSize(section.seatCount);
              return (
                <text
                  key={`label-${section.idx}`}
                  x={section.centroidX}
                  y={section.centroidY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1e293b"
                  fillOpacity={0.82}
                  stroke="#ffffff"
                  strokeWidth={fontSize * 0.06}
                  strokeOpacity={0.55}
                  paintOrder="stroke fill"
                  fontSize={fontSize}
                  fontWeight="700"
                  fontFamily="system-ui, Segoe UI, Arial, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {section.name}
                </text>
              );
            })}

            {showSeats &&
              selectedSectionSeats.map((seat, i) => {
                const isSel = selectedSeatKeySet.has(seatKey(seat));
                return (
                  <g key={i}>
                    {isSel && (
                      <circle cx={seat.cx} cy={seat.cy} r={26} fill="#0d9488" fillOpacity={0.2} style={{ pointerEvents: 'none' }} />
                    )}
                    <circle
                      data-seat-dot
                      cx={seat.cx}
                      cy={seat.cy}
                      r={isSel ? 15 : 12}
                      fill={friendlyFill(seat.fill)}
                      fillOpacity={isSel ? 1 : 0.88}
                      stroke={isSel ? '#0f766e' : '#fff'}
                      strokeWidth={isSel ? 3.5 : 2}
                      className="transition-[r,stroke-width,fill-opacity] duration-150"
                      style={{ cursor: 'pointer' }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => handleSeatClick(e, seat)}
                    />
                  </g>
                );
              })}

            {GATE_POSITIONS.map(({ gate, x, y }) => (
              <g key={gate}>
                <rect
                  x={x - gateBadgePadX}
                  y={y - gateBadgePadY / 2}
                  width={gateBadgePadX * 2}
                  height={gateBadgePadY}
                  rx={fullVB.w * 0.0016}
                  fill="#1e293b"
                  fillOpacity={0.96}
                />
                <text
                  x={x}
                  y={y + gateBadgeFontSize * 0.28}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={gateBadgeFontSize}
                  fontWeight="800"
                  fontFamily="system-ui,Segoe UI,Arial,sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {bloomfieldGateBadgeLabel(gate, isHe)}
                </text>
              </g>
            ))}

            <g>
              <rect x={8620} y={1980} width={760} height={168} rx={40} fill="#1e293b" fillOpacity={0.94} />
              <text
                x={9000}
                y={2095}
                textAnchor="middle"
                fill="#fef9c3"
                fontSize={gateBadgeFontSize * 1.05}
                fontWeight="800"
                fontFamily="system-ui,Segoe UI,sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {isHe ? 'VIP · תאי צפייה' : 'VIP · boxes'}
              </text>
            </g>
          </svg>

          <div
            className="absolute bottom-3 left-1/2 z-[26] flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-lg shadow-slate-900/8 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition text-lg leading-none">
              −
            </button>
            <div className="w-14 text-center text-xs text-slate-600 font-mono tabular-nums">{pctLabel}%</div>
            <button type="button" onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition text-lg leading-none">
              +
            </button>
            <div className="w-px h-6 bg-slate-200 mx-0.5" />
            <button type="button" onClick={resetView} className="px-2.5 h-8 flex items-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition">
              {isHe ? 'איפוס' : 'Reset'}
            </button>
          </div>

          {hoveredSection !== null && !panelSection && (() => {
            const hs = data.sections.find((s) => s.idx === hoveredSection);
            const zone = hs ? bloomfieldOfficialZone(hs) : null;
            return (
              <div className="pointer-events-none absolute start-3 top-3 z-20 max-w-[min(20rem,calc(100vw-24px))] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-800 shadow-md">
                <div className="font-bold text-slate-900">
                  {hs?.name} ·{' '}
                  {hs?.seatCount.toLocaleString()} {isHe ? 'מושבים' : 'seats'}
                </div>
                {zone && (
                  <div className="mt-1 text-[11px] font-medium leading-snug text-slate-600">
                    {isHe ? zone.titleHe : zone.titleEn}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        </div>
      </div>

      {panelSection && (
        <aside
          className="overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl p-0 shadow-xl backdrop-blur-sm sm:rounded-[1.25rem] [&_a]:no-underline"
          style={selectionPanelStyle}
          dir={isHe ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          role="complementary"
          aria-label={isHe ? 'סל בחירה — בלומפילד' : 'Selection — Bloomfield'}
        >
          <div
            className="rounded-t-2xl border-b border-amber-900/15 bg-gradient-to-l from-amber-100 via-yellow-50 to-amber-50 px-4 py-3.5 sm:rounded-t-[1.25rem]"
            aria-hidden
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-900/60">
              {isHe ? 'בחירת מושבים' : 'Seat selection'}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: friendlyFill(panelSection.fill) }}
              />
              <div className="min-w-0">
                <div className="text-lg font-bold leading-snug text-slate-900">{panelSection.name}</div>
                <div className="text-xs font-semibold text-slate-600">
                  {bloomfieldStandLabelForSection(panelSection, isHe)}
                </div>
              </div>
            </div>
            {panelZone && (
              <p className="mt-2 text-[13px] font-bold leading-snug text-amber-950/90">
                {isHe ? panelZone.titleHe : panelZone.titleEn}
              </p>
            )}
          </div>

          <div className="border-t border-slate-200/80 bg-white px-4 py-4 sm:px-5">
            {panelSeatGrid && (
              <div className="mb-4 grid grid-cols-5 gap-0.5 border-b border-slate-200 pb-4 text-center sm:gap-1">
                {panelSeatGrid.map((c) => (
                  <div key={c.lab} className="min-w-0 px-0.5">
                    <div className="mb-1 text-[10px] font-medium leading-tight text-slate-500 sm:text-[11px]">{c.lab}</div>
                    <div className="truncate text-sm font-extrabold tabular-nums text-slate-900 sm:text-base">{c.val}</div>
                  </div>
                ))}
              </div>
            )}

            {panelZone && (
              <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
                {isHe ? panelZone.blurbHe : panelZone.blurbEn}
              </p>
            )}

            <a
              href={MACCABI_STADIUM_INFO}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex items-center justify-center gap-1 rounded-lg border border-amber-200/90 bg-amber-50/90 py-2 text-center text-xs font-semibold text-amber-950/90 transition hover:bg-amber-100"
            >
              {isHe ? 'מידע נוסף באתר מכבי ת״א' : 'More on Maccabi TLV website'}
              <span aria-hidden>↗</span>
            </a>

            <dl className="mb-1 space-y-0 rounded-xl border border-slate-200/90 bg-slate-50/80 text-sm shadow-inner shadow-slate-900/5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
                <dt className="text-slate-500">{isHe ? 'צבע האזור' : 'Zone color'}</dt>
                <dd className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white shadow ring-offset-1 ring-offset-slate-100"
                    style={{ backgroundColor: friendlyFill(panelSection.fill) }}
                  />
                  <span className="truncate font-mono text-xs text-slate-600">{friendlyFill(panelSection.fill)}</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-slate-500">{isHe ? 'מושבים בגוש' : 'Seats in block'}</dt>
                <dd className="font-bold tabular-nums text-slate-900">{panelSection.seatCount.toLocaleString()}</dd>
              </div>
            </dl>

            {showSeats && selectedSeats.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    {isHe ? 'הבחירה שלכם' : 'Your picks'}{' '}
                    <span className="tabular-nums text-teal-700">({selectedSeats.length})</span>
                  </h4>
                  <button
                    type="button"
                    className="text-xs font-semibold text-teal-700 underline-offset-2 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSeats([]);
                    }}
                  >
                    {isHe ? 'נקה הכל' : 'Clear all'}
                  </button>
                </div>
                <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-0.5">
                  {selectedSeats.map((s) => {
                    const lbl = seatLabels.get(seatKey(s));
                    const label = lbl
                      ? isHe
                        ? `שורה ${lbl.row} · מושב ${lbl.seat}`
                        : `Row ${lbl.row} · Seat ${lbl.seat}`
                      : isHe
                        ? 'מושב במפה'
                        : 'Map seat';
                    return (
                      <li
                        key={seatKey(s)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                      >
                        <span className="min-w-0 truncate font-medium tabular-nums">{label}</span>
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 transition hover:bg-rose-100 hover:text-rose-700"
                          aria-label={isHe ? 'הסר מושב' : 'Remove seat'}
                          onClick={(e) => {
                            e.stopPropagation();
                            const k = seatKey(s);
                            setSelectedSeats((prev) => prev.filter((x) => seatKey(x) !== k));
                          }}
                        >
                          &times;
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[11px] leading-snug text-slate-500">
                  {isHe
                    ? 'מספור שורות מאוחד גם כשיש רווח באמצע אותה שורה במפה.'
                    : 'Row numbers treat one curved row with a gap as a single row.'}
                </p>
                <Link
                  href={`/${locale}/events${purchaseQuery ? `?${purchaseQuery}` : ''}`}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/25 transition hover:from-teal-500 hover:to-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
                >
                  {isHe ? 'המשך לרכישה' : 'Continue to purchase'}
                </Link>
              </div>
            )}

            {showSeats && selectedSeats.length === 0 && (
              <div className="mt-4 space-y-2 rounded-xl bg-slate-100/90 px-3 py-3 text-center text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                <p>
                  {isHe
                    ? 'לחצו על הנקודות על המפה — אפשר לבחור כמה מושבים.'
                    : 'Tap dots on the map — you can select multiple seats.'}
                </p>
                <p className="text-[11px] font-normal text-slate-500">
                  {isHe
                    ? 'Esc או לחיצה בפס הצדדיים מחזירים לתצוגת אצטדיון מלא.'
                    : 'Esc or the side strips return to the full stadium view.'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={clearSelection}
              className="mt-5 w-full rounded-xl border-2 border-slate-800 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              {isHe ? 'סגור' : 'Close'}
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
