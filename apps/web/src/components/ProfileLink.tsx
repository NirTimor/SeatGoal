'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useUser } from '@clerk/nextjs';

export default function ProfileLink() {
  const locale = useLocale();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <Link
      href={`/${locale}/profile`}
      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
    >
      {locale === 'he' ? 'אזור אישי' : 'My Account'}
    </Link>
  );
}
