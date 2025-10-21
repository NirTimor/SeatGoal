import { unstable_setRequestLocale } from 'next-intl/server';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import EventDetails from '@/components/EventDetails';

export default async function EventPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  unstable_setRequestLocale(locale);

  try {
    const [{ data: event }, { data: seatsData }] = await Promise.all([
      api.getEvent(id),
      api.getEventSeats(id),
    ]);

    return (
      <EventDetails event={event} seatsData={seatsData} locale={locale} />
    );
  } catch (error) {
    console.error('Error loading event:', error);
    notFound();
  }
}
