'use client';

import { useState, useEffect, useCallback } from 'react';
import ProfileCard from './ProfileCard';
import EmptyState from './EmptyState';
import { profileEndpoints, API_URL } from '@/lib/api-profile';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

interface TransfersTabProps {
  locale: string;
}

export default function TransfersTab({ locale }: TransfersTabProps) {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<{ sent: any[]; received: any[] }>({ sent: [], received: [] });
  const [activeView, setActiveView] = useState<'sent' | 'received'>('received');

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await profileEndpoints.getTicketTransfers(API_URL, token);
      setTransfers(response.data);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleAccept = async (transferId: string) => {
    if (!confirm(t.transfers.acceptConfirm)) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await profileEndpoints.acceptTransfer(API_URL, transferId, token);
      await loadTransfers();
    } catch (error) {
      console.error('Error accepting transfer:', error);
    }
  };

  const handleReject = async (transferId: string) => {
    if (!confirm(t.transfers.rejectConfirm)) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await profileEndpoints.rejectTransfer(API_URL, transferId, token);
      await loadTransfers();
    } catch (error) {
      console.error('Error rejecting transfer:', error);
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const currentTransfers = activeView === 'sent' ? transfers.sent : transfers.received;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">{t.transfers.title}</h2>

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('received')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'received'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t.transfers.received} ({transfers.received.length})
        </button>
        <button
          onClick={() => setActiveView('sent')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'sent'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t.transfers.sent} ({transfers.sent.length})
        </button>
      </div>

      {currentTransfers.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          title={t.transfers.noTransfers}
        />
      ) : (
        <div className="space-y-4">
          {currentTransfers.map((transfer) => (
            <ProfileCard key={transfer.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {locale === 'he'
                        ? `${transfer.ticket.event.homeTeamHe} נגד ${transfer.ticket.event.awayTeamHe}`
                        : `${transfer.ticket.event.homeTeam} vs ${transfer.ticket.event.awayTeam}`}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Seat: {transfer.ticket.seat.section}-{transfer.ticket.seat.row}{transfer.ticket.seat.number}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(transfer.status)}`}>
                    {t.transfers.statuses[transfer.status as keyof typeof t.transfers.statuses]}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">
                        {activeView === 'sent' ? t.transfers.to : t.transfers.from}
                      </p>
                      <p className="font-medium">
                        {activeView === 'sent' ? transfer.recipientEmail : transfer.senderEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">{t.transfers.date}</p>
                      <p className="font-medium">
                        {new Date(transfer.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions for Received Transfers */}
                {activeView === 'received' && transfer.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleAccept(transfer.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {t.transfers.accept}
                    </button>
                    <button
                      onClick={() => handleReject(transfer.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {t.transfers.reject}
                    </button>
                  </div>
                )}
              </div>
            </ProfileCard>
          ))}
        </div>
      )}
    </div>
  );
}
