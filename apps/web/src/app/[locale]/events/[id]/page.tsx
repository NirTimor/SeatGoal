import { unstable_setRequestLocale } from 'next-intl/server';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import EventDetails from '@/components/EventDetails';

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  unstable_setRequestLocale(locale);

  try {
    // Only fetch event data server-side
    // Seats data is now fetched client-side with React Query for better caching
    const { data: event } = await api.getEvent(id);

    return <EventDetails event={event} locale={locale} />;
  } catch (error) {
    console.error('Error loading event:', error);
    notFound();
  }
}
