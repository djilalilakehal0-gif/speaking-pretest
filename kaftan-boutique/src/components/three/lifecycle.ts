import { useEffect } from 'react'
import { releaseAllModels } from './KaftanFigure'

let mounted = 0
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Counts mounted 3D views. When the visitor leaves every 3D page for a while, the models'
 * GPU resources are disposed (the browser cache makes coming back fast).
 */
export function useThreeLifecycle() {
  useEffect(() => {
    mounted++
    clearTimeout(timer)
    return () => {
      mounted--
      if (mounted === 0) timer = setTimeout(() => mounted === 0 && releaseAllModels(), 60_000)
    }
  }, [])
}
