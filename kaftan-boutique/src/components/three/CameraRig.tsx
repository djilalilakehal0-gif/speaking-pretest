import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { getModelStore, useModelStore } from '../../hooks/useModelControls'
import { prefersReducedMotion } from '../../lib/env'
import { BASE_YAW, slotPosition } from '../../lib/layout'
import { PRODUCTS } from '../../data/products'

// Camera flights must take their real duration even when frames are slow (low-end devices).
gsap.ticker.lagSmoothing(0)

export const MIN_DISTANCE = 1.1
export const MAX_DISTANCE = 9.5
export const HERO_DISTANCE = 3.5

interface Props {
  home: { position: [number, number, number]; target: [number, number, number] }
  /** where to look on the selected model (boutique) — omitted in the single-product viewer */
  focusOnSelection?: boolean
  maxDistance?: number
}

/**
 * Orbit camera with limits (never under the floor, never inside a model) and the
 * focus / reset / zoom commands sent by the on-screen controls.
 */
export function CameraRig({ home, focusOnSelection = false, maxDistance = MAX_DISTANCE }: Props) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const sizeRef = useRef(size)
  sizeRef.current = size
  const command = useModelStore((s) => s.cameraCommand)
  const first = useRef(true)
  const frames = useRef(0)
  useFrame(() => {
    frames.current++
  })

  useEffect(() => {
    // Read-only hook used by the automated acceptance tests (scripts/e2e.mjs).
    ;(window as unknown as { __kaftanCamera: () => { distance: number; y: number; frames: number } }).__kaftanCamera = () => ({
      distance: controls.current ? camera.position.distanceTo(controls.current.target) : 0,
      y: camera.position.y,
      frames: frames.current,
    })
    ;(window as unknown as { __kaftanProject: (x: number, y: number, z: number) => [number, number] }).__kaftanProject = (x, y, z) => {
      const v = new Vector3(x, y, z).project(camera)
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height]
    }
  }, [camera, size])

  useEffect(() => {
    camera.position.set(...home.position)
    controls.current?.target.set(...home.target)
    controls.current?.update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (first.current) {
      first.current = false
      if (!focusOnSelection || !getModelStore().selectedId) return
    }
    if (!command || !controls.current) return
    const c = controls.current
    const dur = prefersReducedMotion() ? 0 : 1.1
    const fly = (pos: Vector3, target: Vector3) => {
      gsap.killTweensOf([camera.position, c.target])
      gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease: 'power3.inOut', onUpdate: () => c.update() })
      gsap.to(c.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease: 'power3.inOut' })
    }
    if (command.kind === 'reset') {
      fly(new Vector3(...home.position), new Vector3(...home.target))
    } else if (command.kind === 'focus') {
      const { selectedId, models } = getModelStore()
      const p = PRODUCTS.find((x) => x.id === selectedId)
      if (!focusOnSelection || !p) {
        fly(new Vector3(...home.position), new Vector3(...home.target))
        return
      }
      // Hero framing: in front of the model (along its base facing), at eye level of the garment.
      // The product panel covers the right side (desktop) or the lower part (mobile): offset the
      // target so the model sits in the visible area.
      const [x, , z] = slotPosition(p.boutiqueSlot, models[p.id]?.offset ?? 0)
      const yaw = BASE_YAW + 0.18
      const wide = sizeRef.current.width >= 768
      const dist = wide ? HERO_DISTANCE : HERO_DISTANCE + 0.9
      const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
      const target = new Vector3(x, wide ? 0.98 : 0.5, z).addScaledVector(right, wide ? 0.55 : 0)
      const pos = new Vector3(x + Math.sin(yaw) * dist, wide ? 1.4 : 1.2, z + Math.cos(yaw) * dist).addScaledVector(right, wide ? 0.55 : 0)
      fly(pos, target)
    } else {
      const dir = camera.position.clone().sub(c.target)
      const len = dir.length()
      const next = Math.min(maxDistance, Math.max(MIN_DISTANCE, len * (command.kind === 'zoom-in' ? 0.72 : 1.38)))
      const pos = c.target.clone().add(dir.setLength(next))
      gsap.killTweensOf(camera.position)
      gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur * 0.6, ease: 'power2.out', onUpdate: () => c.update() })
    }
  }, [command, camera, home, focusOnSelection, maxDistance])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={maxDistance}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.06}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  )
}
