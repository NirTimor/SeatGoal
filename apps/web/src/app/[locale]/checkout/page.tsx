import { unstable_setRequestLocale } from 'next-intl/server';
import CheckoutForm from '@/components/CheckoutForm';

export default async function CheckoutPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { event?: string; session?: string };
}) {
  unstable_setRequestLocale(locale);

  const { event: eventId, session: sessionId } = searchParams;

  if (!eventId || !sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'he' ? 'שגיאה' : 'Error'}
          </h1>
          <p className="text-gray-600">
            {locale === 'he'
              ? 'פרטי ההזמנה חסרים'
              : 'Missing order details'}
          </p>
        </div>
      </div>
    );
  }

  return <CheckoutForm eventId={eventId} sessionId={sessionId} locale={locale} />;
}
