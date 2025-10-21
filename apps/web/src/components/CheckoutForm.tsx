'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CheckoutFormProps {
  eventId: string;
  sessionId: string;
  locale: string;
}

export default function CheckoutForm({
  eventId,
  sessionId,
  locale,
}: CheckoutFormProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const isHebrew = locale === 'he';

  const [formData, setFormData] = useState({
    email: user?.primaryEmailAddress?.emailAddress || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const result = await api.createCheckoutSession(
        eventId,
        sessionId,
        formData,
        token || undefined,
      );

      if (result.data.success) {
        // Redirect to checkout URL (payment simulation for MVP)
        router.push(result.data.checkoutUrl);
      }
    } catch (err: any) {
      setError(
        err.message ||
          (isHebrew
            ? 'שגיאה ביצירת הזמנה'
            : 'Error creating checkout session'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {isHebrew ? 'פרטי הזמנה' : 'Checkout Details'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {isHebrew ? 'דוא"ל' : 'Email'} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  isHebrew ? 'your@email.com' : 'your@email.com'
                }
              />
            </div>

            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {isHebrew ? 'שם פרטי' : 'First Name'} *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {isHebrew ? 'שם משפחה' : 'Last Name'} *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {isHebrew ? 'טלפון' : 'Phone'} *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isHebrew ? '05X-XXXXXXX' : '05X-XXXXXXX'}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                {isHebrew ? 'חזור' : 'Back'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading
                  ? isHebrew
                    ? 'מעבד...'
                    : 'Processing...'
                  : isHebrew
                    ? 'המשך לתשלום'
                    : 'Continue to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
