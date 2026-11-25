/**
 * The hero poster has Arabic lettering baked into the picture. For other languages we show a "clean" copy of the
 * poster (lettering removed) and draw the translated text on top at the same positions.
 * Coordinates are in poster pixels (1200 x 1311); every renderer (web, demo, app) scales them.
 */
export const POSTER = { w: 1200, h: 1311 } as const;

export interface TextSlot { x: number; y: number; w: number; size: number; rot: number }
/** centre x/y, max width, base font size (px of the 1200-wide poster), rotation in degrees */
export const SLOTS: { ribbon: TextSlot; signs: TextSlot[] } = {
  ribbon: { x: 609, y: 389, w: 575, size: 64, rot: 0 },
  signs: [
    { x: 374, y: 704, w: 222, size: 42, rot: 5 },
    { x: 368, y: 821, w: 244, size: 42, rot: 2 },
    { x: 380, y: 931, w: 226, size: 42, rot: 0 },
    { x: 368, y: 1032, w: 244, size: 42, rot: -4 },
  ],
};

export type PosterLocale = 'es' | 'fr' | 'en';
export const POSTER_TEXT: Record<PosterLocale, { ribbon: string; signs: [string, string, string, string] }> = {
  es: { ribbon: 'Tu camino legal a España', signs: ['Trámites de inmigración', 'Asistencia legal', 'Preparación de expedientes', 'Obtener la residencia'] },
  fr: { ribbon: 'Ton chemin légal vers l’Espagne', signs: ['Démarches d’immigration', 'Aide juridique', 'Préparation des dossiers', 'Obtenir la résidence'] },
  en: { ribbon: 'Your legal path to Spain', signs: ['Immigration procedures', 'Legal assistance', 'Preparing your file', 'Getting residence'] },
};

/** Shrink the font so the text fits the slot width (Cairo Latin averages ~0.55em per character). */
export const fitSize = (text: string, slot: TextSlot) => Math.min(slot.size, slot.w / (Math.max(text.length, 1) * 0.55));

export interface PosterLabel { lines: string[]; slot: TextSlot; size: number }
const MIN_SIZE = 26;

/** Split at the space closest to the middle. */
function balance(text: string): string[] {
  const mid = text.length / 2; let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}

export function posterLabels(locale: string): PosterLabel[] | null {
  const t = POSTER_TEXT[locale as PosterLocale];
  if (!t) return null;   // Arabic keeps the original artwork
  const mk = (text: string, slot: TextSlot, canWrap: boolean): PosterLabel => {
    const one = fitSize(text, slot);
    if (!canWrap || one >= 30) return { lines: [text], slot, size: one };
    const lines = balance(text);
    const size = Math.min(slot.size * 0.8, ...lines.map((l) => fitSize(l, slot)));
    return lines.length === 2 && size > one ? { lines, slot, size } : { lines: [text], slot, size: one };
  };
  return [mk(t.ribbon, SLOTS.ribbon, false), ...t.signs.map((x, i) => mk(x, SLOTS.signs[i], true))];
}
