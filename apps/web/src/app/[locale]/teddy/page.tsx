import TeddyMap from '@/stadiums/teddy/components/TeddyMap';

export const metadata = {
  title: 'Teddy Stadium - Interactive Seat Map',
  description: 'Interactive seat map for Teddy Stadium (Jerusalem) with ~31,733 seats',
};

export default function TeddyPage() {
  return <TeddyMap />;
}
