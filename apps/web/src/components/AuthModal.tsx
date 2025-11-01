'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const t = useTranslations('Auth');
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

      // Success! Close modal and call onSuccess
      onSuccess(data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('credentials');
    setEmail('');
    setPhone('');
    setIdCard('');
    setCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h2>

        {/* Instruction */}
        <p className="text-sm text-gray-600 mb-6">
          {t('instruction')}
        </p>

        {step === 'credentials' ? (
          <>
            {/* Auth type selector */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setAuthType('email')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  authType === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('email')}
              </button>
              <button
                type="button"
                onClick={() => setAuthType('phone')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  authType === 'phone'
                    ? 'bg-blue-600 text-white'
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  authType === 'email'
                    ? t('emailPlaceholder')
                    : t('phonePlaceholder')
                }
                required
              />
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading || (!email && !phone) || !idCard}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('sending') : t('continue')}
            </button>
          </>
        ) : (
          <>
            {/* Verification code input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('verificationCode')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="mt-2 text-sm text-gray-500 text-center">
                {t('codeSentTo', {
                  method: authType === 'email' ? email : phone,
                })}
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
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
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {t('back')}
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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

