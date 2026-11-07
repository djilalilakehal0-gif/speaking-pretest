import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'

/**
 * While a model is being dragged, one-finger / left-button orbiting is paused so the drag turns
 * the model. Zoom (wheel, pinch) stays active, so a two-finger pinch on a model still zooms.
 */
export function useOrbitLock() {
  const controls = useThree((s) => s.controls) as { enableRotate: boolean } | null
  return useCallback(
    (locked: boolean) => {
      if (controls) controls.enableRotate = !locked
    },
    [controls],
  )
}
