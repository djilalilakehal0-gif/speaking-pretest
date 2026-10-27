export const CATEGORIES = [
  { id: 'yaqeen', name: 'اليقين وحسن الظن بالله' },
  { id: 'rizq', name: 'أدعية الرزق والفرج' },
  { id: 'adhkar', name: 'أذكار الصباح والمساء' },
  { id: 'ayat', name: 'آيات قرآنية تبعث الطمأنينة' },
  { id: 'stories', name: 'مقاطع قصيرة للحالات والقصص' },
];
export const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name || '';

export const TITLE_SUGGESTIONS = [
  'لا تيأس، فالله قادر على تغيير كل شيء',
  'ادعُ الله بيقين ولا تستعجل الإجابة',
  'حين تضيق بك الدنيا، الجأ إلى الله',
  'حسن الظن بالله باب من أبواب الطمأنينة',
  'يا رب، ارزقني فرحاً ينسيني كل ما مضى',
  'دعاء لتفريج الهم والكرب',
  'اللهم ارزقنا راحة القلب وسكينة الروح',
  'توكل على الله واترك تدبير الأمور له',
  'استغفر الله، فقد تكون الاستغفارات بداية الفرج',
  'لا تحزن، فإن رحمة الله واسعة',
];

export function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      return m ? m[1] : null;
    }
  } catch { /* not a URL */ }
  return null;
}

export const coverOf = (v) => v.coverUrl || (youtubeId(v.videoUrl) ? `https://img.youtube.com/vi/${youtubeId(v.videoUrl)}/hqdefault.jpg` : '');

export function formatDuration(s) {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

export const parseDuration = (text) => {
  const parts = String(text).trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
};

export const formatCount = (n) => new Intl.NumberFormat('ar-EG', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);

export async function shareVideo(video) {
  const url = `${location.origin}/v/${video.id}`;
  if (navigator.share) {
    try { await navigator.share({ title: video.title, text: video.description || video.title, url }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancel'; }
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { window.prompt('انسخ الرابط:', url); return 'prompt'; }
}
