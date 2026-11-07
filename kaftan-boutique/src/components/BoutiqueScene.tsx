import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, type KeyboardEvent } from 'react'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import { PRODUCTS } from '../data/products'
import { getModelStore, modelActions } from '../hooks/useModelControls'
import { isCoarsePointer } from '../lib/env'
import { DEFAULT_CAMERA } from '../lib/layout'
import { ModelStage } from './ModelStage'
import { BoutiqueRoom } from './three/BoutiqueRoom'
import { CameraRig } from './three/CameraRig'
import { SceneLighting } from './three/SceneLighting'
import { useThreeLifecycle } from './three/lifecycle'

function LoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center" role="status" aria-live="polite">
      <div className="rounded-full border border-champagne/20 bg-cocoa-900/70 px-5 py-2 text-[0.65rem] tracking-[0.3em] text-champagne uppercase backdrop-blur">
        Dressing the boutique · {Math.round(progress)}%
      </div>
    </div>
  )
}

/** Keyboard: ←/→ rotate, ↑/↓ move, Esc deselect, 1–5 select a model. */
export function onBoutiqueKey(e: KeyboardEvent) {
  const { selectedId } = getModelStore()
  const n = Number(e.key)
  if (n >= 1 && n <= PRODUCTS.length) {
    modelActions.select(PRODUCTS.find((p) => p.boutiqueSlot === n - 1)!.id)
    return
  }
  if (e.key === 'Escape') {
    modelActions.select(null)
    modelActions.camera('reset')
    return
  }
  if (!selectedId) return
  const map: Record<string, () => void> = {
    ArrowLeft: () => modelActions.rotateLeft(selectedId),
    ArrowRight: () => modelActions.rotateRight(selectedId),
    ArrowUp: () => modelActions.moveForward(selectedId),
    ArrowDown: () => modelActions.moveBackward(selectedId),
  }
  if (map[e.key]) {
    e.preventDefault()
    map[e.key]()
  }
}

export default function BoutiqueScene() {
  useThreeLifecycle()
  const coarse = useMemo(isCoarsePointer, [])
  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])
  return (
    <div
      className="absolute inset-0 outline-none"
      tabIndex={0}
      onKeyDown={onBoutiqueKey}
      aria-label="3D boutique. Click a model to select it. Keys: 1 to 5 select a model, left and right arrows rotate, up and down arrows move, Escape deselects."
      role="application"
      data-testid="boutique-canvas"
    >
      <Canvas
        shadows={{ type: PCFSoftShadowMap }}
        dpr={coarse ? [1, 1.5] : [1, 1.75]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        camera={{ fov: 38, near: 0.1, far: 40, position: DEFAULT_CAMERA.position }}
      >
        <color attach="background" args={['#1c120d']} />
        <fog attach="fog" args={['#1c120d', 11, 22]} />
        <SceneLighting shadowSize={coarse ? 1024 : 2048} />
        <BoutiqueRoom reflections={!coarse} />
        {PRODUCTS.map((p) => (
          <ModelStage key={p.id} product={p} />
        ))}
        <CameraRig home={DEFAULT_CAMERA} focusOnSelection />
      </Canvas>
      <LoadingOverlay />
    </div>
  )
}
