import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function CancelPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { order_id?: string };
}) {
  unstable_setRequestLocale(locale);
  const isHebrew = locale === 'he';
  const { order_id: orderId } = searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Warning Icon */}
        <div className="inline-block p-4 bg-yellow-100 rounded-full mb-6">
          <svg
            className="w-16 h-16 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isHebrew ? 'התשלום בוטל' : 'Payment Cancelled'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isHebrew
            ? 'ביטלת את תהליך התשלום. המושבים שהוחזקו עדיין שמורים עבורך.'
            : 'You cancelled the payment process. Your held seats are still reserved for you.'}
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            {isHebrew
              ? '💡 טיפ: המושבים שמורים עבורך למשך 10 דקות. תוכל לחזור ולהשלים את הרכישה.'
              : '💡 Tip: Your seats are reserved for 10 minutes. You can go back and complete your purchase.'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {isHebrew ? 'חזור לתשלום' : 'Back to Checkout'}
          </button>
          <Link
            href={`/${locale}/events`}
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {isHebrew ? 'חזור לאירועים' : 'Back to Events'}
          </Link>
        </div>
      </div>
    </div>
  );
}
