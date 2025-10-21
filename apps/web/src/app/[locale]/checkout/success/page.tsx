import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function SuccessPage({
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
        {/* Success Icon */}
        <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
          <svg
            className="w-16 h-16 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isHebrew ? 'התשלום בוצע בהצלחה!' : 'Payment Successful!'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isHebrew
            ? 'ההזמנה שלך אושרה. הכרטיסים נשלחו לכתובת הדוא"ל שלך.'
            : 'Your order has been confirmed. Tickets have been sent to your email.'}
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

        <div className="space-y-3">
          <Link
            href={`/${locale}/events`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {isHebrew ? 'צפה באירועים נוספים' : 'Browse More Events'}
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
