'use client';

import { useState, useEffect, useCallback } from 'react';
import ProfileCard from './ProfileCard';
import { profileEndpoints, API_URL } from '@/lib/api-profile';
import profileTranslationsHe from '@/messages/profile-he.json';
import profileTranslationsEn from '@/messages/profile-en.json';

interface PersonalDetailsTabProps {
  locale: string;
}

export default function PersonalDetailsTab({ locale }: PersonalDetailsTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const t = locale === 'he' ? profileTranslationsHe.Profile : profileTranslationsEn.Profile;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    birthDate: '',
    address: '',
    gender: '',
  });

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Decode JWT to get user info
      let userFromToken: any = {};
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userFromToken = {
          email: payload.email,
          phone: payload.phone,
          firstName: payload.email?.split('@')[0] || payload.phone || '',
        };
      } catch (err) {
        console.error('Failed to decode token:', err);
      }

      const response = await profileEndpoints.getUserProfile(API_URL, token);
      const userData = response.data;

      setFormData({
        firstName: userData.firstName || userFromToken.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || userFromToken.email || '',
        phone: userData.phone || userFromToken.phone || '',
        idNumber: userData.idNumber || '',
        birthDate: userData.birthDate || '',
        address: userData.address || '',
        gender: userData.gender || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setMessage({ type: 'error', text: locale === 'he' ? 'שם פרטי ושם משפחה הם שדות חובה' : 'First name and last name are required' });
      return false;
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      setMessage({ type: 'error', text: locale === 'he' ? 'מספר טלפון לא תקין' : 'Invalid phone number' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await profileEndpoints.updateUserProfile(
        API_URL,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          idNumber: formData.idNumber,
          birthDate: formData.birthDate,
          address: formData.address,
          gender: formData.gender,
        },
        token
      );

      setMessage({ type: 'success', text: t.personalDetails.saved });
    } catch (error) {
      console.error('Error saving data:', error);
      setMessage({ type: 'error', text: t.personalDetails.error });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const maskIdNumber = (id: string) => {
    if (!id || id.length < 4) return id;
    return '****' + id.slice(-4);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">{t.personalDetails.title}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.firstName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.lastName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.email}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.phone}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* ID Number */}
          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.idNumber}
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber ? maskIdNumber(formData.idNumber) : ''}
              onChange={handleChange}
              placeholder={formData.idNumber ? maskIdNumber(formData.idNumber) : ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Birth Date */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.birthDate}
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.address}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              {t.personalDetails.gender}
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="MALE">{t.personalDetails.genders.MALE}</option>
              <option value="FEMALE">{t.personalDetails.genders.FEMALE}</option>
              <option value="OTHER">{t.personalDetails.genders.OTHER}</option>
            </select>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t.personalDetails.saving : t.personalDetails.saveButton}
          </button>
        </div>
      </form>
    </div>
  );
}
