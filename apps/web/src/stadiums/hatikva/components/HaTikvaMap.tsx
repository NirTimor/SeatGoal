'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  buildRealHatikvaData,
  GATE_POSITIONS,
  HATIKVA_CANVAS_BG,
  HATIKVA_FIELD_H,
  HATIKVA_FIELD_W,
  HATIKVA_FIELD_X,
  HATIKVA_FIELD_Y,
  hatikvaSouthStandGeometry,
} from '../data/stadiumData';
import type { RealSection, RealSeat } from '../data/stadiumData';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;
const FOCUS_SCREEN_FR = 0.75;

/** Display palette aligned with [Leaan](https://www.leaan.co.il) hatikva seatmap (peach / greys / terracotta / orange / pale end stand). */
const LEAAN_SECTION_FILL: Record<number, string> = {
  0: '#e5b091',
  1: '#999999',
  2: '#cc8452',
  3: '#c44d00',
  4: '#eeeeee',
};

function leaanSectionFill(section: RealSection): string {
  return LEAAN_SECTION_FILL[section.idx] ?? section.fill;
}

function leaanLabelStyle(section: RealSection): { fill: string; stroke: string; strokeW: number; strokeOp: number } {
  if (section.idx === 3) {
    return { fill: '#ffffff', stroke: 'rgba(0,0,0,0.25)', strokeW: 2, strokeOp: 0.4 };
  }
  if (section.idx === 4) {
    return { fill: '#374151', stroke: '#ffffff', strokeW: 3, strokeOp: 0.9 };
  }
  return { fill: '#1a1a1a', stroke: '#ffffff', strokeW: 4, strokeOp: 0.55 };
}

function findSeatSection(seat: RealSeat, sections: RealSection[]): RealSection | undefined {
  return sections.find(
    (s) =>
      seat.fill.replace(/#/g, '').toLowerCase() === s.fill.replace(/#/g, '').toLowerCase() &&
      Math.abs(seat.cx - s.centroidX) < 2500 &&
      Math.abs(seat.cy - s.centroidY) < 800,
  );
}

function leaanSeatDisplayFill(seat: RealSeat, sections: RealSection[]): string {
  const sec = findSeatSection(seat, sections);
  if (sec) return leaanSectionFill(sec);
  return '#c97d62';
}

/** “Block” number – first digit group in section name, else idx+1 (Leaan-style). */
function hatikvaDisplayBlock(section: RealSection): string {
  const m = section.name.match(/(\d+)/);
  if (m) return m[1]!;
  return String(section.idx + 1);
}

function hatikvaNearestGate(section: RealSection): number {
  let bestGate = GATE_POSITIONS[0]!.gate;
  let bestD = Infinity;
  for (const g of GATE_POSITIONS) {
    const d = (section.centroidX - g.x) ** 2 + (section.centroidY - g.y) ** 2;
    if (d < bestD) {
      bestD = d;
      bestGate = g.gate;
    }
  }
  return bestGate;
}

function seatKey(s: Pick<RealSeat, 'cx' | 'cy'>): string {
  return `${s.cx},${s.cy}`;
}

function computeSeatLabels(seats: RealSeat[]): Map<string, { row: number; seat: number }> {
  const mapVal = new Map<string, { row: number; seat: number }>();
  if (seats.length === 0) return mapVal;

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
      mapVal.set(seatKey(s), { row: displayRow, seat: seatIdx + 1 });
    });
  }
  return mapVal;
}

function isSeatDotTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-seat-dot]') !== null;
}

function isSectionPathTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-section-path]') !== null;
}

export default function HaTikvaMap() {
  const locale = useLocale();
  const data = useMemo(() => buildRealHatikvaData(), []);
  const southStandGeom = useMemo(() => hatikvaSouthStandGeometry(), []);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [infoPanelData, setInfoPanelData] = useState<RealSection | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<RealSeat[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastTouchDist = useRef<number | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta * z * 0.3)));
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.3));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (isSeatDotTarget(e.target)) return;
      if (isSectionPathTarget(e.target)) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isSeatDotTarget(e.target)) return;
      if (e.touches.length === 1 && isSectionPathTarget(e.target)) return;
      if (e.touches.length === 1) {
        setIsPanning(true);
        setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      } else if (e.touches.length === 2) {
        lastTouchDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    },
    [pan],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isPanning) {
        setPan({ x: e.touches[0].clientX - panStart.x, y: e.touches[0].clientY - panStart.y });
      } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * (dist / lastTouchDist.current!))));
        lastTouchDist.current = dist;
      }
    },
    [isPanning, panStart],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDist.current = null;
  }, []);

  const exitToOverview = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedSection(null);
    setInfoPanelData(null);
    setSelectedSeats([]);
  }, []);

  const resetView = exitToOverview;
  const clearSelection = exitToOverview;

  const handleSectionClick = useCallback((e: React.MouseEvent, section: RealSection) => {
    e.stopPropagation();
    const path = e.currentTarget as SVGPathElement;
    setSelectedSeats([]);
    setSelectedSection(section.idx);
    setInfoPanelData(section);

    const runFit = () => {
      const container = containerRef.current;
      if (!container) return;
      const cr = container.getBoundingClientRect();
      const pr = path.getBoundingClientRect();
      const wScr = Math.max(1, pr.width);
      const hScr = Math.max(1, pr.height);

      const zMul = Math.min((FOCUS_SCREEN_FR * cr.width) / wScr, (FOCUS_SCREEN_FR * cr.height) / hScr);
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * zMul)));

      const runCenter = () => {
        const pr2 = path.getBoundingClientRect();
        const ccx = cr.left + cr.width / 2;
        const ccy = cr.top + cr.height / 2;
        const rcx = pr2.left + pr2.width / 2;
        const rcy = pr2.top + pr2.height / 2;
        setPan((pp) => ({ x: pp.x + (ccx - rcx), y: pp.y + (ccy - rcy) }));
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(runCenter);
        });
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runFit);
    });
  }, []);

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

  const selectedSectionSeats = useMemo(() => {
    if (!showSeats || selectedSection === null) return [];
    const sec = data.sections.find((s) => s.idx === selectedSection);
    if (!sec) return [];
    return data.seats.filter(
      (seat) =>
        seat.fill.toLowerCase() === sec.fill.toLowerCase() &&
        Math.abs(seat.cx - sec.centroidX) < 2000 &&
        Math.abs(seat.cy - sec.centroidY) < 500,
    );
  }, [showSeats, selectedSection, data]);

  const seatLabels = useMemo(() => computeSeatLabels(selectedSectionSeats), [selectedSectionSeats]);

  const panelSection = useMemo((): RealSection | null => {
    if (selectedSection === null) return null;
    return infoPanelData ?? data.sections.find((s) => s.idx === selectedSection) ?? null;
  }, [selectedSection, infoPanelData, data.sections]);

  const purchaseQuery = useMemo(() => {
    if (!panelSection || selectedSeats.length === 0) return '';
    const q = new URLSearchParams();
    q.set('stadium', 'hatikva');
    q.set('section', String(panelSection.name));
    q.set('qty', String(selectedSeats.length));
    for (const s of selectedSeats) {
      const rs = seatLabels.get(seatKey(s));
      if (rs) q.append('mapSeat', `${rs.row}-${rs.seat}`);
      else q.append('mapSeat', `dot:${s.cx},${s.cy}`);
    }
    return q.toString();
  }, [panelSection, selectedSeats, seatLabels]);

  const selectedSeatKeySet = useMemo(() => new Set(selectedSeats.map(seatKey)), [selectedSeats]);

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

  const [vbX, vbY, vbW, vbH] = data.viewBox.trim().split(/[\s,]+/).map(Number);
  /** SVG user-units are ~7500 wide; fontSize must scale with vbW or labels look tiny on screen. */
  const sectionMapFontSize = (seatCount: number) => {
    const minFs = vbW * 0.019;
    const maxFs = vbW * 0.033;
    const t = (Math.sqrt(Math.max(seatCount, 64)) / 7.2) * (vbW * 0.00285);
    return Math.max(minFs, Math.min(maxFs, t));
  };
  const gateBadgeFontSize = vbW * 0.0064;
  const gateBadgePadX = vbW * 0.013;
  const gateBadgePadY = vbH * 0.024;

  const isHe = locale === 'he' || locale.startsWith('he');

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

  /**
   * Grass pad (fx…fw×fh) with FIFA play area inset — white touchlines sit inside the green like a real pitch.
   * Touchline length 105 m → iw, goal-line width 68 m → ih. Goals left/right.
   */
  const pitch = useMemo(() => {
    const fx = HATIKVA_FIELD_X;
    const fy = HATIKVA_FIELD_Y;
    const fw = HATIKVA_FIELD_W;
    const fh = HATIKVA_FIELD_H;
    const grassInset = Math.min(fw, fh) * 0.042;
    const ix = fx + grassInset;
    const iy = fy + grassInset;
    const iw = fw - 2 * grassInset;
    const ih = fh - 2 * grassInset;
    const icx = ix + iw / 2;
    const icy = iy + ih / 2;
    const line = '#f8fafc';
    const mPxPerM = Math.min(iw / 105, ih / 68);
    const centerR = 9.15 * mPxPerM;
    /** Anisotropic metres→px so circles on the real pitch map to correct ellipses in SVG (iw:ih ≠ 105:68). */
    const rxPenM = (9.15 * iw) / 105;
    const ryPenM = (9.15 * ih) / 68;
    const paDepth = (16.5 / 105) * iw;
    const paSpan = (40.32 / 68) * ih;
    const gaDepth = (5.5 / 105) * iw;
    const gaSpan = (18.32 / 68) * ih;
    const spotD = (11 / 105) * iw;
    const cR = Math.max(2.25, 1 * mPxPerM);
    const innerBoundaryPath = `M ${ix + cR} ${iy} L ${ix + iw - cR} ${iy} A ${cR} ${cR} 0 0 1 ${ix + iw} ${iy + cR} L ${ix + iw} ${iy + ih - cR} A ${cR} ${cR} 0 0 1 ${ix + iw - cR} ${iy + ih} L ${ix + cR} ${iy + ih} A ${cR} ${cR} 0 0 1 ${ix} ${iy + ih - cR} L ${ix} ${iy + cR} A ${cR} ${cR} 0 0 1 ${ix + cR} ${iy} Z`;
    const gmouthSpan = ih * 0.22;
    const netDepth = Math.max(26, fw * 0.016);
    const spotXL = ix + spotD;
    const spotXR = ix + iw - spotD;
    const postW = Math.max(5, ih * 0.02);
    const dxSpotToPaFront = paDepth - spotD;
    const cosPen = Math.min(1, Math.max(-1, dxSpotToPaFront / rxPenM));
    const paArcH = ryPenM * Math.sqrt(Math.max(0, 1 - cosPen * cosPen));
    const paLineLeftX = ix + paDepth;
    const paLineRightX = ix + iw - paDepth;
    /* sweep faces the arc toward midfield (+x left side, −x right side) */
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

  return (
    <>
      <div
        className="flex w-full min-h-[100svh] min-h-[100dvh] flex-col overflow-hidden text-slate-800 [color-scheme:light]"
        style={{ minHeight: 'max(100dvh, 100svh)', backgroundColor: HATIKVA_CANVAS_BG }}
      >
        <div
          className="flex flex-shrink-0 items-center justify-between border-b border-slate-400/20 px-4 py-2.5 shadow-sm"
          style={{ backgroundColor: HATIKVA_CANVAS_BG }}
        >
          <h1 className="text-base font-semibold tracking-tight text-slate-800">
            {isHe ? 'אצטדיון שכונת התקווה' : 'HaTikva Neighborhood Stadium'}
          </h1>
          <div className="flex items-center gap-3 text-xs tabular-nums text-slate-500 sm:text-sm">
            <span>{Math.round(zoom * 100)}%</span>
            <span className="text-slate-300">·</span>
            <span>
              {data.totalSeats.toLocaleString()} {isHe ? 'מושבים' : 'seats'}
            </span>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative flex min-h-0 flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
          style={{ backgroundColor: HATIKVA_CANVAS_BG }}
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
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.12s ease-out',
            }}
          >
            <svg
              ref={svgRef}
              viewBox={data.viewBox}
              className="block h-full w-full max-h-full max-w-full drop-shadow-sm"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="hatikva-grass-leaan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3d9142" />
                  <stop offset="45%" stopColor="#2d7a27" />
                  <stop offset="100%" stopColor="#1e5420" />
                </linearGradient>
                <pattern id="hatikva-grass-stripes" width={48} height={48} patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
                  <rect width={48} height={48} fill="#000" fillOpacity={0} />
                  <line x1={0} y1={0} x2={48} y2={0} stroke="#000" strokeWidth={14} strokeOpacity={0.045} />
                </pattern>
              </defs>
              <rect x={vbX} y={vbY} width={vbW} height={vbH} fill={HATIKVA_CANVAS_BG} />

              <g id="hatikva-pitch-leaan">
                <rect
                  x={pitch.fx}
                  y={pitch.fy}
                  width={pitch.fw}
                  height={pitch.fh}
                  rx={14}
                  fill="url(#hatikva-grass-leaan)"
                  stroke="#1b4d18"
                  strokeWidth={5}
                />
                <rect x={pitch.fx} y={pitch.fy} width={pitch.fw} height={pitch.fh} rx={14} fill="url(#hatikva-grass-stripes)" />

                {/* FIFA touchlines + 1 m corner arcs — inside grass pad */}
                <path
                  d={pitch.innerBoundaryPath}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={2.75}
                  strokeOpacity={0.94}
                  strokeLinejoin="round"
                />

                {/* Nets outside inner goal lines */}
                <g id="hatikva-goals" opacity={0.96}>
                  <rect
                    x={pitch.ix - pitch.netDepth}
                    y={pitch.icy - pitch.gmouthSpan / 2}
                    width={pitch.netDepth}
                    height={pitch.gmouthSpan}
                    rx={4}
                    fill="#d4dde8"
                    stroke="#94a3b8"
                    strokeWidth={2}
                  />
                  <rect
                    x={pitch.ix + pitch.iw}
                    y={pitch.icy - pitch.gmouthSpan / 2}
                    width={pitch.netDepth}
                    height={pitch.gmouthSpan}
                    rx={4}
                    fill="#d4dde8"
                    stroke="#94a3b8"
                    strokeWidth={2}
                  />
                  <line
                    x1={pitch.ix - pitch.netDepth}
                    y1={pitch.icy - pitch.gmouthSpan / 2}
                    x2={pitch.ix + pitch.netDepth * 0.15}
                    y2={pitch.icy - pitch.gmouthSpan / 2}
                    stroke={pitch.line}
                    strokeWidth={Math.max(5, pitch.postW)}
                    strokeLinecap="round"
                  />
                  <line
                    x1={pitch.ix - pitch.netDepth}
                    y1={pitch.icy + pitch.gmouthSpan / 2}
                    x2={pitch.ix + pitch.netDepth * 0.15}
                    y2={pitch.icy + pitch.gmouthSpan / 2}
                    stroke={pitch.line}
                    strokeWidth={Math.max(5, pitch.postW)}
                    strokeLinecap="round"
                  />
                  <line
                    x1={pitch.ix + pitch.iw - pitch.netDepth * 0.15}
                    y1={pitch.icy - pitch.gmouthSpan / 2}
                    x2={pitch.ix + pitch.iw + pitch.netDepth}
                    y2={pitch.icy - pitch.gmouthSpan / 2}
                    stroke={pitch.line}
                    strokeWidth={Math.max(5, pitch.postW)}
                    strokeLinecap="round"
                  />
                  <line
                    x1={pitch.ix + pitch.iw - pitch.netDepth * 0.15}
                    y1={pitch.icy + pitch.gmouthSpan / 2}
                    x2={pitch.ix + pitch.iw + pitch.netDepth}
                    y2={pitch.icy + pitch.gmouthSpan / 2}
                    stroke={pitch.line}
                    strokeWidth={Math.max(5, pitch.postW)}
                    strokeLinecap="round"
                  />
                </g>

                {/* Halfway line (vertical) — goals left & right */}
                <line
                  x1={pitch.icx}
                  y1={pitch.iy}
                  x2={pitch.icx}
                  y2={pitch.iy + pitch.ih}
                  stroke={pitch.line}
                  strokeWidth={2.5}
                  strokeOpacity={0.9}
                />

                <circle
                  cx={pitch.icx}
                  cy={pitch.icy}
                  r={pitch.centerR}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={2.5}
                  strokeOpacity={0.9}
                />
                <circle cx={pitch.icx} cy={pitch.icy} r={5} fill={pitch.line} fillOpacity={0.95} />

                <rect
                  x={pitch.ix}
                  y={pitch.icy - pitch.paSpan / 2}
                  width={pitch.paDepth}
                  height={pitch.paSpan}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={2}
                  strokeOpacity={0.88}
                />
                <rect
                  x={pitch.ix + pitch.iw - pitch.paDepth}
                  y={pitch.icy - pitch.paSpan / 2}
                  width={pitch.paDepth}
                  height={pitch.paSpan}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={2}
                  strokeOpacity={0.88}
                />

                <rect
                  x={pitch.ix}
                  y={pitch.icy - pitch.gaSpan / 2}
                  width={pitch.gaDepth}
                  height={pitch.gaSpan}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={1.8}
                  strokeOpacity={0.85}
                />
                <rect
                  x={pitch.ix + pitch.iw - pitch.gaDepth}
                  y={pitch.icy - pitch.gaSpan / 2}
                  width={pitch.gaDepth}
                  height={pitch.gaSpan}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={1.8}
                  strokeOpacity={0.85}
                />

                <line
                  x1={pitch.ix}
                  y1={pitch.icy - pitch.gmouthSpan / 2}
                  x2={pitch.ix}
                  y2={pitch.icy + pitch.gmouthSpan / 2}
                  stroke={pitch.line}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeOpacity={0.95}
                />
                <line
                  x1={pitch.ix + pitch.iw}
                  y1={pitch.icy - pitch.gmouthSpan / 2}
                  x2={pitch.ix + pitch.iw}
                  y2={pitch.icy + pitch.gmouthSpan / 2}
                  stroke={pitch.line}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeOpacity={0.95}
                />

                <circle cx={pitch.spotXL} cy={pitch.icy} r={5} fill={pitch.line} fillOpacity={0.95} />
                <circle cx={pitch.spotXR} cy={pitch.icy} r={5} fill={pitch.line} fillOpacity={0.95} />

                <path
                  d={pitch.penaltyArcLeft}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={2}
                  strokeOpacity={0.88}
                />
                <path
                  d={pitch.penaltyArcRight}
                  fill="none"
                  stroke={pitch.line}
                  strokeWidth={2}
                  strokeOpacity={0.88}
                />
              </g>

              {data.sections.map((section) => {
                const isSelected = selectedSection === section.idx;
                const isHovered = hoveredSection === section.idx;
                const fill = leaanSectionFill(section);
                const strokeColor = isSelected ? '#0f766e' : isHovered ? '#0d9488' : '#ffffff';
                return (
                  <path
                    key={section.idx}
                    data-section-path
                    d={section.d}
                    fill={fill}
                    fillOpacity={isSelected ? 1 : isHovered ? 0.92 : 0.88}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 6 : isHovered ? 4 : 2}
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

              {(() => {
                const { vip } = southStandGeom;
                const pad = 5;
                const gridL = vip.left + pad;
                const gridR = vip.aisleLeft - pad;
                const gridT = vip.y0 + pad;
                const gridB = vip.y1 - pad;
                const cols = 9;
                const rows = 19;
                const cw = (gridR - gridL) / cols;
                const ch = (gridB - gridT) / rows;
                const blockInteraction = (e: React.SyntheticEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                };
                const vipLabelPx = Math.max(20, (vip.y1 - vip.y0) * 0.11);
                const seatNodes: React.ReactNode[] = [];
                for (let r = 0; r < rows; r++) {
                  for (let c = 0; c < cols; c++) {
                    seatNodes.push(
                      <rect
                        key={`vip-s-${r}-${c}`}
                        x={gridL + c * cw + cw * 0.26}
                        y={gridT + r * ch + ch * 0.12}
                        width={cw * 0.48}
                        height={ch * 0.76}
                        rx={0.8}
                        fill="#8b909a"
                        fillOpacity={0.5}
                        style={{ pointerEvents: 'none' }}
                      />,
                    );
                  }
                }
                return (
                  <g id="hatikva-stand5-vip">
                    <rect
                      x={vip.left}
                      y={vip.y0}
                      width={vip.right - vip.left}
                      height={vip.y1 - vip.y0}
                      fill="#f4f6f8"
                      stroke="#94a3b8"
                      strokeWidth={1.2}
                      style={{ pointerEvents: 'none' }}
                    />
                    {seatNodes}
                    <rect
                      x={vip.aisleLeft}
                      y={vip.y0}
                      width={vip.right - vip.aisleLeft}
                      height={vip.y1 - vip.y0}
                      fill="#b8bcc6"
                      stroke="#8b92a1"
                      strokeWidth={1}
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={(vip.left + vip.aisleLeft) / 2}
                      y={vip.y0 + (vip.y1 - vip.y0) * 0.22}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#475569"
                      fontSize={vipLabelPx}
                      fontWeight="800"
                      fontFamily="system-ui,Segoe UI,sans-serif"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {isHe ? 'תא כבוד' : 'VIP box'}
                    </text>
                    <text
                      x={(vip.left + vip.aisleLeft) / 2}
                      y={vip.y0 + (vip.y1 - vip.y0) * 0.38}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#64748b"
                      fontSize={vipLabelPx * 0.55}
                      fontWeight="700"
                      fontFamily="system-ui,Segoe UI,sans-serif"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {isHe ? 'נעול' : 'Locked'}
                    </text>
                    <rect
                      data-stand5-vip-locked
                      x={vip.left}
                      y={vip.y0}
                      width={vip.right - vip.left}
                      height={vip.y1 - vip.y0}
                      fill="transparent"
                      cursor="not-allowed"
                      aria-label={isHe ? 'תא כבוד — לא ניתן לבחור מושבים' : 'VIP box — seats not selectable'}
                      onClick={blockInteraction}
                      onMouseDown={blockInteraction}
                      onTouchStart={blockInteraction}
                    />
                  </g>
                );
              })()}

              {zoom >= 0.6 &&
                data.sections.map((section) => {
                  const fontSize = sectionMapFontSize(section.seatCount);
                  const ls = leaanLabelStyle(section);
                  return (
                    <text
                      key={`label-${section.idx}`}
                      x={section.centroidX}
                      y={section.centroidY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={ls.fill}
                      fillOpacity={1}
                      stroke={ls.stroke}
                      strokeWidth={ls.strokeW}
                      strokeOpacity={ls.strokeOp}
                      paintOrder="stroke fill"
                      fontSize={fontSize}
                      fontWeight="800"
                      fontFamily="system-ui, 'Segoe UI', Arial, sans-serif"
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
                        <circle
                          cx={seat.cx}
                          cy={seat.cy}
                          r={12}
                          fill="#0d9488"
                          fillOpacity={0.22}
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                      <circle
                        data-seat-dot
                        cx={seat.cx}
                        cy={seat.cy}
                        r={isSel ? 6.5 : 4.5}
                        fill={leaanSeatDisplayFill(seat, data.sections)}
                        fillOpacity={isSel ? 1 : 0.92}
                        stroke={isSel ? '#0f766e' : '#5c5c5c'}
                        strokeWidth={isSel ? 2.2 : 0.85}
                        className="transition-[r,stroke-width] duration-150"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => handleSeatClick(e, seat)}
                      />
                    </g>
                  );
                })}

              {GATE_POSITIONS.map(({ gate, x, y, label }) => (
                <g key={gate}>
                  <rect
                    x={x - gateBadgePadX}
                    y={y - gateBadgePadY / 2}
                    width={gateBadgePadX * 2}
                    height={gateBadgePadY}
                    rx={vbW * 0.0016}
                    fill="#1e293b"
                    fillOpacity={0.97}
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
                    {label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div
            className="absolute bottom-3 left-1/2 z-[26] flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold leading-none text-slate-800 transition hover:bg-slate-200"
            >
              −
            </button>
            <div className="w-14 text-center font-mono text-xs text-slate-600 tabular-nums">{Math.round(zoom * 100)}%</div>
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold leading-none text-slate-800 transition hover:bg-slate-200"
            >
              +
            </button>
            <div className="mx-0.5 h-6 w-px bg-slate-200" />
            <button
              type="button"
              onClick={resetView}
              className="flex h-8 items-center rounded-lg bg-slate-100 px-2.5 text-xs font-medium text-slate-800 transition hover:bg-slate-200"
            >
              {isHe ? 'איפוס' : 'Reset'}
            </button>
          </div>

          {hoveredSection !== null && !panelSection && (() => {
            const hs = data.sections.find((s) => s.idx === hoveredSection);
            const hGate = hs && /^שער\s*\d/.test(hs.name.trim());
            return (
            <div className="pointer-events-none absolute start-3 top-3 z-20 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
              {hGate ? (isHe ? 'שער' : 'Gate') : isHe ? 'אזור' : 'Section'} {hs?.name} (
              {hs?.seatCount} {isHe ? 'מושבים' : 'seats'})
            </div>
            );
          })()}
        </div>
      </div>

      {panelSection && (
        <aside
          className="overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl p-0 shadow-xl sm:rounded-[1.25rem] [&_a]:no-underline"
          style={selectionPanelStyle}
          dir={isHe ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          role="complementary"
          aria-label={isHe ? 'סל בחירה — התקווה' : 'Selection — HaTikva'}
        >
          {/* Leaan-style peach header + section dot */}
          <div className="rounded-t-2xl border-b border-amber-900/10 bg-[#f0e4d8] px-4 py-3.5 sm:rounded-t-[1.25rem]">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-900/55">
              {isHe ? 'בחירת מושבים' : 'Seat selection'}
            </p>
            <div className="flex items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: leaanSectionFill(panelSection) }}
              />
              <span className="min-w-0 text-lg font-bold leading-snug text-slate-900">{panelSection.name}</span>
            </div>
          </div>

          <div className="border-t border-slate-200/80 bg-white px-4 py-4 sm:px-5">
            {(() => {
              const primary =
                selectedSeats.length > 0 ? selectedSeats[selectedSeats.length - 1]! : null;
              const lbl = primary ? seatLabels.get(seatKey(primary)) : null;
              const gateNum = hatikvaNearestGate(panelSection);
              const blockStr = hatikvaDisplayBlock(panelSection);
              const isGateArea = /^שער\s*\d/.test(panelSection.name.trim());
              const cells = [
                {
                  lab: isGateArea ? (isHe ? 'שער' : 'Gate') : isHe ? 'אזור' : 'Section',
                  val: panelSection.name,
                },
                { lab: isHe ? 'בלוק' : 'Block', val: blockStr },
                { lab: isHe ? 'שורה' : 'Row', val: lbl ? String(lbl.row) : '—' },
                { lab: isHe ? 'מושב' : 'Seat', val: lbl ? String(lbl.seat) : '—' },
                { lab: isHe ? 'שער' : 'Gate', val: String(gateNum) },
              ];
              return (
                <div className="mb-4 grid grid-cols-5 gap-0.5 border-b border-slate-200 pb-4 text-center sm:gap-1">
                  {cells.map((c) => (
                    <div key={c.lab} className="min-w-0 px-0.5">
                      <div className="mb-1 text-[10px] font-medium leading-tight text-slate-500 sm:text-[11px]">
                        {c.lab}
                      </div>
                      <div className="truncate text-sm font-extrabold tabular-nums text-slate-900 sm:text-base">
                        {c.val}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <p className="mb-4 text-center text-[11px] text-slate-500">
              {isHe ? 'מיקום ביציע' : 'Stand'} ·{' '}
              <span className="font-semibold capitalize text-slate-700">{panelSection.stand}</span>
              {' · '}
              {isHe ? 'קיבולת' : 'Cap.'}{' '}
              <span className="font-semibold tabular-nums text-slate-700">
                {panelSection.seatCount.toLocaleString()}
              </span>
            </p>

            {showSeats && selectedSeats.length > 1 && (
              <div className="mb-4 max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-2">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {isHe ? 'נבחרו' : 'Selected'} ({selectedSeats.length})
                </p>
                <ul className="space-y-1">
                  {selectedSeats.map((s) => {
                    const lbl = seatLabels.get(seatKey(s));
                    const t = lbl
                      ? isHe
                        ? `ש׳ ${lbl.row} · מ׳ ${lbl.seat}`
                        : `R${lbl.row} S${lbl.seat}`
                      : '—';
                    return (
                      <li
                        key={seatKey(s)}
                        className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1 text-[11px] text-slate-800"
                      >
                        <span className="tabular-nums">{t}</span>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-600"
                          aria-label={isHe ? 'הסר' : 'Remove'}
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
              </div>
            )}

            {showSeats && selectedSeats.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] leading-snug text-slate-500">
                  {isHe
                    ? 'המספר האחרון בשורה למעלה הוא המושב שנבחר לאחרונה (כמו באתר הרכישה).'
                    : 'The row above shows the last seat tapped, like the purchase flow.'}
                </p>
                {purchaseQuery ? (
                  <Link
                    href={`/${locale}/events?${purchaseQuery}`}
                    className="flex w-full items-center justify-center rounded-md bg-slate-700 px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-white shadow transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                  >
                    {isHe ? 'המשך לרכישה' : 'Continue to purchase'}
                  </Link>
                ) : (
                  <div className="rounded-md border-2 border-dashed border-slate-300 bg-slate-100 px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    {isHe ? 'בחרו מושבים' : 'Select seats'}
                  </div>
                )}
                <button
                  type="button"
                  className="w-full text-center text-[11px] font-semibold text-slate-500 underline-offset-2 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSeats([]);
                  }}
                >
                  {isHe ? 'נקה בחירת מושבים' : 'Clear seat selection'}
                </button>
              </div>
            )}

            {showSeats && selectedSeats.length === 0 && (
              <div className="mb-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-600">
                <p className="font-medium">
                  {isHe
                    ? 'בחרו מושבים במפה — הנקודות האפורות והחומות.'
                    : 'Pick seats on the map (grey and terracotta dots).'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isHe
                    ? 'Esc או פסים בצדי המסך חוזרים לכל האצטדיון.'
                    : 'Esc or side strips return to the full stadium.'}
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
