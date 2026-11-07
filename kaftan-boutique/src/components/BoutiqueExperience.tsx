import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { useModelStore } from '../hooks/useModelControls'
import { hasWebGL } from '../lib/env'
import { Lineup } from './Lineup'
import { ProductPanel } from './ProductPanel'
import { WebGLFallback } from './WebGLFallback'

const BoutiqueScene = lazy(() => import('./BoutiqueScene'))

/** The immersive boutique: 3D scene + model lineup + product panel. Fills its (relative) parent. */
export function BoutiqueExperience({ children }: { children?: ReactNode }) {
  const webgl = useMemo(hasWebGL, [])
  const selected = useModelStore((s) => s.selectedId)
  if (!webgl) return <WebGLFallback />
  return (
    <>
      <Suspense fallback={<div className="shimmer absolute inset-0" role="status" aria-label="Loading the 3D boutique" />}>
        <BoutiqueScene />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 z-10">
        {!selected && children}
        <div className={`absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${selected ? 'max-md:hidden md:right-[430px]' : ''}`}>
          {!selected && (
            <p className="rounded-full bg-cocoa-950/50 px-4 py-1.5 text-center text-[0.62rem] tracking-[0.24em] text-beige-200 uppercase backdrop-blur">
              Tap a model to inspect it · drag to look around · pinch or scroll to zoom
            </p>
          )}
          <Lineup />
        </div>
      </div>
      <ProductPanel />
    </>
  )
}
