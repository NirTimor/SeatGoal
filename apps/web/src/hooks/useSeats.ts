'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type EventSeats, type Seat } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

/**
 * Hook to fetch event seats with caching
 * Stale time is 1 minute to match backend cache
 */
export function useEventSeats(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId, 'seats'],
    queryFn: async () => {
      const response = await api.getEventSeats(eventId);
      return response.data;
    },
    // Seats change frequently, so shorter stale time
    staleTime: 60 * 1000, // 1 minute
    // Refetch on window focus to get latest availability
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to hold seats with optimistic updates
 */
export function useHoldSeats(eventId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      seatIds,
      sessionId,
    }: {
      seatIds: string[];
      sessionId: string;
    }) => {
      const token = await getToken();
      const response = await api.holdSeats(
        eventId,
        seatIds,
        sessionId,
        token || undefined,
      );
      return response.data;
    },
    // Optimistic update: immediately mark seats as HELD in the cache
    onMutate: async ({ seatIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['event', eventId, 'seats'],
      });

      // Snapshot the previous value
      const previousSeats = queryClient.getQueryData<EventSeats>([
        'event',
        eventId,
        'seats',
      ]);

      // Optimistically update to HELD status
      if (previousSeats) {
        queryClient.setQueryData<EventSeats>(['event', eventId, 'seats'], {
          ...previousSeats,
          seats: previousSeats.seats.map((seat) =>
            seatIds.includes(seat.seatId)
              ? { ...seat, status: 'HELD' as const }
              : seat,
          ),
          availableSeats: previousSeats.availableSeats - seatIds.length,
        });
      }

      return { previousSeats };
    },
    // If mutation fails, rollback to previous state
    onError: (err, variables, context) => {
      if (context?.previousSeats) {
        queryClient.setQueryData(
          ['event', eventId, 'seats'],
          context.previousSeats,
        );
      }
    },
    // Always refetch after success to get the actual server state
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', eventId, 'seats'],
      });
    },
  });
}

/**
 * Hook to release held seats with optimistic updates
 */
export function useReleaseSeats(eventId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const token = await getToken();
      const response = await api.releaseHold(
        eventId,
        sessionId,
        token || undefined,
      );
      return response.data;
    },
    // Optimistic update: immediately mark held seats as AVAILABLE
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['event', eventId, 'seats'],
      });

      const previousSeats = queryClient.getQueryData<EventSeats>([
        'event',
        eventId,
        'seats',
      ]);

      // Optimistically update held seats back to AVAILABLE
      if (previousSeats) {
        const heldSeatsCount = previousSeats.seats.filter(
          (seat) => seat.status === 'HELD',
        ).length;

        queryClient.setQueryData<EventSeats>(['event', eventId, 'seats'], {
          ...previousSeats,
          seats: previousSeats.seats.map((seat) =>
            seat.status === 'HELD'
              ? { ...seat, status: 'AVAILABLE' as const }
              : seat,
          ),
          availableSeats: previousSeats.availableSeats + heldSeatsCount,
        });
      }

      return { previousSeats };
    },
    onError: (err, variables, context) => {
      if (context?.previousSeats) {
        queryClient.setQueryData(
          ['event', eventId, 'seats'],
          context.previousSeats,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', eventId, 'seats'],
      });
    },
  });
}

/**
 * Hook to extend hold time
 */
export function useExtendHold(eventId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const token = await getToken();
      const response = await api.extendHold(
        eventId,
        sessionId,
        token || undefined,
      );
      return response.data;
    },
    onSuccess: () => {
      // No need to refetch seats, just return the new expiry time
      // The component will handle updating the timer
    },
  });
}
