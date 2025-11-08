'use client';

import { SignInButton, SignedIn, SignedOut, UserButton as ClerkUserButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

export default function UserButton() {
  const t = useTranslations('Auth');

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {t('signIn')}
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <ClerkUserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
