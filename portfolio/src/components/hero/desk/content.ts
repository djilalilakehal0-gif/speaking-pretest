/** Text shown on the decorative screens (code stays English in every language). */

type Token = 'keyword' | 'function' | 'string' | 'number' | 'text'

export const TOKEN_CLASS: Record<Token, string> = {
  keyword: 'text-[#7aa2ff]',
  function: 'text-[#5cd3ff]',
  string: 'text-[#8ef0c4]',
  number: 'text-[#ffb86b]',
  text: 'text-[#dfe9ff]',
}

export const CODE_FILE = 'launch.ts'

export const CODE: [Token, string][][] = [
  [['keyword', 'export async function '], ['function', 'launch'], ['text', '(idea) {']],
  [['keyword', '  const '], ['text', 'app = '], ['keyword', 'await '], ['function', 'build'], ['text', '(idea, {']],
  [['text', '    design: '], ['string', "'premium'"], ['text', ',']],
  [['text', '    responsive: '], ['number', 'true'], ['text', ',']],
  [['text', '    languages: ['], ['string', "'ar'"], ['text', ', '], ['string', "'fr'"], ['text', ', '], ['string', "'en'"], ['text', '],']],
  [['text', '  })']],
  [['keyword', '  return '], ['function', 'deploy'], ['text', '(app)']],
  [['text', '}']],
]

export const TERMINAL: { text: string; tone: 'command' | 'success' | 'live' }[] = [
  { text: '❯ npm run build', tone: 'command' },
  { text: '✓ compiled in 1.2s', tone: 'success' },
  { text: '✓ 48 tests passed', tone: 'success' },
  { text: '▲ live on djilali.pages.dev', tone: 'live' },
]

export const TERMINAL_TONE = { command: 'text-[#dfe9ff]', success: 'text-[#8ef0c4]', live: 'text-[#5cd3ff]' } as const

/** Full-page screenshots shown on the devices (Speaking Pre-Test), with each screen's aspect ratio. */
export const SCREENS = {
  monitor: { src: '/img/projects/pretest-desk-full.webp', width: 900, height: 916, screen: 16 / 10 },
  phone: { src: '/img/projects/pretest-mob-full.webp', width: 360, height: 1530, screen: 9 / 19.5 },
} as const

/** How far (in % of the image height) a screenshot can scroll before its bottom reaches the screen's bottom. */
export function scrollRange(s: { width: number; height: number; screen: number }) {
  const visible = s.width / s.screen
  return `-${Math.max(0, (1 - visible / s.height) * 100).toFixed(1)}%`
}
