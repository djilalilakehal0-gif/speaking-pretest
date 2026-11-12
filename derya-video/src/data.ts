import beatsData from "./beats.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Beat times in seconds, detected from public/music.mp3 (≈123 BPM).
export const BEATS: number[] = beatsData.beats;
export const BEAT_LEN = 0.4876;

// Timeline in beats
export const DIVE_BEAT = 14; // the camera dives into the card
export const PHOTOS_BEAT = 16; // the collection starts
export const PHOTO_BEATS = 2; // beats per photo
export const END_BEAT = PHOTOS_BEAT + 9 * PHOTO_BEATS; // 34
export const LAST_BEAT = END_BEAT + 12; // 46

// The storefront opens the video; every scene after it starts this many beats later.
export const STORE_BEATS = 6;
export const DURATION = Math.ceil((BEATS[LAST_BEAT + STORE_BEATS] + 0.5) * FPS);

export const GREEN_900 = "#0b2f20";
export const GREEN_800 = "#11402c";
export const MINT = "#cfeee0";
export const INK = "#0d0f0e";
export const GOLD = "#c9a24a";

// Shop photos (public/photos/<n>.webp) with their captions from the website.
export const PHOTOS: { file: string; name: string; w: number; h: number }[] = [
  { file: "5", name: "Robe blanche sirène", w: 800, h: 1200 },
  { file: "2", name: "Robe rouge en dentelle", w: 800, h: 2137 },
  { file: "3", name: "Robe champagne perlée", w: 800, h: 1200 },
  { file: "1", name: "Robe noire drapée à sequins", w: 800, h: 1640 },
  { file: "7", name: "Robe jaune pastel à cape", w: 800, h: 1200 },
  { file: "4", name: "Collection perlée", w: 800, h: 1200 },
  { file: "6", name: "Robe marron à cape", w: 800, h: 1200 },
  { file: "8", name: "Robe rouge brodée", w: 800, h: 1200 },
  { file: "9", name: "Robe bordeaux & voile", w: 800, h: 1200 },
];
