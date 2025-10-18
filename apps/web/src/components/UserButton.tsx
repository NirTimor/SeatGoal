'use client';

import { UserButton as ClerkUserButton, SignInButton, useUser } from '@clerk/nextjs';

export default function UserButton() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Sign In
        </button>
      </SignInButton>
    );
  }

  return <ClerkUserButton afterSignOutUrl="/" />;
}


