'use client'

import { useEffect } from 'react'
import { asset } from '@/lib/asset'

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.min.js'

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded) resolve()
      else existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = () => {
      s.dataset.loaded = '1'
      resolve()
    }
    s.onerror = () => reject(new Error(`failed to load ${src}`))
    document.body.appendChild(s)
  })
}

/** Full-screen particle cloud behind the page (public/js/field.js, three.js from the CDN). */
export function Field() {
  useEffect(() => {
    loadScript(THREE_URL)
      .then(() => loadScript(asset('/js/field.js')))
      .catch(() => {
        /* no network or no WebGL: the page stays on a plain black background */
      })
  }, [])
  // data-portrait: the 3D photo panel drawn under the brand (public/models)
  return <canvas id="bg" aria-hidden="true" data-portrait={asset('/models/djilali-portrait.glb')} />
}
