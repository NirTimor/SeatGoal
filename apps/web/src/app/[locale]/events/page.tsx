import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { api } from '@/lib/api';

export default async function EventsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  // Fetch events server-side
  const { data: events } = await api.getEvents();

  const isHebrew = locale === 'he';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isHebrew ? 'אירועים קרובים' : 'Upcoming Events'}
          </h1>
          <p className="text-lg text-gray-600">
            {isHebrew
              ? 'רכוש כרטיסים למשחקי כדורגל מרגשים'
              : 'Purchase tickets for exciting football matches'}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {isHebrew
                ? 'אין אירועים זמינים כרגע'
                : 'No events available at this time'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/${locale}/events/${event.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Event Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 relative">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={isHebrew ? event.homeTeamHe : event.homeTeam}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-white text-2xl font-bold">
                        {isHebrew
                          ? `${event.homeTeamHe} VS ${event.awayTeamHe}`
                          : `${event.homeTeam} VS ${event.awayTeam}`}
                      </span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        event.status === 'ON_SALE'
                          ? 'bg-green-500 text-white'
                          : event.status === 'UPCOMING'
                            ? 'bg-yellow-500 text-white'
                            : event.status === 'SOLD_OUT'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-500 text-white'
                      }`}
                    >
                      {event.status === 'ON_SALE'
                        ? isHebrew
                          ? 'במכירה'
                          : 'On Sale'
                        : event.status === 'UPCOMING'
                          ? isHebrew
                            ? 'בקרוב'
                            : 'Upcoming'
                          : event.status === 'SOLD_OUT'
                            ? isHebrew
                              ? 'אזל המלאי'
                              : 'Sold Out'
                            : event.status}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {isHebrew
                      ? `${event.homeTeamHe} נגד ${event.awayTeamHe}`
                      : `${event.homeTeam} vs ${event.awayTeam}`}
                  </h2>

                  {/* Stadium */}
                  <p className="text-gray-600 mb-2 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {isHebrew ? event.stadium.nameHe : event.stadium.name}
                  </p>

                  {/* Date */}
                  <p className="text-gray-600 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {new Date(event.eventDate).toLocaleDateString(
                      isHebrew ? 'he-IL' : 'en-US',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </p>

                  {/* Description */}
                  {(isHebrew ? event.descriptionHe : event.description) && (
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {isHebrew ? event.descriptionHe : event.description}
                    </p>
                  )}

                  {/* Button */}
                  <div className="mt-4">
                    <span className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
                      {isHebrew ? 'צפה בפרטים' : 'View Details'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
