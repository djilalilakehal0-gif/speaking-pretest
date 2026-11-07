import { Instance, Instances, MeshReflectorMaterial } from '@react-three/drei'
import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { PRODUCTS } from '../../data/products'
import { slotPosition } from '../../lib/layout'

/* ------------------------------------------------------------------------------------------------
 * Procedural textures (painted once on a canvas: nothing to download)
 * ---------------------------------------------------------------------------------------------- */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function marbleTexture(): Texture {
  const s = 1024
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, s, s)
  grad.addColorStop(0, '#e9dcc8')
  grad.addColorStop(0.5, '#e2d2bb')
  grad.addColorStop(1, '#eadfcd')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const r = rng(7)
  // soft clouds
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(${150 + r() * 40},${120 + r() * 30},${90 + r() * 30},${0.025 + r() * 0.03})`
    g.beginPath()
    g.arc(r() * s, r() * s, 30 + r() * 140, 0, Math.PI * 2)
    g.fill()
  }
  // veins
  g.lineCap = 'round'
  for (let i = 0; i < 26; i++) {
    let x = r() * s
    let y = r() * s
    g.strokeStyle = `rgba(${110 + r() * 40},${84 + r() * 30},${60 + r() * 20},${0.12 + r() * 0.22})`
    g.lineWidth = 0.6 + r() * 2.2
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < 14; k++) {
      x += (r() - 0.3) * 90
      y += (r() - 0.5) * 70
      g.lineTo(x, y)
    }
    g.stroke()
  }
  // stone tiles: 4 x 4 per texture with fine joints
  g.strokeStyle = 'rgba(90,64,44,0.35)'
  g.lineWidth = 2
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(0, (i * s) / 4); g.lineTo(s, (i * s) / 4); g.stroke()
    g.beginPath(); g.moveTo((i * s) / 4, 0); g.lineTo((i * s) / 4, s); g.stroke()
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(3, 3)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

function plasterTexture(base: string): Texture {
  const s = 512
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  g.fillStyle = base
  g.fillRect(0, 0, s, s)
  const r = rng(3)
  for (let i = 0; i < 2600; i++) {
    const a = r() * 0.06
    g.fillStyle = r() > 0.5 ? `rgba(255,240,220,${a})` : `rgba(40,20,10,${a})`
    const w = 4 + r() * 28
    g.fillRect(r() * s, r() * s, w, w * (0.2 + r() * 0.5))
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(4, 2)
  t.colorSpace = SRGBColorSpace
  return t
}

const BRASS = { color: '#b8894a', metalness: 1, roughness: 0.34 }
const WOOD = { color: '#4a2e1e', roughness: 0.55 }

/* ------------------------------------------------------------------------------------------------ */
function ArchNiche({ x, z, rotY = 0 }: { x: number; z: number; rotY?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotY}>
      {/* recess */}
      <mesh position={[0, 1.35, 0.02]} receiveShadow>
        <boxGeometry args={[1.2, 2.3, 0.04]} />
        <meshStandardMaterial color="#3f2a1f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.5, 0.02]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 48, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#3f2a1f" roughness={0.9} />
      </mesh>
      {/* warm cove light line */}
      <mesh position={[0, 0.32, 0.06]}>
        <boxGeometry args={[1.12, 0.012, 0.012]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffc27a" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      {/* stone shelves with folded fabric and a vase */}
      {[0.9, 1.65].map((y) => (
        <mesh key={y} position={[0, y, 0.18]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.04, 0.32]} />
          <meshStandardMaterial color="#d9c7ab" roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.3, 1.86, 0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.38, 32]} />
        <meshStandardMaterial color="#c8b08a" roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh position={[-0.28, 1.72, 0.2]} castShadow>
        <sphereGeometry args={[0.08, 24, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  )
}

function FoldedTextiles() {
  // Folded fabric stacks on the shelving: one instanced mesh for all of them.
  const items = useMemo(() => {
    const colours = ['#4a2618', '#6b1626', '#c9ae86', '#24160f', '#a3161f', '#8a6a4a', '#e2cfaa']
    const out: { p: [number, number, number]; c: string; s: number }[] = []
    let k = 0
    for (const y of [0.62, 1.22, 1.82]) {
      for (const z of [-3.6, -2.95, -2.3, -1.65]) {
        for (let h = 0; h < 3; h++) {
          out.push({ p: [-4.48, y + 0.045 + h * 0.07, z], c: colours[k++ % colours.length], s: 1 - h * 0.04 })
        }
      }
    }
    return out
  }, [])
  return (
    <Instances limit={items.length} castShadow receiveShadow>
      <boxGeometry args={[0.36, 0.065, 0.46]} />
      <meshStandardMaterial roughness={0.6} />
      {items.map((it, i) => (
        <Instance key={i} position={it.p} color={it.c} scale={[it.s, 1, it.s]} />
      ))}
    </Instances>
  )
}

function Shelving() {
  return (
    <group>
      {/* wooden shelving unit against the left wall */}
      <mesh position={[-4.56, 1.25, -2.62]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.5, 2.6]} />
        <meshStandardMaterial {...WOOD} />
      </mesh>
      {[0.6, 1.2, 1.8, 2.4].map((y) => (
        <mesh key={y} position={[-4.42, y, -2.62]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.035, 2.6]} />
          <meshStandardMaterial {...WOOD} />
        </mesh>
      ))}
      {[-3.92, -1.32].map((z) => (
        <mesh key={z} position={[-4.42, 1.25, z]} castShadow>
          <boxGeometry args={[0.36, 2.5, 0.035]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
      <FoldedTextiles />
    </group>
  )
}

function GarmentRail() {
  // brushed-brass rail on the right wall with draped satin lengths
  const drapes = ['#c9ae86', '#4a2618', '#e2cfaa', '#6b1626', '#3b2418']
  return (
    <group position={[5.5, 0, -2.6]}>
      <mesh position={[-0.18, 1.72, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.016, 0.016, 2.4, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {[-1.2, 1.2].map((z) => (
        <mesh key={z} position={[-0.09, 1.72, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
      {drapes.map((c, i) => (
        <group key={i} position={[-0.18, 1.72, -0.9 + i * 0.45]}>
          <mesh position={[0, -0.02, 0]}>
            <torusGeometry args={[0.03, 0.006, 8, 24]} />
            <meshStandardMaterial {...BRASS} />
          </mesh>
          <mesh position={[0, -0.62, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.13, 1.2, 24, 1, true]} />
            <meshStandardMaterial color={c} roughness={0.3} side={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Lounge() {
  return (
    <group>
      {/* velvet ottoman */}
      <mesh position={[2.85, 0.22, 0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.44, 48]} />
        <meshStandardMaterial color="#5a2f22" roughness={0.85} />
      </mesh>
      <mesh position={[2.85, 0.03, 0.4]}>
        <cylinderGeometry args={[0.47, 0.47, 0.06, 48]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {/* marble side table with books */}
      <mesh position={[3.75, 0.45, -0.55]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 40]} />
        <meshStandardMaterial color="#e7dac6" roughness={0.2} />
      </mesh>
      <mesh position={[3.75, 0.22, -0.55]} castShadow>
        <cylinderGeometry args={[0.03, 0.12, 0.44, 24]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[3.72, 0.5, -0.55]} rotation-y={0.3} castShadow>
        <boxGeometry args={[0.26, 0.05, 0.2]} />
        <meshStandardMaterial color="#2a1a12" roughness={0.6} />
      </mesh>
      <mesh position={[3.74, 0.545, -0.55]} rotation-y={-0.15} castShadow>
        <boxGeometry args={[0.22, 0.04, 0.17]} />
        <meshStandardMaterial color="#c9a15a" roughness={0.5} />
      </mesh>
      {/* full-length mirror, brass frame */}
      <group position={[-4.7, 0, 0.6]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 1.05, 0.03]}>
          <boxGeometry args={[0.8, 1.9, 0.02]} />
          <meshStandardMaterial color="#8d8a85" metalness={1} roughness={0.06} />
        </mesh>
        <mesh position={[0, 1.05, 0.02]}>
          <boxGeometry args={[0.88, 1.98, 0.03]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      </group>
    </group>
  )
}

function Pendants() {
  return (
    <group>
      {PRODUCTS.map((p) => {
        const [x, , z] = slotPosition(p.boutiqueSlot)
        return (
          <group key={p.id} position={[x + 0.25, 0, z + 0.25]}>
            <mesh position={[0, 3.35, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.5, 6]} />
              <meshStandardMaterial color="#2a1a12" />
            </mesh>
            <mesh position={[0, 3.08, 0]}>
              <cylinderGeometry args={[0.16, 0.2, 0.06, 32]} />
              <meshStandardMaterial {...BRASS} />
            </mesh>
            <mesh position={[0, 3.045, 0]} rotation-x={Math.PI / 2}>
              <circleGeometry args={[0.17, 32]} />
              <meshStandardMaterial color="#fff1d6" emissive="#ffd59a" emissiveIntensity={3} toneMapped={false} side={2} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export function BoutiqueRoom({ reflections }: { reflections: boolean }) {
  const marble = useMemo(marbleTexture, [])
  const wall = useMemo(() => plasterTexture('#6e4d3b'), [])
  const wallLight = useMemo(() => plasterTexture('#8a6650'), [])

  return (
    <group>
      {/* polished stone floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0.5, 0, -1]} receiveShadow>
        <planeGeometry args={[11, 15]} />
        {reflections ? (
          <MeshReflectorMaterial
            map={marble}
            resolution={512}
            mixBlur={1}
            mixStrength={0.6}
            blur={[280, 90]}
            roughness={0.32}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            metalness={0}
            color="#ffffff"
            mirror={0.35}
          />
        ) : (
          <meshStandardMaterial map={marble} roughness={0.28} />
        )}
      </mesh>
      {/* walls */}
      <mesh position={[0.5, 1.85, -6.4]} receiveShadow>
        <planeGeometry args={[11, 3.7]} />
        <meshStandardMaterial map={wall} roughness={0.92} />
      </mesh>
      <mesh position={[-4.8, 1.85, -1]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[15, 3.7]} />
        <meshStandardMaterial map={wallLight} roughness={0.92} />
      </mesh>
      <mesh position={[5.8, 1.85, -1]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[15, 3.7]} />
        <meshStandardMaterial map={wallLight} roughness={0.92} />
      </mesh>
      {/* ceiling + brass cornice */}
      <mesh position={[0.5, 3.7, -1]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[11, 15]} />
        <meshStandardMaterial color="#2a1a12" roughness={1} />
      </mesh>
      <mesh position={[0.5, 3.62, -6.36]}>
        <boxGeometry args={[11, 0.05, 0.06]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {/* skirting */}
      <mesh position={[0.5, 0.06, -6.38]}>
        <boxGeometry args={[11, 0.12, 0.03]} />
        <meshStandardMaterial {...WOOD} />
      </mesh>
      <mesh position={[-4.78, 0.06, -1]} rotation-y={Math.PI / 2}>
        <boxGeometry args={[15, 0.12, 0.03]} />
        <meshStandardMaterial {...WOOD} />
      </mesh>

      <ArchNiche x={-2.6} z={-6.38} />
      <ArchNiche x={0.2} z={-6.38} />
      <ArchNiche x={3.4} z={-6.38} />
      <Shelving />
      <GarmentRail />
      <Lounge />
      <Pendants />
    </group>
  )
}
