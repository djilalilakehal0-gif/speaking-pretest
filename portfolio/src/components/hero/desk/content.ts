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

export const SCREENS = {
  monitor: { src: '/img/projects/napo-desk-full.webp', width: 900, height: 5200 },
  phone: { src: '/img/projects/napo-mob-full.webp', width: 360, height: 4200 },
} as const
