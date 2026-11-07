/**
 * Independent control state for every model in the boutique.
 *
 * Each product owns { offset, rotation }. Actions only ever write the state of the model they are
 * called for, so moving or turning one model can never move or turn another. A neighbour can only
 * *block* a move (no walking through another model), never be pushed.
 */
import { useSyncExternalStore } from 'react'
import { PRODUCTS } from '../data/products'
import { MIN_GAP, MOVE_STEP, OFFSET_LIMIT, ROT_MAX, ROT_MIN, ROT_STEP, SLOT_SPACING } from '../lib/layout'

export interface ModelState {
  /** metres along the aisle from the model's own slot; negative = forward (towards the visitor) */
  offset: number
  /** degrees, always within [ROT_MIN, ROT_MAX] */
  rotation: number
}

interface StoreState {
  models: Record<string, ModelState>
  selectedId: string | null
  /** bumps whenever the camera should re-frame (focus / reset) */
  cameraCommand: { kind: 'focus' | 'reset' | 'zoom-in' | 'zoom-out'; at: number } | null
}

const DEFAULT: ModelState = { offset: 0, rotation: 0 }
const STORAGE_KEY = 'kaftan-boutique:models:v1'

function load(): Record<string, ModelState> {
  const base = Object.fromEntries(PRODUCTS.map((p) => [p.id, { ...DEFAULT }]))
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
    for (const p of PRODUCTS) {
      const s = saved[p.id]
      if (s && typeof s.offset === 'number' && typeof s.rotation === 'number') {
        base[p.id] = { offset: clamp(s.offset, -OFFSET_LIMIT, OFFSET_LIMIT), rotation: clamp(s.rotation, ROT_MIN, ROT_MAX) }
      }
    }
  } catch {
    /* storage unavailable: defaults */
  }
  return base
}

let state: StoreState = { models: load(), selectedId: null, cameraCommand: null }
const listeners = new Set<() => void>()

function set(next: Partial<StoreState>) {
  state = { ...state, ...next }
  if (next.models) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.models))
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l())
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const slotOf = (id: string) => PRODUCTS.find((p) => p.id === id)?.boutiqueSlot ?? 0

/** Safe movement range for one model, given walls and where its neighbours currently stand. */
export function offsetBounds(id: string, models = state.models): [number, number] {
  const slot = slotOf(id)
  let lo = -OFFSET_LIMIT
  let hi = OFFSET_LIMIT
  for (const p of PRODUCTS) {
    if (p.id === id) continue
    const gapSlots = p.boutiqueSlot - slot
    if (Math.abs(gapSlots) !== 1) continue
    const other = models[p.id]?.offset ?? 0
    // distance between the two = gapSlots*SPACING + other - mine  (must stay >= MIN_GAP)
    if (gapSlots === 1) hi = Math.min(hi, SLOT_SPACING + other - MIN_GAP)
    else lo = Math.max(lo, -SLOT_SPACING + other + MIN_GAP)
  }
  return [lo, hi]
}

function patch(id: string, change: Partial<ModelState>) {
  const cur = state.models[id] ?? DEFAULT
  set({ models: { ...state.models, [id]: { ...cur, ...change } } })
}

export const modelActions = {
  select(id: string | null) {
    set({ selectedId: id, cameraCommand: id ? { kind: 'focus', at: performance.now() } : state.cameraCommand })
  },
  setOffset(id: string, offset: number) {
    const [lo, hi] = offsetBounds(id)
    patch(id, { offset: clamp(offset, lo, hi) })
  },
  moveForward(id: string) {
    modelActions.setOffset(id, (state.models[id]?.offset ?? 0) - MOVE_STEP)
  },
  moveBackward(id: string) {
    modelActions.setOffset(id, (state.models[id]?.offset ?? 0) + MOVE_STEP)
  },
  resetPosition(id: string) {
    modelActions.setOffset(id, 0)
  },
  setRotation(id: string, deg: number) {
    patch(id, { rotation: clamp(Math.round(deg * 10) / 10, ROT_MIN, ROT_MAX) })
  },
  rotateLeft(id: string) {
    modelActions.setRotation(id, (state.models[id]?.rotation ?? 0) - ROT_STEP)
  },
  rotateRight(id: string) {
    modelActions.setRotation(id, (state.models[id]?.rotation ?? 0) + ROT_STEP)
  },
  resetRotation(id: string) {
    patch(id, { rotation: 0 })
  },
  camera(kind: 'focus' | 'reset' | 'zoom-in' | 'zoom-out') {
    set({ cameraCommand: { kind, at: performance.now() } })
  },
}

export const getModelStore = () => state
// Read-only hook used by the automated acceptance tests (scripts/e2e.mjs).
;(window as unknown as { __kaftanState: () => StoreState }).__kaftanState = () => state

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useModelStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}

export function useModelControls(id: string) {
  const models = useModelStore((s) => s.models)
  const model = models[id] ?? DEFAULT
  const bounds = offsetBounds(id, models)
  return {
    ...model,
    canMoveForward: model.offset > bounds[0] + 1e-3,
    canMoveBackward: model.offset < bounds[1] - 1e-3,
    moveForward: () => modelActions.moveForward(id),
    moveBackward: () => modelActions.moveBackward(id),
    resetPosition: () => modelActions.resetPosition(id),
    setRotation: (d: number) => modelActions.setRotation(id, d),
    rotateLeft: () => modelActions.rotateLeft(id),
    rotateRight: () => modelActions.rotateRight(id),
    resetRotation: () => modelActions.resetRotation(id),
  }
}
