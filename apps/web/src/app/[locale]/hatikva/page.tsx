import HaTikvaMap from '@/stadiums/hatikva/components/HaTikvaMap';
import { HATIKVA_CANVAS_BG } from '@/stadiums/hatikva/data/stadiumData';

export const metadata = {
  title: 'HaTikva Neighborhood Stadium - Interactive Seat Map',
  description: 'Interactive seat map for HaTikva Neighborhood Stadium with 2,299 seats across 5 sections',
};

export default function HaTikvaPage() {
  return (
    <div
      className="min-h-[100svh] min-h-dvh text-slate-800 [color-scheme:light]"
      style={{ backgroundColor: HATIKVA_CANVAS_BG }}
    >
      <HaTikvaMap />
    </div>
  );
}
