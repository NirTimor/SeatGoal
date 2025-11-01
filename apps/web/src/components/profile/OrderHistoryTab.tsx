'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import ProfileCard from './ProfileCard';
import EmptyState from './EmptyState';
import { profileEndpoints, API_URL } from '@/lib/api-profile';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

interface OrderHistoryTabProps {
  locale: string;
}

export default function OrderHistoryTab({ locale }: OrderHistoryTabProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const filters = filter !== 'all' ? { status: filter } : undefined;
      const response = await profileEndpoints.getOrderHistory(API_URL, token, filters);
      setOrders(response.data?.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
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

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return styles[status.toLowerCase() as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t.orderHistory.title}</h2>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">{t.orderHistory.filters.all}</option>
          <option value="completed">{t.orderHistory.filters.completed}</option>
          <option value="pending">{t.orderHistory.filters.pending}</option>
          <option value="cancelled">{t.orderHistory.filters.cancelled}</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title={t.orderHistory.noOrders}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ProfileCard key={order.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t.orderHistory.orderId}: {order.id.slice(0, 8)}...
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">
                      {locale === 'he'
                        ? `${order.event.homeTeamHe} נגד ${order.event.awayTeamHe}`
                        : `${order.event.homeTeam} vs ${order.event.awayTeam}`}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {locale === 'he' ? order.event.stadium.nameHe : order.event.stadium.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">{t.orderHistory.date}</p>
                      <p className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">{t.orderHistory.amount}</p>
                      <p className="font-medium">
                        {order.currency} {parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Event Date</p>
                      <p className="font-medium">
                        {new Date(order.event.eventDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Seats</p>
                      <p className="font-medium">{order.items.length}</p>
                    </div>
                  </div>
                </div>

                {/* Seat Details */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Seats:</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {item.section}-{item.row}{item.number}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    {t.orderHistory.viewDetails}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    {t.orderHistory.downloadReceipt}
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
