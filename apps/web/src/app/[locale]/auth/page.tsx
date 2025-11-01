'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authType, setAuthType] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'credentials' | 'verification'>('credentials');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(authType === 'email' ? { email } : { phone }),
          idCard,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      // Move to verification step
      setStep('verification');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(authType === 'email' ? { email } : { phone }),
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      // Success! Store token and redirect
      localStorage.setItem('auth_token', data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? t('loginTitle') : t('registerTitle')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('instruction')}
          </p>
        </div>

        {step === 'credentials' ? (
          <>
            {/* Auth type selector */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setAuthType('email')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  authType === 'email'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('email')}
              </button>
              <button
                type="button"
                onClick={() => setAuthType('phone')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  authType === 'phone'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('phone')}
              </button>
            </div>

            {/* ID Card input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('idCard')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                placeholder={t('idCardPlaceholder')}
                required
              />
            </div>

            {/* Email or Phone input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {authType === 'email' ? t('email') : t('phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type={authType === 'email' ? 'email' : 'tel'}
                value={authType === 'email' ? email : phone}
                onChange={(e) =>
                  authType === 'email'
                    ? setEmail(e.target.value)
                    : setPhone(e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                placeholder={
                  authType === 'email'
                    ? t('emailPlaceholder')
                    : t('phonePlaceholder')
                }
                required
              />
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading || (!email && !phone) || !idCard}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? t('sending') : t('continue')}
            </button>

            {/* Login/Register Toggle */}
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">
                {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
              </span>
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                {mode === 'login' ? t('registerHere') : t('loginHere')}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Verification code input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                {t('verificationCode')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-semibold transition-all text-gray-900"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="mt-3 text-sm text-gray-500 text-center">
                {t('codeSentTo', {
                  method: authType === 'email' ? email : phone,
                })}
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setError('');
                }}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                {t('back')}
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? t('verifying') : t('verify')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

