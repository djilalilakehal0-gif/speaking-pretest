/**
 * Boutique layout: the models stand one behind another along a gentle diagonal aisle.
 * Units are metres (three.js Y-up). The aisle runs from the front-left (near the visitor)
 * to the back-right of the boutique.
 */
import { PRODUCTS } from '../data/products'

export const AISLE_START: [number, number] = [-1.7, 0.9] // x, z of slot 0 (front)
export const AISLE_END: [number, number] = [1.9, -4.3] // x, z of the last slot (back)
const dx = AISLE_END[0] - AISLE_START[0]
const dz = AISLE_END[1] - AISLE_START[1]
const len = Math.hypot(dx, dz)
/** Unit vector pointing to the BACK of the boutique along the aisle. */
export const AISLE_DIR: [number, number] = [dx / len, dz / len]
export const SLOT_COUNT = PRODUCTS.length
export const SLOT_SPACING = len / (SLOT_COUNT - 1)

/** A model's own movement range along the aisle, either side of its slot (walls / furniture). */
export const OFFSET_LIMIT = 0.7
/** Minimum distance between two neighbouring models (their garments never touch). */
export const MIN_GAP = 1.0
/** Each step of MOVE FORWARD / MOVE BACKWARD. */
export const MOVE_STEP = 0.2

/** Facing: models turn slightly towards the default camera (radians, around Y). */
export const BASE_YAW = 0.42

export const ROT_MIN = 0
export const ROT_MAX = 260
export const ROT_STEP = 15

export function slotPosition(slot: number, offset = 0): [number, number, number] {
  const d = slot * SLOT_SPACING + offset
  return [AISLE_START[0] + AISLE_DIR[0] * d, 0, AISLE_START[1] + AISLE_DIR[1] * d]
}

/** Default camera framing: every model visible, staggered in depth without overlapping. */
export const DEFAULT_CAMERA = { position: [4.3, 2.05, 4.6] as [number, number, number], target: [0.05, 1.0, -1.55] as [number, number, number] }
