import type { CSSProperties, ReactNode } from 'react'
import { modelActions, useModelControls } from '../hooks/useModelControls'
import { OFFSET_LIMIT, ROT_MAX, ROT_MIN } from '../lib/layout'

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" className="btn btn-ghost !px-3 text-[0.62rem] !tracking-[0.16em]" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {children}
    </button>
  )
}

const Arrow = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)

/**
 * Controls for ONE model. Every button acts only on `productId`; other models are never touched.
 * `movement` is off in the single-product viewer (there is no aisle there).
 */
export function ModelControls({ productId, movement = true, compact = false }: { productId: string; movement?: boolean; compact?: boolean }) {
  const c = useModelControls(productId)
  const fill = ((c.rotation - ROT_MIN) / (ROT_MAX - ROT_MIN)) * 100
  const sliderId = `rot-${productId}`
  return (
    <div className="space-y-4" data-testid="model-controls">
      {movement && (
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow">Position</span>
            <span className="text-xs tabular-nums text-beige-300" data-testid="position-readout">
              {c.offset === 0 ? 'Home spot' : `${Math.abs(c.offset).toFixed(1)} m ${c.offset < 0 ? 'forward' : 'back'}`}
              <span className="sr-only"> (range ±{OFFSET_LIMIT} m)</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <IconBtn label="Move forward" onClick={c.moveForward} disabled={!c.canMoveForward}>
              <Arrow d="M12 19V5M5 12l7-7 7 7" /> {!compact && 'Forward'}
            </IconBtn>
            <IconBtn label="Move backward" onClick={c.moveBackward} disabled={!c.canMoveBackward}>
              <Arrow d="M12 5v14M5 12l7 7 7-7" /> {!compact && 'Back'}
            </IconBtn>
            <IconBtn label="Reset position" onClick={c.resetPosition} disabled={c.offset === 0}>
              Reset
            </IconBtn>
          </div>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor={sliderId} className="eyebrow">
            Rotation
          </label>
          <output htmlFor={sliderId} className="font-serif text-2xl tabular-nums text-champagne" data-testid="angle-readout" aria-live="polite">
            {Math.round(c.rotation)}°
          </output>
        </div>
        <input
          id={sliderId}
          className="angle"
          type="range"
          min={ROT_MIN}
          max={ROT_MAX}
          step={1}
          value={Math.round(c.rotation)}
          onChange={(e) => c.setRotation(Number(e.target.value))}
          style={{ '--fill': `${fill}%` } as CSSProperties}
          aria-valuetext={`${Math.round(c.rotation)} degrees`}
          data-testid="rotation-slider"
        />
        <div className="mt-0.5 flex justify-between text-[0.6rem] tracking-[0.2em] text-beige-300/70 uppercase">
          <span>Front 0°</span>
          <span>Side 90°</span>
          <span>Back 180°</span>
          <span>260°</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <IconBtn label="Rotate left" onClick={c.rotateLeft} disabled={c.rotation <= ROT_MIN}>
            <Arrow d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-2" /> {!compact && 'Left'}
          </IconBtn>
          <IconBtn label="Rotate right" onClick={c.rotateRight} disabled={c.rotation >= ROT_MAX}>
            {!compact && 'Right'} <Arrow d="M15 14l5-5-5-5M20 9H9a5 5 0 000 10h2" />
          </IconBtn>
          <IconBtn label="Reset rotation" onClick={c.resetRotation} disabled={c.rotation === 0}>
            Reset
          </IconBtn>
        </div>
      </div>

      <div>
        <span className="eyebrow mb-2 block">Camera</span>
        <div className="grid grid-cols-4 gap-2">
          <IconBtn label="Zoom in" onClick={() => modelActions.camera('zoom-in')}>
            <Arrow d="M11 5v12M5 11h12" />
          </IconBtn>
          <IconBtn label="Zoom out" onClick={() => modelActions.camera('zoom-out')}>
            <Arrow d="M5 11h12" />
          </IconBtn>
          <IconBtn label="Focus selected model" onClick={() => modelActions.camera('focus')}>
            <Arrow d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M12 10v4M10 12h4" />
          </IconBtn>
          <IconBtn label="Reset camera" onClick={() => modelActions.camera('reset')}>
            <Arrow d="M4 12a8 8 0 108-8M4 4v5h5" />
          </IconBtn>
        </div>
      </div>
    </div>
  )
}
