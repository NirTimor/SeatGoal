import HaMoshavaMap from '@/stadiums/hamoshava/components/HaMoshavaMap';

export const metadata = {
  title: 'HaMoshava Stadium - Interactive Seat Map',
  description: 'Interactive seat map for HaMoshava Stadium with 10,961 seats across 25 sections',
};

export default function HaMoshavaPage() {
  return <HaMoshavaMap />;
}
