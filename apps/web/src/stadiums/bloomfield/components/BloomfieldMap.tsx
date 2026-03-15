'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { buildRealBloomfieldData, GATE_POSITIONS } from '../data/stadiumData';
import type { RealSection } from '../data/stadiumData';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;

export default function BloomfieldMap() {
  const data = useMemo(() => buildRealBloomfieldData(), []);

  // ── State ──
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [infoPanelData, setInfoPanelData] = useState<RealSection | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDist = useRef<number | null>(null);

  // ── Zoom ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta * z * 0.3)));
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.3));

  // ── Pan (mouse) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  // ── Touch ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
  }, [isPanning, panStart]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDist.current = null;
  }, []);

  // ── Reset ──
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const clearSelection = () => { setSelectedSection(null); setInfoPanelData(null); };

  // ── Section click ──
  const handleSectionClick = useCallback((e: React.MouseEvent, section: RealSection) => {
    e.stopPropagation();
    setSelectedSection(section.idx);
    setInfoPanelData(section);
  }, []);

  // Show seats when zoomed in enough and a section is selected
  const showSeats = zoom >= 2.5;

  // Get seats for selected section
  const selectedSectionSeats = useMemo(() => {
    if (!showSeats || selectedSection === null) return [];
    const sec = data.sections[selectedSection];
    if (!sec) return [];
    return data.seats.filter(seat => seat.fill === sec.fill &&
      Math.abs(seat.cx - sec.centroidX) < 2000 &&
      Math.abs(seat.cy - sec.centroidY) < 2000
    );
  }, [showSeats, selectedSection, data]);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <h1 className="text-xl font-bold">Bloomfield Stadium</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Zoom: {Math.round(zoom * 100)}% | {data.totalSeats.toLocaleString()} seats
          </div>
        </div>
      </div>

      {/* Map viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={clearSelection}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.12s ease-out',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            viewBox={data.viewBox}
            className="w-full h-full"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect x="2293" y="1644" width="11833" height="11483" fill="#e8e8e8" />

            {/* Stadium outer shape (decorative shadow for depth) */}
            <ellipse cx={data.fieldCenter.x} cy={data.fieldCenter.y} rx={6200} ry={5800}
              fill="#d0d0d0" fillOpacity={0.3} stroke="#ccc" strokeWidth="8" />

            {/* Football field */}
            <rect x="5800" y="4800" width="4800" height="5200" rx="80"
              fill="#4caf50" stroke="#388e3c" strokeWidth="8" />
            <rect x="5800" y="4800" width="4800" height="5200" rx="80"
              fill="none" stroke="#fff" strokeWidth="4" />
            <line x1="8200" y1="4800" x2="8200" y2="10000" stroke="#fff" strokeWidth="3" />
            <circle cx="8200" cy="7400" r="500" fill="none" stroke="#fff" strokeWidth="3" />
            <circle cx="8200" cy="7400" r="8" fill="#fff" />
            <rect x="5800" y="6200" width="800" height="2400" fill="none" stroke="#fff" strokeWidth="2" />
            <rect x="9800" y="6200" width="800" height="2400" fill="none" stroke="#fff" strokeWidth="2" />
            <rect x="5800" y="6800" width="350" height="1200" fill="none" stroke="#fff" strokeWidth="2" />
            <rect x="10250" y="6800" width="350" height="1200" fill="none" stroke="#fff" strokeWidth="2" />

            {/* Section paths */}
            {data.sections.map((section) => {
              const isSelected = selectedSection === section.idx;
              const isHovered = hoveredSection === section.idx;
              const strokeColor = isSelected ? '#000000' : isHovered ? '#222222' : section.fill;
              return (
                <path
                  key={section.idx}
                  d={section.d}
                  fill={section.fill}
                  fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 20 : isHovered ? 14 : 4}
                  strokeOpacity={isSelected ? 1 : isHovered ? 0.8 : 0.4}
                  className="transition-all duration-150"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSection(section.idx)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={(e) => handleSectionClick(e, section)}
                />
              );
            })}

            {/* Section labels */}
            {zoom >= 0.6 && data.sections.map((section) => {
              if (section.seatCount < 30) return null;
              const sizeScale = Math.sqrt(section.seatCount) / 15;
              const fontSize = Math.max(60, Math.min(180, sizeScale * 100));
              return (
                <text
                  key={`label-${section.idx}`}
                  x={section.centroidX}
                  y={section.centroidY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fillOpacity={0.6}
                  fontSize={fontSize}
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {section.name}
                </text>
              );
            })}

            {/* Seats (only when zoomed in and section selected) */}
            {showSeats && selectedSectionSeats.map((seat, i) => (
              <circle
                key={i}
                cx={seat.cx}
                cy={seat.cy}
                r={12}
                fill={seat.fill}
                fillOpacity={0.8}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}

            {/* Gate labels */}
            {GATE_POSITIONS.map(({ gate, x, y, label }) => (
              <g key={gate}>
                <rect x={x - 250} y={y - 80} width={500} height={160} rx={30}
                  fill="#8B0000" fillOpacity={0.9} />
                <text x={x} y={y + 20} textAnchor="middle" fill="white"
                  fontSize={100} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                  {label}
                </text>
              </g>
            ))}

            {/* VIP label */}
            <g>
              <rect x={8800} y={2050} width={400} height={150} rx={30}
                fill="#8B0000" fillOpacity={0.9} />
              <text x={9000} y={2150} textAnchor="middle" fill="white"
                fontSize={100} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                VIP
              </text>
            </g>
          </svg>
        </div>

        {/* Info panel */}
        {infoPanelData && (
          <div className="absolute top-6 right-6 w-80 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-2xl p-6 z-30 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm uppercase tracking-wider text-gray-400 mb-1">Section</div>
                <h3 className="text-2xl font-bold text-white">{infoPanelData.name}</h3>
              </div>
              <button
                onClick={clearSelection}
                className="text-gray-500 hover:text-white text-2xl leading-none transition p-1"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3 text-base border-t border-gray-700 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Stand</span>
                <span className="text-white capitalize">{infoPanelData.stand}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Color</span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: infoPanelData.fill }} />
                  <span className="text-white">{infoPanelData.fill}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seats</span>
                <span className="text-white font-medium">{infoPanelData.seatCount.toLocaleString()}</span>
              </div>
            </div>
            {zoom < 2.5 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Zoom in more to see individual seats
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-xl px-4 py-2 z-20 shadow-xl">
          <button
            onClick={zoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition"
          >
            -
          </button>
          <div className="w-16 text-center text-sm text-gray-300 font-mono">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={zoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition"
          >
            +
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button
            onClick={resetView}
            className="px-3 h-8 flex items-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs transition"
          >
            Reset
          </button>
          {selectedSection !== null && (
            <button
              onClick={clearSelection}
              className="px-3 h-8 flex items-center rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Hover tooltip */}
        {hoveredSection !== null && !infoPanelData && (
          <div className="absolute top-4 left-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-1.5 z-20 pointer-events-none text-sm">
            Section {data.sections[hoveredSection]?.name} ({data.sections[hoveredSection]?.seatCount} seats)
          </div>
        )}
      </div>
    </div>
  );
}
