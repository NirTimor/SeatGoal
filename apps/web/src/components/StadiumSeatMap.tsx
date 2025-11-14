'use client';

import { useMemo, useState } from 'react';
import type { Seat } from '@/lib/api';

interface StadiumSeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSeatClick: (seat: Seat) => void;
  locale: string;
  seatViewImages?: Record<string, string>;
}

interface GateGroup {
  gate: string;
  seats: Seat[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export default function StadiumSeatMap({
  seats,
  selectedSeats,
  onSeatClick,
  locale,
  seatViewImages = {},
}: StadiumSeatMapProps) {
  const isHebrew = locale === 'he';
  const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);
  const [selectedPriceZones, setSelectedPriceZones] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [viewImageSection, setViewImageSection] = useState<string | null>(null);

  // Group seats by gate and calculate bounds
  const gateGroups = useMemo(() => {
    const groups = new Map<string, GateGroup>();

    // Filter seats based on accessibility and price zone filters
    const filteredSeats = seats.filter((seat) => {
      if (showAccessibleOnly && !seat.isAccessible) return false;
      if (selectedPriceZones.length > 0 && !selectedPriceZones.includes(seat.priceZone)) return false;
      return true;
    });

    filteredSeats.forEach((seat) => {
      if (!seat.x || !seat.y) return;

      if (!groups.has(seat.section)) {
        groups.set(seat.section, {
          gate: seat.section,
          seats: [],
          minX: seat.x,
          maxX: seat.x,
          minY: seat.y,
          maxY: seat.y,
        });
      }

      const group = groups.get(seat.section)!;
      group.seats.push(seat);
      group.minX = Math.min(group.minX, seat.x);
      group.maxX = Math.max(group.maxX, seat.x);
      group.minY = Math.min(group.minY, seat.y);
      group.maxY = Math.max(group.maxY, seat.y);
    });

    return Array.from(groups.values());
  }, [seats, showAccessibleOnly, selectedPriceZones]);

  // Get price zone colors
  const getPriceZoneColor = (priceZone: string) => {
    switch (priceZone) {
      case 'VIP': return '#9333ea'; // Purple
      case 'PREMIUM': return '#3b82f6'; // Blue
      case 'STANDARD': return '#10b981'; // Green
      case 'ECONOMY': return '#f59e0b'; // Orange
      default: return '#10b981';
    }
  };

  // Get seat status styling
  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) return '#3b82f6'; // Blue - selected
    if (seat.status === 'SOLD') return '#9ca3af'; // Gray - sold
    if (seat.status === 'HELD') return '#eab308'; // Yellow - held
    return getPriceZoneColor(seat.priceZone); // Color by price zone
  };

  const getSeatOpacity = (seat: Seat) => {
    if (seat.status === 'SOLD') return 0.4;
    if (seat.status === 'HELD') return 0.6;
    return 1;
  };

  const canSelectSeat = (seat: Seat) => {
    return seat.status === 'AVAILABLE';
  };

  // Gate label positions (Hebrew labels)
  const getGateLabel = (gate: string) => {
    const match = gate.match(/Gate (\d+)/);
    if (match) {
      return `שער ${match[1]}`;
    }
    return gate;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        {/* Accessibility Filter */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAccessibleOnly}
            onChange={(e) => setShowAccessibleOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">♿ {isHebrew ? 'נגישות בלבד' : 'Accessible Only'}</span>
        </label>

        {/* Price Zone Filters */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">{isHebrew ? 'סוג מושב:' : 'Price Zone:'}</span>
          {['VIP', 'PREMIUM', 'STANDARD', 'ECONOMY'].map((zone) => (
            <label key={zone} className="flex items-center gap-1 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={selectedPriceZones.includes(zone)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPriceZones([...selectedPriceZones, zone]);
                  } else {
                    setSelectedPriceZones(selectedPriceZones.filter((z) => z !== zone));
                  }
                }}
                className="w-3 h-3 rounded"
              />
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getPriceZoneColor(zone) }}
              ></div>
              <span>{zone}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 justify-center text-sm border-t pt-3">
        <div className="font-medium">{isHebrew ? 'מצב מושב:' : 'Seat Status:'}</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-600 rounded"></div>
          <span>{isHebrew ? 'VIP' : 'VIP'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>{isHebrew ? 'פרימיום' : 'Premium'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>{isHebrew ? 'רגיל' : 'Standard'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>{isHebrew ? 'חסכוני' : 'Economy'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>{isHebrew ? 'בהמתנה' : 'Held'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>{isHebrew ? 'תפוס' : 'Sold'}</span>
        </div>
      </div>

      {/* Stadium SVG */}
      <div className="w-full overflow-auto" style={{ maxHeight: '70vh' }}>
        <svg
          viewBox="0 0 1000 800"
          className="w-full h-auto"
          style={{ minHeight: '500px' }}
        >
          {/* Stadium Background */}
          <rect x="0" y="0" width="1000" height="800" fill="#f3f4f6" />

          {/* Football Field */}
          <rect
            x="200"
            y="150"
            width="600"
            height="500"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="3"
            rx="10"
          />

          {/* Center Circle */}
          <circle cx="500" cy="400" r="60" fill="none" stroke="#16a34a" strokeWidth="2" />
          <circle cx="500" cy="400" r="3" fill="#16a34a" />

          {/* Penalty Boxes */}
          <rect x="200" y="250" width="80" height="300" fill="none" stroke="#16a34a" strokeWidth="2" />
          <rect x="720" y="250" width="80" height="300" fill="none" stroke="#16a34a" strokeWidth="2" />

          {/* Goal Areas */}
          <rect x="200" y="325" width="30" height="150" fill="none" stroke="#16a34a" strokeWidth="2" />
          <rect x="770" y="325" width="30" height="150" fill="none" stroke="#16a34a" strokeWidth="2" />

          {/* Midfield Line */}
          <line x1="500" y1="150" x2="500" y2="650" stroke="#16a34a" strokeWidth="2" />

          {/* Gate Groups */}
          {gateGroups.map((group) => (
            <g key={group.gate}>
              {/* Gate Label */}
              <text
                x={(group.minX + group.maxX) / 2}
                y={group.minY - 10}
                textAnchor="middle"
                fill="#374151"
                fontSize="14"
                fontWeight="bold"
              >
                {getGateLabel(group.gate)}
              </text>

              {/* View button for sections with images */}
              {seatViewImages[group.gate] && (
                <g>
                  <rect
                    x={(group.minX + group.maxX) / 2 - 20}
                    y={group.minY - 30}
                    width="40"
                    height="15"
                    fill="#3b82f6"
                    rx="3"
                    className="cursor-pointer hover:fill-blue-700"
                    onClick={() => setViewImageSection(group.gate)}
                  />
                  <text
                    x={(group.minX + group.maxX) / 2}
                    y={group.minY - 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="8"
                    fontWeight="bold"
                    className="cursor-pointer pointer-events-none"
                  >
                    {isHebrew ? 'תצוגה' : 'View'}
                  </text>
                </g>
              )}

              {/* Section Background */}
              <rect
                x={group.minX - 5}
                y={group.minY - 5}
                width={group.maxX - group.minX + 10}
                height={group.maxY - group.minY + 10}
                fill="white"
                fillOpacity="0.3"
                stroke="#d1d5db"
                strokeWidth="1"
                rx="5"
              />

              {/* Individual Seats */}
              {group.seats.map((seat) => {
                if (!seat.x || !seat.y) return null;

                const isClickable = canSelectSeat(seat);
                const color = getSeatColor(seat);
                const opacity = getSeatOpacity(seat);

                return (
                  <g key={seat.id}>
                    <circle
                      cx={seat.x}
                      cy={seat.y}
                      r="2"
                      fill={color}
                      opacity={opacity}
                      className={isClickable ? 'cursor-pointer hover:stroke-black hover:stroke-2' : 'cursor-not-allowed'}
                      onClick={() => isClickable && onSeatClick(seat)}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <title>
                        {`${seat.section} - ${isHebrew ? 'שורה' : 'Row'} ${seat.row}, ${isHebrew ? 'מושב' : 'Seat'} ${seat.number} - ${seat.priceZone} - ₪${seat.price}${seat.isAccessible ? ' ♿' : ''}`}
                      </title>
                    </circle>
                    {/* Accessibility icon */}
                    {seat.isAccessible && (
                      <text
                        x={seat.x}
                        y={seat.y + 1}
                        fontSize="3"
                        textAnchor="middle"
                        fill="white"
                        className="pointer-events-none"
                      >
                        ♿
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Field Label */}
          <text
            x="500"
            y="410"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="bold"
            opacity="0.3"
          >
            {isHebrew ? 'מגרש' : 'FIELD'}
          </text>

          {/* Stand Labels */}
          <text x="120" y="400" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="bold" transform="rotate(-90, 120, 400)">
            {isHebrew ? 'יציע מערב' : 'WEST'}
          </text>
          <text x="880" y="400" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="bold" transform="rotate(90, 880, 400)">
            {isHebrew ? 'יציע מזרח' : 'EAST'}
          </text>
          <text x="500" y="120" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="bold">
            {isHebrew ? 'יציע צפון' : 'NORTH'}
          </text>
          <text x="500" y="760" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="bold">
            {isHebrew ? 'יציע דרום' : 'SOUTH'}
          </text>
        </svg>
      </div>

      {/* Mobile/Zoom Instructions */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {isHebrew ? 'גלול להגדלה או הקטנה' : 'Scroll to zoom in/out'}
      </div>

      {/* Seat View Modal */}
      {viewImageSection && seatViewImages[viewImageSection] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setViewImageSection(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {isHebrew ? `תצוגה מ${getGateLabel(viewImageSection)}` : `View from ${viewImageSection}`}
              </h3>
              <button
                onClick={() => setViewImageSection(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <img
              src={seatViewImages[viewImageSection]}
              alt={`View from ${viewImageSection}`}
              className="w-full h-auto rounded"
            />
            <div className="mt-4 text-sm text-gray-600">
              {isHebrew
                ? 'זוהי תצוגה מייצגת מהסקציה הזו'
                : 'This is a representative view from this section'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
