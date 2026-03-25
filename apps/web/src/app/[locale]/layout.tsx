import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  // Real key in dev/prod via .env / hosting env. GitHub Actions has no .env.local; Clerk accepts
  // this well-formed test placeholder for static generation (see clerk key validation / isPublishableKey).
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    (process.env.GITHUB_ACTIONS === 'true' ? 'pk_test_JA==' : '');

  if (!publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Copy apps/web/.env.example to apps/web/.env.local and set your Clerk publishable key.'
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang={locale} dir={dir}>
        <body>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

