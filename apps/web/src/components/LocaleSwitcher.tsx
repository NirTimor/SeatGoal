'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.replace(newPathname);
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending || locale === 'en'}
        className={`px-3 py-1 rounded ${
          locale === 'en'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        } disabled:opacity-50`}
      >
        English
      </button>
      <button
        onClick={() => switchLocale('he')}
        disabled={isPending || locale === 'he'}
        className={`px-3 py-1 rounded ${
          locale === 'he'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        } disabled:opacity-50`}
      >
        עברית
      </button>
    </div>
  );
}

