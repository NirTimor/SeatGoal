'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import ProfileCard from './ProfileCard';
import StatsCard from './StatsCard';
import EmptyState from './EmptyState';
import { profileEndpoints, API_URL } from '@/lib/api-profile';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

interface SubscriptionsTabProps {
  locale: string;
}

export default function SubscriptionsTab({ locale }: SubscriptionsTabProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;
  const isRTL = locale === 'he';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [subsResponse, loyaltyResponse] = await Promise.all([
        profileEndpoints.getSeasonSubscriptions(API_URL, token),
        profileEndpoints.getLoyaltyPoints(API_URL, token),
      ]);

      setSubscriptions(subsResponse.data?.subscriptions || []);
      setLoyaltyData(loyaltyResponse.data);
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

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');

  return (
    <div className="p-6 space-y-6">
      {/* Loyalty Points Section */}
      {loyaltyData && (
        <div>
          <h2 className="text-xl font-bold mb-4">{t.loyalty.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title={t.loyalty.totalPoints}
              value={loyaltyData.totalPoints || 0}
              subtitle={`${t.loyalty.tier}: ${t.loyalty.tiers[loyaltyData.tier] || loyaltyData.tier}`}
            />
            <StatsCard
              title={t.loyalty.homePoints}
              value={loyaltyData.homeGamePoints || 0}
            />
            <StatsCard
              title={t.loyalty.awayPoints}
              value={loyaltyData.awayGamePoints || 0}
            />
          </div>

          {/* Points History */}
          {loyaltyData.history && loyaltyData.history.length > 0 && (
            <ProfileCard title={t.loyalty.history}>
              <div className="space-y-3">
                {loyaltyData.history.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === 'he' ? item.descriptionHe : item.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
                      </p>
                    </div>
                    <span className="font-bold text-primary-600">+{item.points}</span>
                  </div>
                ))}
              </div>
            </ProfileCard>
          )}
        </div>
      )}

      {/* Active Subscriptions */}
      <div>
        <h2 className="text-xl font-bold mb-4">{t.subscriptions.title}</h2>
        {activeSubscriptions.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
            title={t.subscriptions.noSubscriptions}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubscriptions.map((sub) => (
              <ProfileCard key={sub.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900">
                      {locale === 'he' ? sub.teamNameHe : sub.teamName}
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {t.subscriptions.active}
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
                    {sub.seatSection && (
                      <p>
                        <span className="font-medium">{t.subscriptions.seat}:</span>{' '}
                        {sub.seatSection} - {sub.seatRow}{sub.seatNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    {new Date(sub.startDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')} -{' '}
                    {new Date(sub.endDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
                  </div>
                </div>
              </ProfileCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
