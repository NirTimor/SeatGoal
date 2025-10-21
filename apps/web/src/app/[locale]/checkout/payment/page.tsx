import { unstable_setRequestLocale } from 'next-intl/server';
import PaymentSimulation from '@/components/PaymentSimulation';

export default async function PaymentPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { session?: string; order?: string };
}) {
  unstable_setRequestLocale(locale);

  const { session: sessionId, order: orderId } = searchParams;

  if (!sessionId || !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'he' ? 'שגיאה' : 'Error'}
          </h1>
          <p className="text-gray-600">
            {locale === 'he'
              ? 'פרטי התשלום חסרים'
              : 'Missing payment details'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PaymentSimulation
      sessionId={sessionId}
      orderId={orderId}
      locale={locale}
    />
  );
}
