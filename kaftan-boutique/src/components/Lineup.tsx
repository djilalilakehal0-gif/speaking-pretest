import { PRODUCTS } from '../data/products'
import { modelActions, useModelStore } from '../hooks/useModelControls'

/** Accessible list of the five models — select any of them without a pointer. */
export function Lineup() {
  const selectedId = useModelStore((s) => s.selectedId)
  const ordered = [...PRODUCTS].sort((a, b) => a.boutiqueSlot - b.boutiqueSlot)
  return (
    <nav aria-label="Models in the boutique" className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {ordered.map((p) => {
        const active = p.id === selectedId
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => modelActions.select(active ? null : p.id)}
            aria-pressed={active}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[0.62rem] tracking-[0.18em] uppercase backdrop-blur transition-colors ${
              active ? 'border-gold bg-gold text-cocoa-950' : 'border-champagne/25 bg-cocoa-900/60 text-beige-100 hover:border-gold-soft'
            }`}
            data-testid={`select-${p.id}`}
          >
            <span className="size-3 rounded-full ring-1 ring-champagne/40" style={{ background: p.colors[0].hex }} aria-hidden />
            <span className="tabular-nums opacity-70">{p.boutiqueSlot + 1}</span>
            {p.name.replace(' Kaftan', '')}
          </button>
        )
      })}
    </nav>
  )
}
