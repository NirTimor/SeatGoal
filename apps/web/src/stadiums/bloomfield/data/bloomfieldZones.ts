import type { RealSection } from './stadiumData';
import { GATE_POSITIONS } from './stadiumData';

/**
 * Stand bucket from **centroid vs. gates on this SVG** (Vivenu’s north/south/east/west enums are not the same as the club’s יציע רוחב / קופה names).
 * Matches [Maccabi stadium page](https://www.maccabi-tlv.co.il/%D7%94%D7%9E%D7%95%D7%A2%D7%93%D7%95%D7%9F/%D7%94%D7%90%D7%99%D7%A6%D7%98%D7%93%D7%99%D7%95%D7%9F/) gate hints: 10–11 דרומה, 7–8 מזרח, 2/13 מערב.
 */
export type BloomfieldStandKind =
  | 'west_center'
  | 'west_corner'
  | 'south_kop'
  | 'east_bottom'
  | 'north_east'
  | 'fallback';

export function inferBloomfieldStandKind(s: RealSection): BloomfieldStandKind {
  const cx = s.centroidX;
  const cy = s.centroidY;
  if (cx <= 5300 && cy >= 2800 && cy <= 11800) return 'south_kop';
  if (cy >= 9600 && cx >= 3600) return 'east_bottom';
  if (cy <= 4500 && cx >= 5800 && cx <= 10600) return 'west_center';
  if (cy <= 5000 && (cx < 5800 || cx > 10600)) return 'west_corner';
  if (cx >= 10800 && cy >= 3200 && cy <= 10400) return 'north_east';
  return 'fallback';
}

function standKindLabel(kind: BloomfieldStandKind, isHe: boolean): string {
  const m: Record<BloomfieldStandKind, [string, string]> = {
    west_center: ['יציע מערבי — מרכז', 'West stand — center'],
    west_corner: ['יציע מערבי — שערים 2 · 13', 'West stand — gates 2 · 13'],
    south_kop: ['יציע דרומי — שערים 10 · 11', 'South stand — gates 10 · 11'],
    east_bottom: ['יציע מזרחי — שערים 7 · 8', 'East stand — gates 7 · 8'],
    north_east: ['אגף צפון-מזרח — שערים 4 · 5', 'North-east — gates 4 · 5'],
    fallback: ['אצטדיון בלומפילד', 'Bloomfield Stadium'],
  };
  return isHe ? m[kind][0] : m[kind][1];
}

/** Fallback when centroid does not match a gate bucket (rare). */
export function bloomfieldStandLabel(stand: RealSection['stand'], isHe: boolean): string {
  const labels: Record<'north' | 'south' | 'east' | 'west', [string, string]> = {
    north: ['אזור צפון (מפת Vivenu)', 'North (Vivenu map)'],
    south: ['אזור דרום (מפת Vivenu)', 'South (Vivenu map)'],
    east: ['אזור מזרח (מפת Vivenu)', 'East (Vivenu map)'],
    west: ['אזור מערב (מפת Vivenu)', 'West (Vivenu map)'],
  };
  return isHe ? labels[stand][0] : labels[stand][1];
}

export function bloomfieldStandLabelForSection(s: RealSection, isHe: boolean): string {
  const k = inferBloomfieldStandKind(s);
  if (k === 'fallback') {
    return bloomfieldStandLabel(s.stand, isHe);
  }
  return standKindLabel(k, isHe);
}

export function bloomfieldNearestGate(section: RealSection): number {
  let bestGate = GATE_POSITIONS[0]!.gate;
  let bestD = Infinity;
  for (const g of GATE_POSITIONS) {
    const d = (section.centroidX - g.x) ** 2 + (section.centroidY - g.y) ** 2;
    if (d < bestD) {
      bestD = d;
      bestGate = g.gate;
    }
  }
  return bestGate;
}

export function bloomfieldGateBadgeLabel(gate: number, isHe: boolean): string {
  return isHe ? `שער ${gate}` : `Gate ${gate}`;
}

function kindBlurb(kind: BloomfieldStandKind, isHe: boolean): { title: string; blurb: string } {
  const t: Record<
    BloomfieldStandKind,
    { titleHe: string; titleEn: string; blurbHe: string; blurbEn: string }
  > = {
    west_center: {
      titleHe: 'יציע מערבי — מרכז',
      titleEn: 'West stand — center',
      blurbHe:
        'ממוקם מעל הכניסה המרכזית ליציע המערבי (מעל שער 1). כאן תא זהב, VIP וספסלים מרכזיים — כמו בתיאור האצטדיון באתר המועדון.',
      blurbEn:
        'Above gate 1 on the main (west) stand. Gold boxes, VIP and central seating per the club stadium page.',
    },
    west_corner: {
      titleHe: 'יציע מערבי — קצוות',
      titleEn: 'West stand — corners',
      blurbHe: 'קשור לשערים 2 ו-13 — תא כסף מערבי ואגפי היציע בהתאם למפת המועדון.',
      blurbEn: 'Near gates 2 and 13 — west silver boxes and wings on the official map.',
    },
    south_kop: {
      titleHe: 'יציע דרומי',
      titleEn: 'South stand',
      blurbHe:
        'לפי מכבי: יציע בשערים 10–11, שערי העידוד. חלק מהאזור ללא מספור (הושבה לפי מקום פ).',
      blurbEn: 'Club site: gates 10–11, supporters’ ends. Some blocks are unnumbered / general admission.',
    },
    east_bottom: {
      titleHe: 'יציע מזרחי',
      titleEn: 'East stand',
      blurbHe:
        'שערים 7–8. מגוון מחירים, אזור משפחות (419–422), רוב המקומות ממוספרים כפי שמופיע באתר המועדון.',
      blurbEn: 'Gates 7–8. Family blocks, mostly numbered seats per the official description.',
    },
    north_east: {
      titleHe: 'אגף צפון-מזרח',
      titleEn: 'North-east wing',
      blurbHe: 'אזור ליד שערים 4–5 במפת האצטדיון המוצגת כאן.',
      blurbEn: 'Area near gates 4–5 on this seat map.',
    },
    fallback: {
      titleHe: 'אצטדיון בלומפילד',
      titleEn: 'Bloomfield Stadium',
      blurbHe: 'מתחם בלומפילד בתל אביב — אצטדיון הבית של מכבי תל אביב (~30 אלף מושבים, שיפוץ 2019).',
      blurbEn: 'Bloomfield, Tel Aviv — Maccabi TLV home ground (~30k seats, 2019 renovation).',
    },
  };
  const row = t[kind];
  return isHe ? { title: row.titleHe, blurb: row.blurbHe } : { title: row.titleEn, blurb: row.blurbEn };
}

/**
 * Rich zone copy from official Bloomfield descriptions where block names match; otherwise geometry bucket.
 */
export function bloomfieldOfficialZone(section: RealSection): { titleHe: string; titleEn: string; blurbHe: string; blurbEn: string } {
  const n = section.name.trim();
  const nu = n.toUpperCase();

  if (/^GOLD\d*/i.test(nu)) {
    return {
      titleHe: 'תא זהב',
      titleEn: 'Gold box',
      blurbHe:
        'ממוקם במרכז היציע המערבי (גושים 204–206). זווית מרכזית, יציע מקורה, מזנון ייחודי בתשלום, חניה ליד האצטדיון, מקומות מסומנים.',
      blurbEn:
        'Center of the west stand (blocks 204–206). Central sightlines, covered stand, paid kiosk, nearby parking, assigned seats.',
    };
  }
  if (/^VIP\d*/i.test(nu)) {
    return {
      titleHe: 'מתחם VIP',
      titleEn: 'VIP area',
      blurbHe: 'אזור אירוח משודרג ביציע המערבי, כפי שמופיע במפה הרשמית של המועדון.',
      blurbEn: 'Premium hospitality in the main (west) stand, per the club stadium map.',
    };
  }

  const blockNum = /^\d+$/.test(n) ? parseInt(n, 10) : NaN;
  if (!Number.isNaN(blockNum) && blockNum >= 221 && blockNum <= 229) {
    return {
      titleHe: 'תא כסף מזרחי',
      titleEn: 'East silver box',
      blurbHe:
        'ביציע המזרחי ליד שערים 7–8, גושים 221–229. השורות הקרובות לדשא, כניסה נפרדת למחזיקי התא, מקומות מסומנים.',
      blurbEn:
        'East stand near gates 7–8, blocks 221–229. Front rows, separate box entrance, assigned seating.',
    };
  }
  if (!Number.isNaN(blockNum) && blockNum >= 201 && blockNum <= 209) {
    return {
      titleHe: 'תא כסף מערבי',
      titleEn: 'West silver box',
      blurbHe: 'חלק משערים 2/13, גושים 201–203 ו-207–209. קרוב לדשא ולספסל הקבוצות, מקומות מסומנים.',
      blurbEn: 'Gates 2/13, blocks 201–203 and 207–209. Close to the pitch and benches, assigned seats.',
    };
  }

  if (section.stand === 'west' && /^G\d+/i.test(nu)) {
    return {
      titleHe: 'תא כסף / יציע מערבי',
      titleEn: 'West silver / main wing',
      blurbHe: 'אזור תא כסף מערבי ליד שערים 2 ו-13, עם מקומות מסומנים ליד הדשא.',
      blurbEn: 'West silver-style seating near gates 2 and 13, assigned seats close to the pitch.',
    };
  }

  const kind = inferBloomfieldStandKind(section);
  if (kind === 'south_kop' && /^P\d+/i.test(n)) {
    return {
      titleHe: 'יציע דרומי — שערי עידוד',
      titleEn: 'South stand — supporters',
      blurbHe: 'אזור קרוב לשערי העידוד 10–11 לפי תיאור המועדון; חלק מהמקומות ללא מספור קבוע.',
      blurbEn: 'Near the 10–11 ends as described by the club; some areas are unnumbered.',
    };
  }

  const he = kindBlurb(kind, true);
  const en = kindBlurb(kind, false);
  return { titleHe: he.title, titleEn: en.title, blurbHe: he.blurb, blurbEn: en.blurb };
}

export function bloomfieldDisplayBlock(section: RealSection): string {
  const m = section.name.match(/(\d+)/);
  if (m) return m[1]!;
  return section.name;
}
