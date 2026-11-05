/**
 * Interactive 3D cans (React Three Fiber). Loaded lazily by sections/Beverages.tsx, never on first paint.
 * - Each can is its own object: drag it horizontally to spin it (with inertia); it keeps idling on its own.
 * - The pair floats, leans toward the pointer and, driven by `progress` (scroll 0→1), opens out while the camera dollies in.
 * - Lighting is built from local light-formers, so nothing is downloaded besides the two GLB files.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

const base = import.meta.env.BASE_URL
export const CAN_MODELS = { coca: `${base}models/coca-cola.glb`, pepsi: `${base}models/pepsi.glb` }

type Props = {
  progress: MutableRefObject<number>
  reduced: boolean
  active: boolean
  onReady?: () => void
}

/** Condensation uses glTF transmission; a clear-coated transparent material looks the same here and is far cheaper. */
function tuneMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    const mat = mesh.material as THREE.MeshPhysicalMaterial
    if (mesh.name.toLowerCase().includes('condensation')) {
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: '#ffffff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.38,
        clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.33, specularIntensity: 1, envMapIntensity: 2.2,
      })
    } else if (mat && 'envMapIntensity' in mat) {
      mat.envMapIntensity = mat.metalness > 0.9 ? 1.6 : 1.15
      if (mat.map) mat.map.anisotropy = 8
    }
  })
}

function Can({ url, side, progress, reduced, idleSpeed }: { url: string; side: -1 | 1; progress: MutableRefObject<number>; reduced: boolean; idleSpeed: number }) {
  const { scene } = useGLTF(url, false, false)
  const model = useMemo(() => { const s = scene.clone(true); tuneMaterials(s); return s }, [scene])
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const drag = useRef({ active: false, lastX: 0, velocity: 0 })
  const { gl } = useThree()

  // Drag to spin: horizontal movement only, so vertical swipes still scroll the page on phones.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d.active) return
      const dx = e.clientX - d.lastX
      d.lastX = e.clientX
      d.velocity = dx * 0.012
      if (spin.current) spin.current.rotation.y += dx * 0.012
    }
    const up = () => { drag.current.active = false; gl.domElement.style.cursor = '' }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [gl])

  useFrame((_, delta) => {
    const d = drag.current
    const p = progress.current
    if (spin.current && !d.active) {
      spin.current.rotation.y += d.velocity + (reduced ? 0 : idleSpeed * delta)
      d.velocity *= 0.94
    }
    if (group.current) {
      // scroll choreography: the cans start close and tilted, then open out and straighten
      const spread = THREE.MathUtils.lerp(0.036, 0.058, THREE.MathUtils.smoothstep(p, 0.1, 0.55))
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, side * spread, 6, delta)
      const tilt = side * THREE.MathUtils.lerp(0.18, 0.05, THREE.MathUtils.smoothstep(p, 0.1, 0.6))
      group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, -tilt, 6, delta)
    }
  })

  return (
    <group ref={group} position={[side * 0.036, 0, 0]}>
      <Float enabled={!reduced} speed={1.6} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.004, 0.004]}>
        <group
          ref={spin}
          rotation={[0, side * -0.35, 0]}
          onPointerDown={(e) => {
            e.stopPropagation()
            drag.current = { active: true, lastX: e.nativeEvent.clientX, velocity: 0 }
            gl.domElement.style.cursor = 'grabbing'
          }}
          onPointerOver={() => { if (!drag.current.active) gl.domElement.style.cursor = 'grab' }}
          onPointerOut={() => { if (!drag.current.active) gl.domElement.style.cursor = '' }}
        >
          <primitive object={model} />
        </group>
      </Float>
    </group>
  )
}

/** Camera dolly + pointer parallax for the whole pair. */
function Rig({ progress, reduced, children }: { progress: MutableRefObject<number>; reduced: boolean; children: React.ReactNode }) {
  const pair = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  useFrame((state, delta) => {
    const p = progress.current
    const aspect = size.width / size.height
    // distance at which the can fills ~60 % of the height, or at which both cans still fit the width
    const halfTan = Math.tan(THREE.MathUtils.degToRad(15))
    const fit = Math.max(0.1157 / 0.6 / (2 * halfTan), 0.215 / (2 * halfTan * aspect))
    const z = THREE.MathUtils.lerp(fit * 1.18, fit * 0.98, THREE.MathUtils.smoothstep(p, 0, 0.6))
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 4, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, THREE.MathUtils.lerp(0.03, 0.008, p), 4, delta)
    camera.lookAt(0, 0, 0)
    if (pair.current && !reduced) {
      pair.current.rotation.y = THREE.MathUtils.damp(pair.current.rotation.y, state.pointer.x * 0.22, 3, delta)
      pair.current.rotation.x = THREE.MathUtils.damp(pair.current.rotation.x, -state.pointer.y * 0.08, 3, delta)
    }
  })
  return <group ref={pair}>{children}</group>
}

function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => { onReady?.() }, [onReady])
  return null
}

export default function CansScene({ progress, reduced, active, onReady }: Props) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.01, far: 10, position: [0, 0.03, 0.7] }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05 }}
      style={{ touchAction: 'pan-y' }}
      aria-hidden
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[-0.4, 0.6, 0.6]} intensity={1.6} color="#fff1dc" />
      <spotLight position={[0.5, 0.4, -0.3]} angle={0.5} penumbra={1} intensity={6} color="#C6A46C" />
      <Suspense fallback={null}>
      <Rig progress={progress} reduced={reduced}>
        <Can url={CAN_MODELS.coca} side={-1} progress={progress} reduced={reduced} idleSpeed={0.35} />
        <Can url={CAN_MODELS.pepsi} side={1} progress={progress} reduced={reduced} idleSpeed={-0.3} />
      </Rig>
      <ContactShadows position={[0, -0.064, 0]} opacity={0.7} scale={0.35} blur={2.4} far={0.12} resolution={512} color="#000000" />
      {/* studio reflections, made locally (no HDR download) */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#0b0a0a']} />
        <Lightformer form="rect" intensity={3.2} color="#fff4e6" position={[-1.2, 0.6, 1.2]} scale={[1.2, 2.6, 1]} rotation-y={0.8} />
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[1.3, 0.3, 1.0]} scale={[0.8, 2.4, 1]} rotation-y={-0.9} />
        <Lightformer form="rect" intensity={1.6} color="#C6A46C" position={[0, 1.5, 0]} scale={[2, 0.6, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="ring" intensity={1.4} color="#6D1022" position={[0, 0.2, -1.4]} scale={1.4} />
      </Environment>
      <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(CAN_MODELS.coca, false, false)
useGLTF.preload(CAN_MODELS.pepsi, false, false)
