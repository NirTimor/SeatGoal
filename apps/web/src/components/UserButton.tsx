'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

export default function UserButton() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
      // You could decode the token to get user info, or make an API call
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        email: payload.email || payload.phone,
      });
    }
    setLoading(false);
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={handleSignIn}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {t('signIn')}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <div className="font-medium">{user?.email || 'User'}</div>
      </div>
      <button
        onClick={handleSignOut}
        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        {t('signOut')}
      </button>
    </div>
  );
}
