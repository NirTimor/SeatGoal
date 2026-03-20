import HaTikvaMap from '@/stadiums/hatikva/components/HaTikvaMap';

export const metadata = {
  title: 'HaTikva Neighborhood Stadium - Interactive Seat Map',
  description: 'Interactive seat map for HaTikva Neighborhood Stadium with 2,299 seats across 5 sections',
};

export default function HaTikvaPage() {
  return <HaTikvaMap />;
}
