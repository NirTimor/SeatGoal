'use client';

import { useState, useEffect } from 'react';
import type { Event, Seat } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import {
  useEventSeats,
  useHoldSeats,
  useReleaseSeats,
} from '@/hooks/useSeats';
import SeatMapSkeleton from './SeatMapSkeleton';
import StadiumSeatMap from './StadiumSeatMap';

interface EventDetailsProps {
  event: Event;
  locale: string;
}

export default function EventDetails({ event, locale }: EventDetailsProps) {
  const { isSignedIn } = useAuth();
  const isHebrew = locale === 'he';

  // Use React Query hook for seats with automatic caching and refetching
  const {
    data: seatsData,
    isLoading: isLoadingSeats,
    error: seatsError,
  } = useEventSeats(event.id);

  // Mutations for hold/release with optimistic updates
  const holdMutation = useHoldSeats(event.id);
  const releaseMutation = useReleaseSeats(event.id);

  // All state hooks must be at the top before any conditional returns
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Timer countdown effect
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

  // Show skeleton while loading
  if (isLoadingSeats) {
    return <SeatMapSkeleton locale={locale} />;
  }

  // Show error state
  if (seatsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-600 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2">
              {isHebrew ? 'שגיאה בטעינת המושבים' : 'Error Loading Seats'}
            </h2>
            <p className="text-gray-600">
              {seatsError instanceof Error
                ? seatsError.message
                : isHebrew
                  ? 'לא ניתן לטעון את המושבים כרגע'
                  : 'Unable to load seats at this time'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              {isHebrew ? 'נסה שוב' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!seatsData) return null;

  const seats = seatsData.seats;

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

    setError(null);

    try {
      const result = await holdMutation.mutateAsync({
        seatIds: selectedSeats.map((s) => s.seatId),
        sessionId,
      });

      if (result.success) {
        setHoldExpiry(new Date(result.expiresAt));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to hold seats');
      setSelectedSeats([]);
    }
  };

  const handleReleaseSeats = async () => {
    if (!isSignedIn) return;

    try {
      await releaseMutation.mutateAsync({ sessionId });
      setSelectedSeats([]);
      setHoldExpiry(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + parseFloat(seat.price),
    0,
  );

  const isLoading = holdMutation.isPending || releaseMutation.isPending;

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

              {/* Stadium SVG Map */}
              <StadiumSeatMap
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                locale={locale}
                seatViewImages={event.stadium.seatViewImages as Record<string, string>}
              />
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
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded transition-colors duration-200 disabled:opacity-50"
                      >
                        {isLoading && releaseMutation.isPending
                          ? isHebrew
                            ? 'משחרר...'
                            : 'Releasing...'
                          : isHebrew
                            ? 'שחרר מושבים'
                            : 'Release Seats'}
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
                      disabled={isLoading || selectedSeats.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading && holdMutation.isPending ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {isHebrew ? 'מחזיק...' : 'Holding...'}
                        </>
                      ) : isHebrew ? (
                        'החזק מושבים'
                      ) : (
                        'Hold Seats'
                      )}
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
