// Profile API endpoints - extensions to the main API client
// These will be merged into the main api.ts file

export const profileEndpoints = {
  async getUserProfile(baseUrl: string, token: string) {
    const response = await fetch(`${baseUrl}/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async updateUserProfile(
    baseUrl: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      idNumber?: string;
      birthDate?: string;
      address?: string;
      gender?: string;
    },
    token: string,
  ) {
    const response = await fetch(`${baseUrl}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getSeasonSubscriptions(baseUrl: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/subscriptions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getLoyaltyPoints(baseUrl: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/loyalty`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getOrderHistory(baseUrl: string, token: string, filters?: { status?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${baseUrl}/profile/orders${query}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getTicketTransfers(baseUrl: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/transfers`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async acceptTransfer(baseUrl: string, transferId: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/transfers/${transferId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async rejectTransfer(baseUrl: string, transferId: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/transfers/${transferId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getPaymentMethods(baseUrl: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/payment-methods`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async setDefaultPaymentMethod(baseUrl: string, paymentMethodId: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/payment-methods/${paymentMethodId}/default`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async removePaymentMethod(baseUrl: string, paymentMethodId: string, token: string) {
    const response = await fetch(`${baseUrl}/profile/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
