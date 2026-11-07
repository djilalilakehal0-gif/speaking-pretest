import { ContactShadows } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { ACESFilmicToneMapping, MathUtils, type Group } from 'three'
import type { Product } from '../data/products'
import { modelActions, useModelStore } from '../hooks/useModelControls'
import { isCoarsePointer, prefersReducedMotion } from '../lib/env'
import { useDragRotate } from './ModelStage'
import { CameraRig } from './three/CameraRig'
import { KaftanFigure } from './three/KaftanFigure'
import { SceneLighting } from './three/SceneLighting'
import { useThreeLifecycle } from './three/lifecycle'
import { useProgress } from '@react-three/drei'

const HOME = { position: [0.6, 1.25, 3.6] as [number, number, number], target: [0, 0.95, 0] as [number, number, number] }

function Figure({ product }: { product: Product }) {
  const turn = useRef<Group>(null)
  const rotation = useModelStore((s) => s.models[product.id]?.rotation ?? 0)
  const reduced = useMemo(prefersReducedMotion, [])
  const startDrag = useDragRotate(product.id, true)
  useFrame((_, dt) => {
    if (!turn.current) return
    const target = MathUtils.degToRad(rotation)
    turn.current.rotation.y += (target - turn.current.rotation.y) * (reduced ? 1 : 1 - Math.exp(-dt * 7))
  })
  return (
    <group
      ref={turn}
      onPointerDown={startDrag}
      onPointerOver={() => (document.body.style.cursor = 'grab')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <KaftanFigure url={product.model} />
    </group>
  )
}

function Progress() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status">
      <div className="shimmer rounded-full border border-champagne/20 px-5 py-2 text-[0.65rem] tracking-[0.3em] text-champagne uppercase">
        Loading 3D model · {Math.round(progress)}%
      </div>
    </div>
  )
}

/** Live 3D viewer for one product (product page / quick view). Shares the product's rotation state. */
export default function ModelViewer({ product }: { product: Product }) {
  useThreeLifecycle()
  const coarse = useMemo(isCoarsePointer, [])
  return (
    <div
      className="absolute inset-0 outline-none"
      tabIndex={0}
      role="application"
      aria-label={`3D view of the ${product.name}. Drag to turn the model, pinch or scroll to zoom. Left and right arrows rotate.`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); modelActions.rotateLeft(product.id) }
        if (e.key === 'ArrowRight') { e.preventDefault(); modelActions.rotateRight(product.id) }
      }}
      data-testid="product-viewer"
    >
      <Canvas
        shadows
        dpr={coarse ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: 32, near: 0.1, far: 30, position: HOME.position }}
      >
        <color attach="background" args={['#241710']} />
        <SceneLighting shadowSize={1024} />
        <spotLight position={[1.2, 3.4, 2.4]} angle={0.5} penumbra={0.9} intensity={26} decay={1.6} color="#ffe2bd" />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[1.6, 64]} />
          <meshStandardMaterial color="#d9c6a8" roughness={0.3} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
          <ringGeometry args={[1.56, 1.6, 96]} />
          <meshStandardMaterial color="#b8894a" metalness={1} roughness={0.3} />
        </mesh>
        <ContactShadows position={[0, 0.003, 0]} opacity={0.55} scale={3} blur={2.4} far={1.2} resolution={512} />
        <Suspense fallback={null}>
          <Figure product={product} />
        </Suspense>
        <CameraRig home={HOME} maxDistance={5.5} />
      </Canvas>
      <Progress />
    </div>
  )
}
