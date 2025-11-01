'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import ProfileCard from './ProfileCard';
import EmptyState from './EmptyState';
import { profileEndpoints, API_URL } from '@/lib/api-profile';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

interface ExpiredSubscriptionsTabProps {
  locale: string;
}

export default function ExpiredSubscriptionsTab({ locale }: ExpiredSubscriptionsTabProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await profileEndpoints.getSeasonSubscriptions(API_URL, token);
      const expiredSubs = (response.data?.subscriptions || []).filter(
        (s: any) => s.status === 'EXPIRED'
      );
      setSubscriptions(expiredSubs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">{t.tabs.expiredSubscriptions}</h2>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title={locale === 'he' ? 'אין מנויים שפגו' : 'No expired subscriptions'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => (
            <ProfileCard key={sub.id} className="opacity-75">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'he' ? sub.teamNameHe : sub.teamName}
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                    {t.subscriptions.expired}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">{t.subscriptions.season}:</span> {sub.season}
                  </p>
                  <p>
                    <span className="font-medium">{t.subscriptions.homeGames}:</span> {sub.homeGamesIncluded}
                  </p>
                  <p>
                    <span className="font-medium">{t.subscriptions.awayGames}:</span> {sub.awayGamesIncluded}
                  </p>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  {t.subscriptions.renewButton}
                </button>
              </div>
            </ProfileCard>
          ))}
        </div>
      )}
    </div>
  );
}
