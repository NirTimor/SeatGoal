'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface PaymentSimulationProps {
  sessionId: string;
  orderId: string;
  locale: string;
}

export default function PaymentSimulation({
  sessionId,
  orderId,
  locale,
}: PaymentSimulationProps) {
  const router = useRouter();
  const isHebrew = locale === 'he';
  const [loading, setLoading] = useState(false);

  const handlePayment = async (success: boolean) => {
    setLoading(true);
    try {
      const result = await api.simulatePayment(sessionId, success);

      if (result.data.success) {
        // Redirect to success page
        router.push(`/${locale}/checkout/success?order=${orderId}`);
      } else {
        // Redirect to failure page
        router.push(`/${locale}/checkout/failure?order=${orderId}`);
      }
    } catch (error) {
      console.error('Payment simulation error:', error);
      router.push(`/${locale}/checkout/failure?order=${orderId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isHebrew ? 'סימולציית תשלום' : 'Payment Simulation'}
          </h1>
          <p className="text-gray-600">
            {isHebrew
              ? 'זוהי סימולציה למטרות הדגמה. בחר את תוצאת התשלום:'
              : 'This is a simulation for demo purposes. Choose the payment outcome:'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handlePayment(true)}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {isHebrew ? 'תשלום מוצלח' : 'Successful Payment'}
          </button>

          <button
            onClick={() => handlePayment(false)}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {isHebrew ? 'תשלום נכשל' : 'Failed Payment'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {isHebrew
              ? '⚠️ הערה: בסביבת הפקודה אמיתית, תועבר לספק התשלומים (Stripe/PayPal)'
              : '⚠️ Note: In production, you would be redirected to the payment provider (Stripe/PayPal)'}
          </p>
        </div>
      </div>
    </div>
  );
}
