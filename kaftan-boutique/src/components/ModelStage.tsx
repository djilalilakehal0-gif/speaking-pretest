import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, Object3D, type Group, type MeshStandardMaterial } from 'three'
import type { Product } from '../data/products'
import { getModelStore, modelActions, useModelStore } from '../hooks/useModelControls'
import { BASE_YAW, slotPosition } from '../lib/layout'
import { prefersReducedMotion } from '../lib/env'
import { KaftanFigure } from './three/KaftanFigure'
import { useOrbitLock } from './three/orbitLock'

/** Degrees of rotation per pixel of horizontal drag on the selected model. */
const DRAG_DEG_PER_PX = 0.45

/** Shared by the boutique and the product viewer: drag on a model to turn it (0–260°). */
export function useDragRotate(id: string, enabled: boolean) {
  const lock = useOrbitLock()
  const start = useRef<{ x: number; deg: number; pointer: number } | null>(null)
  useEffect(() => {
    const end = () => {
      if (!start.current) return
      start.current = null
      lock(false)
      document.body.style.cursor = ''
    }
    const move = (e: PointerEvent) => {
      if (!start.current || e.pointerId !== start.current.pointer) return
      modelActions.setRotation(id, start.current.deg + (e.clientX - start.current.x) * DRAG_DEG_PER_PX)
    }
    const up = (e: PointerEvent) => {
      if (start.current && e.pointerId === start.current.pointer) end()
    }
    // a second finger turns the gesture into a pinch-zoom: stop turning the model
    const down = (e: PointerEvent) => {
      if (start.current && e.pointerId !== start.current.pointer) end()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('pointerdown', down)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('pointerdown', down)
    }
  }, [id, lock])
  return (e: ThreeEvent<PointerEvent>) => {
    if (!enabled || start.current) return
    e.stopPropagation()
    start.current = { x: e.nativeEvent.clientX, deg: getModelStore().models[id]?.rotation ?? 0, pointer: e.nativeEvent.pointerId }
    lock(true)
    document.body.style.cursor = 'grabbing'
  }
}

/** Loading state: a faint champagne column where the model will stand. */
function Loading() {
  const ref = useRef<MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.opacity = 0.12 + 0.08 * Math.sin(clock.elapsedTime * 2.4)
  })
  return (
    <mesh position={[0, 0.87, 0]}>
      <cylinderGeometry args={[0.16, 0.34, 1.74, 32, 1, true]} />
      <meshStandardMaterial ref={ref} color="#e8d5b0" transparent opacity={0.15} depthWrite={false} />
    </mesh>
  )
}

export function ModelStage({ product }: { product: Product }) {
  const outer = useRef<Group>(null)
  const turn = useRef<Group>(null)
  const model = useModelStore((s) => s.models[product.id])
  const selected = useModelStore((s) => s.selectedId === product.id)
  const [hovered, setHovered] = useState(false)
  const reduced = useMemo(prefersReducedMotion, [])
  const startDrag = useDragRotate(product.id, selected)
  const [spotTarget] = useState(() => new Object3D())
  const slot = slotPosition(product.boutiqueSlot)
  const ring = useRef<MeshStandardMaterial>(null)

  // Place immediately on mount (no glide from the origin).
  useEffect(() => {
    const [x, , z] = slotPosition(product.boutiqueSlot, model.offset)
    outer.current?.position.set(x, 0, z)
    if (turn.current) turn.current.rotation.y = BASE_YAW + MathUtils.degToRad(model.rotation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 7)
    const [tx, , tz] = slotPosition(product.boutiqueSlot, model.offset)
    const o = outer.current
    if (o) {
      o.position.x += (tx - o.position.x) * k
      o.position.z += (tz - o.position.z) * k
    }
    const t = turn.current
    if (t) {
      const target = BASE_YAW + MathUtils.degToRad(model.rotation)
      t.rotation.y += (target - t.rotation.y) * k // range is bounded: never wraps, never spins
    }
    if (ring.current) {
      const goal = selected ? 2.4 : hovered ? 1.2 : 0.15
      ring.current.emissiveIntensity += (goal - ring.current.emissiveIntensity) * (reduced ? 1 : 1 - Math.exp(-dt * 6))
    }
  })

  return (
    <group>
      {/* discreet brass floor marker at the model's home slot */}
      <mesh rotation-x={-Math.PI / 2} position={[slot[0], 0.003, slot[2]]}>
        <ringGeometry args={[0.5, 0.52, 72]} />
        <meshStandardMaterial ref={ring} color="#b8894a" metalness={1} roughness={0.3} emissive="#ffcf8a" emissiveIntensity={0.15} />
      </mesh>
      <group ref={outer}>
        {/* the model's own architectural spotlight follows it */}
        <primitive object={spotTarget} position={[0, 0.95, 0]} />
        <spotLight
          position={[0.35, 3.3, 0.9]}
          target={spotTarget}
          angle={0.42}
          penumbra={0.85}
          intensity={selected ? 34 : 20}
          distance={7}
          decay={1.6}
          color="#ffe2bd"
        />
        <group
          ref={turn}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = selected ? 'grab' : 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = ''
          }}
          onPointerDown={startDrag}
          onClick={(e) => {
            e.stopPropagation()
            if (e.delta > 6) return
            if (!selected) modelActions.select(product.id)
          }}
        >
          <Suspense fallback={<Loading />}>
            <KaftanFigure url={product.model} />
          </Suspense>
        </group>
      </group>
    </group>
  )
}
