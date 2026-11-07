import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Material, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three'
import { asset } from '../../data/products'

const loaded = new Map<string, Object3D>()
// Read-only hook used by the automated acceptance tests (scripts/e2e.mjs).
;(window as unknown as { __kaftanLoaded: () => string[] }).__kaftanLoaded = () => [...loaded.keys()]

/**
 * One kaftan character (a real 3D GLB, loaded lazily with Meshopt decoding). Each instance clones
 * the node tree but shares geometry and materials with the cached GLTF, so a model shown in the
 * boutique and on the product page costs the GPU only once.
 */
export function KaftanFigure({ url }: { url: string }) {
  const full = asset(url)
  const { scene } = useGLTF(full, false, true)
  loaded.set(full, scene)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o: Object3D) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const m = mesh.material as MeshStandardMaterial
      if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.9
    })
    return c
  }, [scene])
  return <primitive object={clone} />
}

/** Dispose every loaded model's geometry, materials and textures (called when leaving the 3D pages). */
export function releaseAllModels() {
  for (const [url, scene] of loaded) {
    scene.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.geometry?.dispose()
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]
      for (const m of mats) {
        for (const v of Object.values(m)) if ((v as Texture)?.isTexture) (v as Texture).dispose()
        m.dispose()
      }
    })
    useGLTF.clear(url)
  }
  loaded.clear()
}
