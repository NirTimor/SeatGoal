'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { buildRealHatikvaData, GATE_POSITIONS } from '../data/stadiumData';
import type { RealSection, RealSeat } from '../data/stadiumData';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;
const FOCUS_SCREEN_FR = 0.75;

const FRIENDLY_FILL: Record<string, string> = {
  '#c45100': '#c97d62',
  '#666666': '#8b9099',
};

function friendlyFill(hex: string): string {
  return FRIENDLY_FILL[hex.toLowerCase()] ?? hex;
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

const fieldCx = 4113;
const fieldCy = 2900;
const fieldW = 5200;
const fieldH = 1500;

export default function HaTikvaMap() {
  const locale = useLocale();
  const data = useMemo(() => buildRealHatikvaData(), []);

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
    const b = path.getBBox();
    setSelectedSeats([]);
    setSelectedSection(section.idx);
    setInfoPanelData(section);

    const runFit = () => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;
      const cr = container.getBoundingClientRect();
      const m = svg.getScreenCTM();
      if (!m) return;

      const toScr = (ux: number, uy: number) => {
        const pt = svg.createSVGPoint();
        pt.x = ux;
        pt.y = uy;
        return pt.matrixTransform(m);
      };
      const scr = [
        toScr(b.x, b.y),
        toScr(b.x + b.width, b.y),
        toScr(b.x + b.width, b.y + b.height),
        toScr(b.x, b.y + b.height),
      ];
      const wScr = Math.max(1, Math.max(...scr.map((p) => p.x)) - Math.min(...scr.map((p) => p.x)));
      const hScr = Math.max(1, Math.max(...scr.map((p) => p.y)) - Math.min(...scr.map((p) => p.y)));

      const zMul = Math.min((FOCUS_SCREEN_FR * cr.width) / wScr, (FOCUS_SCREEN_FR * cr.height) / hScr);
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * zMul)));

      const runCenter = () => {
        const m2 = svg.getScreenCTM();
        if (!m2) return;
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        const p = svg.createSVGPoint();
        p.x = cx;
        p.y = cy;
        const sp = p.matrixTransform(m2);
        const ccx = cr.left + cr.width / 2;
        const ccy = cr.top + cr.height / 2;
        setPan((pp) => ({ x: pp.x + (ccx - sp.x), y: pp.y + (ccy - sp.y) }));
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

  return (
    <>
      <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#eef1f6] text-slate-800">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-sm">
          <h1 className="text-base font-semibold tracking-tight text-slate-800">HaTikva Neighborhood Stadium</h1>
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
          className="relative flex min-h-0 flex-1 cursor-grab overflow-hidden bg-[#e4e9f2] active:cursor-grabbing"
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
                <linearGradient id="hatikva-grass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6cbd6e" />
                  <stop offset="100%" stopColor="#4a9d55" />
                </linearGradient>
              </defs>
              <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="#e8ecf2" />

              <rect
                x={fieldCx - fieldW / 2}
                y={fieldCy - fieldH / 2}
                width={fieldW}
                height={fieldH}
                rx={10}
                fill="url(#hatikva-grass)"
                stroke="#3d7a46"
                strokeWidth={3}
              />
              <rect
                x={fieldCx - fieldW / 2}
                y={fieldCy - fieldH / 2}
                width={fieldW}
                height={fieldH}
                rx={10}
                fill="none"
                stroke="#e8f5e9"
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
              <line
                x1={fieldCx}
                y1={fieldCy - fieldH / 2}
                x2={fieldCx}
                y2={fieldCy + fieldH / 2}
                stroke="#e8f5e9"
                strokeWidth={1}
                strokeOpacity={0.9}
              />
              <circle
                cx={fieldCx}
                cy={fieldCy}
                r={200}
                fill="none"
                stroke="#e8f5e9"
                strokeWidth={1}
                strokeOpacity={0.9}
              />
              <circle cx={fieldCx} cy={fieldCy} r={5} fill="#e8f5e9" fillOpacity={0.95} />
              <rect
                x={fieldCx - fieldW / 2}
                y={fieldCy - 300}
                width={500}
                height={600}
                fill="none"
                stroke="#e8f5e9"
                strokeWidth={0.8}
                strokeOpacity={0.85}
              />
              <rect
                x={fieldCx + fieldW / 2 - 500}
                y={fieldCy - 300}
                width={500}
                height={600}
                fill="none"
                stroke="#e8f5e9"
                strokeWidth={0.8}
                strokeOpacity={0.85}
              />
              <rect
                x={fieldCx - fieldW / 2}
                y={fieldCy - 150}
                width={200}
                height={300}
                fill="none"
                stroke="#e8f5e9"
                strokeWidth={0.8}
                strokeOpacity={0.85}
              />
              <rect
                x={fieldCx + fieldW / 2 - 200}
                y={fieldCy - 150}
                width={200}
                height={300}
                fill="none"
                stroke="#e8f5e9"
                strokeWidth={0.8}
                strokeOpacity={0.85}
              />

              {data.sections.map((section) => {
                const isSelected = selectedSection === section.idx;
                const isHovered = hoveredSection === section.idx;
                const fill = friendlyFill(section.fill);
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

              {zoom >= 0.6 &&
                data.sections.map((section) => {
                  const fontSize = Math.max(20, Math.min(80, (Math.sqrt(section.seatCount) / 8) * 30));
                  return (
                    <text
                      key={`label-${section.idx}`}
                      x={section.centroidX}
                      y={section.centroidY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#1e293b"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={fontSize * 0.06}
                      strokeOpacity={0.45}
                      paintOrder="stroke fill"
                      fontSize={fontSize}
                      fontWeight="600"
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
                        r={isSel ? 6 : 4}
                        fill={friendlyFill(seat.fill)}
                        fillOpacity={isSel ? 1 : 0.88}
                        stroke={isSel ? '#0f766e' : '#fff'}
                        strokeWidth={isSel ? 2 : 1}
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
                  <rect x={x - 80} y={y - 28} width={160} height={56} rx={10} fill="#475569" fillOpacity={0.92} />
                  <text
                    x={x}
                    y={y + 7}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize={30}
                    fontWeight="600"
                    fontFamily="system-ui,Segoe UI,sans-serif"
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
            {selectedSection !== null && (
              <button
                type="button"
                onClick={clearSelection}
                className="flex h-8 items-center rounded-lg bg-rose-100 px-2.5 text-xs font-medium text-rose-900 transition hover:bg-rose-200"
              >
                {isHe ? 'סגור' : 'Close'}
              </button>
            )}
          </div>

          {hoveredSection !== null && !panelSection && (
            <div className="pointer-events-none absolute start-3 top-3 z-20 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-700 shadow-md">
              {isHe ? 'אזור' : 'Section'} {data.sections.find((s) => s.idx === hoveredSection)?.name} (
              {data.sections.find((s) => s.idx === hoveredSection)?.seatCount} {isHe ? 'מושבים' : 'seats'})
            </div>
          )}
        </div>
      </div>

      {panelSection && (
        <aside
          className="overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl p-0 backdrop-blur-sm sm:rounded-[1.25rem] [&_a]:no-underline"
          style={selectionPanelStyle}
          dir={isHe ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          role="complementary"
          aria-label={isHe ? 'סל בחירה — התקווה' : 'Selection — HaTikva'}
        >
          <div className="h-1.5 rounded-t-2xl bg-gradient-to-l from-teal-500 via-emerald-500 to-cyan-500 sm:rounded-t-[1.25rem]" aria-hidden />

          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-teal-800/80">
                  {isHe ? 'בחירת מושבים' : 'Seat selection'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex max-w-full min-w-0 items-center break-words rounded-lg px-3 py-1 text-lg font-bold leading-snug tabular-nums shadow-md shadow-teal-900/25"
                    style={{ backgroundColor: '#0f766e', color: '#ffffff' }}
                  >
                    {panelSection.name}
                  </span>
                  <span className="text-xs font-medium capitalize text-slate-800">{panelSection.stand}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-xl leading-none text-slate-600 transition hover:bg-slate-300 hover:text-slate-900"
                aria-label={isHe ? 'סגור' : 'Close'}
              >
                &times;
              </button>
            </div>

            <dl className="space-y-0 rounded-xl border border-slate-200/90 bg-white/70 text-sm shadow-inner shadow-slate-900/5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
                <dt className="text-slate-500">{isHe ? 'יציע' : 'Stand'}</dt>
                <dd className="font-semibold capitalize text-slate-800">{panelSection.stand}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
                <dt className="shrink-0 text-slate-500">{isHe ? 'צבע האזור' : 'Zone color'}</dt>
                <dd className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white ring-offset-1 ring-offset-slate-100"
                    style={{ backgroundColor: friendlyFill(panelSection.fill) }}
                  />
                  <span className="truncate font-mono text-xs text-slate-600">{friendlyFill(panelSection.fill)}</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-slate-500">{isHe ? 'מושבים באזור' : 'Capacity'}</dt>
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
                    : 'Row numbers treat one row with a gap as a single row.'}
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
          </div>
        </aside>
      )}
    </>
  );
}
