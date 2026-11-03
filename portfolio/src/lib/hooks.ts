'use client'
import { useEffect, useState } from 'react'

/** Subscribe to a media query. Returns `false` on the server and first render. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return matches
}

/** True on devices with a precise hovering pointer (mouse/trackpad) and no reduced-motion preference. */
export function useFinePointer() {
  return useMediaQuery('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
}
