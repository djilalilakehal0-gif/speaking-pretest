export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

let webgl: boolean | null = null
export function hasWebGL(): boolean {
  if (webgl !== null) return webgl
  try {
    const c = document.createElement('canvas')
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webgl = false
  }
  return webgl
}

export const isCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
