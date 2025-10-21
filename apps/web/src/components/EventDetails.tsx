'use client';

import { useState, useEffect } from 'react';
import type { Event, EventSeats, Seat } from '@/lib/api';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

interface EventDetailsProps {
  event: Event;
  seatsData: EventSeats;
  locale: string;
}

export default function EventDetails({
  event,
  seatsData,
  locale,
}: EventDetailsProps) {
  const { getToken, isSignedIn } = useAuth();
  const isHebrew = locale === 'he';

  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group seats by section
  const seatsBySection = seatsData.seats.reduce(
    (acc, seat) => {
      if (!acc[seat.section]) {
        acc[seat.section] = [];
      }
      acc[seat.section].push(seat);
      return acc;
    },
    {} as Record<string, Seat[]>,
  );

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.seatId === seat.seatId);
      if (isSelected) {
        return prev.filter((s) => s.seatId !== seat.seatId);
      } else {
        if (prev.length >= 10) {
          setError(
            isHebrew
              ? 'ניתן לבחור עד 10 מושבים בלבד'
              : 'Maximum 10 seats can be selected',
          );
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const handleHoldSeats = async () => {
    if (selectedSeats.length === 0) return;

    if (!isSignedIn) {
      setError(
        isHebrew
          ? 'יש להתחבר כדי להחזיק מושבים'
          : 'Please sign in to hold seats',
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const result = await api.holdSeats(
        event.id,
        selectedSeats.map((s) => s.seatId),
        sessionId,
        token || undefined,
      );

      if (result.data.success) {
        setHoldExpiry(new Date(result.data.expiresAt));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to hold seats');
      setSelectedSeats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseSeats = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    try {
      const token = await getToken();
      await api.releaseHold(event.id, sessionId, token || undefined);
      setSelectedSeats([]);
      setHoldExpiry(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!holdExpiry) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = holdExpiry.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining(0);
        setHoldExpiry(null);
        setSelectedSeats([]);
      } else {
        setTimeRemaining(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiry]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + parseFloat(seat.price),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">
            {isHebrew
              ? `${event.homeTeamHe} נגד ${event.awayTeamHe}`
              : `${event.homeTeam} vs ${event.awayTeam}`}
          </h1>
          <div className="flex flex-wrap gap-4 text-lg">
            <span>
              📍{' '}
              {isHebrew
                ? `${event.stadium.nameHe}, ${event.stadium.cityHe}`
                : `${event.stadium.name}, ${event.stadium.city}`}
            </span>
            <span>
              📅{' '}
              {new Date(event.eventDate).toLocaleDateString(
                isHebrew ? 'he-IL' : 'en-US',
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                {isHebrew ? 'בחר מושבים' : 'Select Seats'}
              </h2>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded mr-2"></div>
                  <span>{isHebrew ? 'פנוי' : 'Available'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded mr-2"></div>
                  <span>{isHebrew ? 'נבחר' : 'Selected'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded mr-2"></div>
                  <span>{isHebrew ? 'מוחזק' : 'Held'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-400 rounded mr-2"></div>
                  <span>{isHebrew ? 'נמכר' : 'Sold'}</span>
                </div>
              </div>

              {/* Seats Grid by Section */}
              <div className="space-y-8">
                {Object.entries(seatsBySection).map(([section, seats]) => (
                  <div key={section}>
                    <h3 className="text-xl font-semibold mb-3">
                      {isHebrew ? 'אזור' : 'Section'} {section}
                    </h3>

                    {/* Group by row */}
                    {Object.entries(
                      seats.reduce(
                        (acc, seat) => {
                          if (!acc[seat.row]) acc[seat.row] = [];
                          acc[seat.row].push(seat);
                          return acc;
                        },
                        {} as Record<string, Seat[]>,
                      ),
                    ).map(([row, rowSeats]) => (
                      <div key={row} className="mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 w-12">
                            {isHebrew ? 'שורה' : 'Row'} {row}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {rowSeats
                              .sort(
                                (a, b) =>
                                  parseInt(a.number) - parseInt(b.number),
                              )
                              .map((seat) => {
                                const isSelected = selectedSeats.some(
                                  (s) => s.seatId === seat.seatId,
                                );
                                return (
                                  <button
                                    key={seat.seatId}
                                    onClick={() => handleSeatClick(seat)}
                                    disabled={
                                      seat.status !== 'AVAILABLE' || !!holdExpiry
                                    }
                                    className={`w-10 h-10 text-xs font-semibold rounded transition-all ${
                                      isSelected
                                        ? 'bg-blue-500 text-white scale-110'
                                        : seat.status === 'AVAILABLE'
                                          ? 'bg-green-500 text-white hover:scale-110 hover:bg-green-600'
                                          : seat.status === 'HELD'
                                            ? 'bg-yellow-500 text-white cursor-not-allowed'
                                            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    }`}
                                    title={`${section}-${row}-${seat.number} (${seat.price} ILS)`}
                                  >
                                    {seat.number}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">
                {isHebrew ? 'סל קניות' : 'Shopping Cart'}
              </h3>

              {selectedSeats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {isHebrew ? 'לא נבחרו מושבים' : 'No seats selected'}
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {selectedSeats.map((seat) => (
                      <div
                        key={seat.seatId}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">
                          {seat.section}-{seat.row}-{seat.number}
                        </span>
                        <span className="font-semibold">₪{seat.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>{isHebrew ? 'סה"כ' : 'Total'}</span>
                      <span>₪{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {holdExpiry ? (
                    <>
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-4 mb-4">
                        <p className="text-sm text-yellow-800 mb-2">
                          {isHebrew
                            ? 'מושבים מוחזקים עבורך'
                            : 'Seats held for you'}
                        </p>
                        <div className="text-2xl font-bold text-yellow-900 text-center">
                          {formatTime(timeRemaining)}
                        </div>
                      </div>

                      <button
                        onClick={handleReleaseSeats}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded transition-colors duration-200 disabled:opacity-50"
                      >
                        {isHebrew ? 'שחרר מושבים' : 'Release Seats'}
                      </button>

                      <a
                        href={`/${locale}/checkout?event=${event.id}&session=${sessionId}`}
                        className="block w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition-colors duration-200 text-center"
                      >
                        {isHebrew ? 'המשך לתשלום' : 'Proceed to Checkout'}
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={handleHoldSeats}
                      disabled={loading || selectedSeats.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors duration-200 disabled:opacity-50"
                    >
                      {loading
                        ? isHebrew
                          ? 'מחזיק...'
                          : 'Holding...'
                        : isHebrew
                          ? 'החזק מושבים'
                          : 'Hold Seats'}
                    </button>
                  )}
                </>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
