import BloomfieldMap from '@/stadiums/bloomfield/components/BloomfieldMap';

export const metadata = {
  title: 'Bloomfield Stadium - Interactive Seat Map',
  description: 'Interactive seat map for Bloomfield Stadium with 29,942 seats across 93 sections',
};

export default function BloomfieldPage() {
  return <BloomfieldMap />;
}
