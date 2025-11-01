'use client';

import { useState, useEffect, useCallback } from 'react';
import ProfileCard from './ProfileCard';
import EmptyState from './EmptyState';
import { profileEndpoints, API_URL } from '@/lib/api-profile';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

interface PaymentMethodsTabProps {
  locale: string;
}

export default function PaymentMethodsTab({ locale }: PaymentMethodsTabProps) {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await profileEndpoints.getPaymentMethods(API_URL, token);
      setPaymentMethods(response.data?.paymentMethods || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await profileEndpoints.setDefaultPaymentMethod(API_URL, id, token);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm(t.paymentMethods.removeConfirm)) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await profileEndpoints.removePaymentMethod(API_URL, id, token);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error removing payment method:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getCardIcon = (brand: string) => {
    // Simple card icons - you can replace with actual card brand logos
    return (
      <svg className="w-12 h-8" fill="none" viewBox="0 0 48 32" stroke="currentColor">
        <rect x="1" y="1" width="46" height="30" rx="4" strokeWidth="2" />
        <rect x="1" y="10" width="46" height="6" fill="currentColor" />
      </svg>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t.paymentMethods.title}</h2>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          {t.paymentMethods.addNew}
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          title={t.paymentMethods.noMethods}
          action={{
            label: t.paymentMethods.addNew,
            onClick: () => console.log('Add payment method'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <ProfileCard key={method.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400">{getCardIcon(method.brand)}</div>
                    <div>
                      <p className="text-sm text-gray-500 uppercase">{method.brand}</p>
                      <p className="text-lg font-bold text-gray-900">•••• {method.last4}</p>
                      <p className="text-sm text-gray-600">
                        {t.paymentMethods.expires}: {method.expiryMonth}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded-full">
                      {t.paymentMethods.default}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="flex-1 px-4 py-2 text-sm text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      {t.paymentMethods.setDefault}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(method.id)}
                    className="flex-1 px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {t.paymentMethods.remove}
                  </button>
                </div>
              </div>
            </ProfileCard>
          ))}
        </div>
      )}
    </div>
  );
}
