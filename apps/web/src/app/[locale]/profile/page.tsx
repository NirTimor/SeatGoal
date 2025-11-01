'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import SubscriptionsTab from '@/components/profile/SubscriptionsTab';
import PersonalDetailsTab from '@/components/profile/PersonalDetailsTab';
import OrderHistoryTab from '@/components/profile/OrderHistoryTab';
import ExpiredSubscriptionsTab from '@/components/profile/ExpiredSubscriptionsTab';
import TransfersTab from '@/components/profile/TransfersTab';
import PaymentMethodsTab from '@/components/profile/PaymentMethodsTab';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

type TabKey = 'subscriptions' | 'personalDetails' | 'orderHistory' | 'expiredSubscriptions' | 'transfers' | 'paymentMethods';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabKey>('subscriptions');

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;
  const isRTL = locale === 'he';

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
        </div>
      </div>
    );
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'subscriptions', label: t.tabs.subscriptions },
    { key: 'personalDetails', label: t.tabs.personalDetails },
    { key: 'orderHistory', label: t.tabs.orderHistory },
    { key: 'expiredSubscriptions', label: t.tabs.expiredSubscriptions },
    { key: 'transfers', label: t.tabs.transfers },
    { key: 'paymentMethods', label: t.tabs.paymentMethods },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'subscriptions':
        return <SubscriptionsTab locale={locale} />;
      case 'personalDetails':
        return <PersonalDetailsTab locale={locale} />;
      case 'orderHistory':
        return <OrderHistoryTab locale={locale} />;
      case 'expiredSubscriptions':
        return <ExpiredSubscriptionsTab locale={locale} />;
      case 'transfers':
        return <TransfersTab locale={locale} />;
      case 'paymentMethods':
        return <PaymentMethodsTab locale={locale} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {t.welcome}, {user.firstName || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <nav className="space-y-1 bg-white rounded-lg shadow p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-${isRTL ? 'right' : 'left'} px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Dropdown */}
          <div className="lg:hidden mb-6">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabKey)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
