import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function FailurePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { order?: string };
}) {
  unstable_setRequestLocale(locale);
  const isHebrew = locale === 'he';
  const { order: orderId } = searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Failure Icon */}
        <div className="inline-block p-4 bg-red-100 rounded-full mb-6">
          <svg
            className="w-16 h-16 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isHebrew ? 'התשלום נכשל' : 'Payment Failed'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isHebrew
            ? 'לצערנו, התשלום לא בוצע. המושבים שהוחזקו שוחררו.'
            : 'Unfortunately, the payment was not successful. Your held seats have been released.'}
        </p>

        {orderId && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">
              {isHebrew ? 'מספר הזמנה:' : 'Order ID:'}
            </p>
            <p className="text-lg font-mono font-semibold text-gray-900">
              {orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            {isHebrew
              ? 'ניתן לנסות שוב לרכוש כרטיסים לאותו אירוע'
              : 'You can try purchasing tickets for the same event again'}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/${locale}/events`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {isHebrew ? 'חזור לאירועים' : 'Back to Events'}
          </Link>
          <Link
            href={`/${locale}`}
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {isHebrew ? 'חזור לדף הבית' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
