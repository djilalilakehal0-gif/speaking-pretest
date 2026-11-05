/**
 * Scroll choreography of the desk scene, in hero progress (0 = top of the hero,
 * 1 = end of the sticky range). Tweak the whole sequence from this one file.
 */
export const TIMELINE = {
  sceneTilt: { at: [0, 1], deg: [-7, 6] },
  portraitScale: { at: [0, 0.4], scale: [0.94, 1] },
  laptopLid: { at: [0, 0.28], deg: [62, -6] },
  codeCaret: { at: [0.25, 0.95], y: ['0%', '700%'] },
  monitorTurn: { at: [0, 0.3], deg: [34, 16], x: ['-6%', '0%'] },
  monitorScroll: { at: [0.22, 0.96], y: ['0%', '-86%'] },
  phoneRise: { at: [0, 0.35], y: ['12%', '0%'] },
  phoneScroll: { at: [0.3, 0.98], y: ['0%', '-78%'] },
  terminalDrop: { at: [0, 0.35], y: ['-10%', '0%'] },
  /** Terminal line i lights up at `first + i * step`. */
  terminalLines: { first: 0.3, step: 0.14, fade: 0.06 },
  iconRows: { at: [0, 1], shift: '34%' },
} as const
