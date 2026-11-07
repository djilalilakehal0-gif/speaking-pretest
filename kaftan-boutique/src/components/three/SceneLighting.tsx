import { Environment, Lightformer } from '@react-three/drei'

/** Warm architectural lighting + a procedural studio environment for satin and brass reflections. */
export function SceneLighting({ shadowSize = 2048 }: { shadowSize?: number }) {
  return (
    <>
      <hemisphereLight args={['#ffe9d0', '#3a2418', 0.55]} />
      <directionalLight
        position={[3.2, 6.5, 3.5]}
        intensity={1.35}
        color="#ffe3c0"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={18}
        shadow-radius={6}
      />
      <Environment resolution={256} frames={1} environmentIntensity={0.55}>
        <color attach="background" args={['#1c120d']} />
        <Lightformer form="rect" intensity={2.2} color="#ffe2bd" position={[0, 4, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd9a8" position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#fff1e0" position={[5, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#ffcf8a" position={[0, 2, -5]} scale={2} />
      </Environment>
    </>
  )
}
