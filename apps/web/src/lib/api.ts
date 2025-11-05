const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Event {
  id: string;
  stadiumId: string;
  homeTeam: string;
  homeTeamHe: string;
  awayTeam: string;
  awayTeamHe: string;
  eventDate: string;
  saleStartDate: string;
  saleEndDate: string;
  status: 'UPCOMING' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'COMPLETED';
  description?: string;
  descriptionHe?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  stadium: {
    id: string;
    name: string;
    nameHe: string;
    city: string;
    cityHe: string;
    capacity: number;
  };
}

export interface Seat {
  id: string;
  seatId: string;
  section: string;
  row: string;
  number: string;
  x?: number;
  y?: number;
  price: string;
  status: 'AVAILABLE' | 'HELD' | 'SOLD' | 'UNAVAILABLE';
}

export interface EventSeats {
  eventId: string;
  seats: Seat[];
  totalSeats: number;
  availableSeats: number;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async fetch<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<{ data: T; cached?: boolean }> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get auth token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse JSON, use the status text
          errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      
      // Handle network errors or other fetch failures
      throw new Error(`Network error: Unable to connect to API server at ${this.baseUrl}. Please make sure the API server is running.`);
    }
  }

  async getEvents() {
    return this.fetch<Event[]>('/events');
  }

  async getEvent(id: string) {
    return this.fetch<Event>(`/events/${id}`);
  }

  async getEventSeats(eventId: string) {
    return this.fetch<EventSeats>(`/events/${eventId}/seats`);
  }

  async holdSeats(
    eventId: string,
    seatIds: string[],
    sessionId: string,
    token?: string,
  ) {
    return this.fetch<{
      success: boolean;
      holdId: string;
      expiresAt: string;
      expiresIn: number;
      seats: Seat[];
      totalPrice: string;
      currency: string;
    }>('/cart/hold', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ eventId, seatIds, sessionId }),
    });
  }

  async releaseHold(eventId: string, sessionId: string, token?: string) {
    return this.fetch<{
      success: boolean;
      releasedSeats: number;
    }>(`/cart/hold/${eventId}/${sessionId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async extendHold(eventId: string, sessionId: string, token?: string) {
    return this.fetch<{
      success: boolean;
      expiresAt: string;
      expiresIn: number;
    }>(`/cart/hold/${eventId}/${sessionId}/extend`, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async createCheckoutSession(
    eventId: string,
    sessionId: string,
    customerInfo: {
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
    },
    token?: string,
  ) {
    return this.fetch<{
      success: boolean;
      orderId: string;
      sessionId: string;
      checkoutUrl: string;
      order: {
        id: string;
        totalAmount: string;
        currency: string;
        event: {
          id: string;
          homeTeam: string;
          awayTeam: string;
          eventDate: string;
          stadium: {
            name: string;
            city: string;
          };
        };
        items: Array<{
          section: string;
          row: string;
          number: string;
          price: string;
        }>;
      };
    }>('/checkout/session', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventId,
        sessionId,
        ...customerInfo,
      }),
    });
  }

  async getOrderStatus(orderId: string, token?: string) {
    return this.fetch<{
      id: string;
      status: string;
      totalAmount: string;
      currency: string;
      createdAt: string;
      event: any;
      items: any[];
      customer: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
      };
    }>(`/checkout/order/${orderId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async simulatePayment(sessionId: string, success: boolean = true) {
    return this.fetch<{
      success: boolean;
      orderId: string;
      status: string;
      message: string;
    }>('/checkout/simulate-payment', {
      method: 'POST',
      body: JSON.stringify({ sessionId, success }),
    });
  }

  // Auth endpoints
  async getProfile() {
    return this.fetch<{
      id: string;
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      idNumber?: string;
      createdAt: string;
    }>('/auth/me');
  }
}

export const api = new ApiClient();
