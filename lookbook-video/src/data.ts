import beatsData from "./beats.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
// The music runs 48.85 s; the video ends with it.
export const DURATION = Math.ceil(48.85 * FPS);

// Beat times in seconds, detected from public/music.mp3 (≈123 BPM).
export const BEATS: number[] = beatsData.beats;
export const BEAT_LEN = 0.4876;
// Pixel size of each cutout in public/looks/<n>.webp
export const DIMS = beatsData.dims as [number, number][];

export const INK = "#1c3a9e";
export const MID = "#4a5d8c";

// Timeline in beats: intro, eight looks of two bars each, then the finale.
export const INTRO_BEATS = 16;
export const LOOK_BEATS = 8;
export const FINALE_BEAT = INTRO_BEATS + LOOK_BEATS * 8; // 80
export const CONTACT_BEAT = FINALE_BEAT + 8; // 88

export const LOOKS = [
  { word: "Noir", pieces: ["Black Stretch Shirt", "Pleated Trousers"] },
  { word: "Bordeaux", pieces: ["Burgundy Puffer Jacket", "Chelsea Boots"] },
  { word: "Pinstripe", pieces: ["Pinstripe Double Breasted Blazer", "White Tailored Trousers"] },
  { word: "Burgundy", pieces: ["Burgundy Stretch Shirt", "Dark Wash Jeans"] },
  { word: "Oxford", pieces: ["Sky Oxford Shirt", "Suede Loafers"] },
  { word: "Shearling", pieces: ["Black Shearling Puffer", "Burgundy Trousers"] },
  { word: "Blanc", pieces: ["White Flat Cap", "Leather Laptop Bag"] },
  { word: "Ivory", pieces: ["White Double Breasted Suit", "Black Oxford Shoes"] },
];
export const FIRST_LOOK = 15;
