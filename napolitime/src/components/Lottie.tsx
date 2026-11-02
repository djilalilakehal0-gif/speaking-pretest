import { useEffect, useRef } from 'react'

/** Plays a Lottie JSON once. lottie-web's light SVG player is loaded lazily (code-split). */
export function Lottie({ data, size = 56, play = 0 }: { data: object; size?: number; play?: number }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let anim: { destroy: () => void } | undefined
    let cancelled = false
    import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (cancelled || !el.current) return
      anim = lottie.loadAnimation({ container: el.current, renderer: 'svg', loop: false, autoplay: true, animationData: data })
    })
    return () => { cancelled = true; anim?.destroy() }
  }, [data, play])
  return <div ref={el} style={{ width: size, height: size }} aria-hidden />
}
