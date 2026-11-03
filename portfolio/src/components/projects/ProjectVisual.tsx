import type { Project } from '@/content/site'
import { asset } from '@/lib/asset'

/** Preview for a project card: the real screenshot when available, otherwise a designed UI mock. */
export function ProjectVisual({ project, priority = false }: { project: Project; priority?: boolean }) {
  if (project.image) {
    const sm = project.image.replace(/\.webp$/, '-sm.webp')
    return (
      <img
        src={asset(project.image)}
        srcSet={`${asset(sm)} 720w, ${asset(project.image)} 1200w`}
        sizes="(min-width: 1024px) 60vw, 100vw"
        alt={`${project.title} — screenshot of the live website`}
        width={1200}
        height={750}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="size-full object-cover object-top"
      />
    )
  }
  return (
    <div role="img" aria-label={`${project.title} — interface concept preview`} className="size-full">
      {project.visual === 'devspace' ? <DashboardMock /> : <ShopMock />}
    </div>
  )
}

function Chrome({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="flex size-full flex-col bg-[#060a16]">
      <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="mx-auto rounded-md bg-white/[0.04] px-6 py-0.5 font-mono text-[9px] text-white/35">{url}</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

function DashboardMock() {
  const bars = [38, 62, 48, 80, 56, 92, 70, 84, 60, 96, 74, 88]
  return (
    <Chrome url="app.devspace.io/overview">
      <div className="absolute inset-0 grid grid-cols-[18%_1fr]">
        <aside className="space-y-2 border-r border-white/5 p-3">
          <div className="mb-4 flex items-center gap-1.5">
            <span className="size-3 rounded bg-gradient-to-br from-[#5b8cff] to-[#8b5cf6]" />
            <span className="h-1.5 w-10 rounded bg-white/30" />
          </div>
          {[1, 0.5, 0.5, 0.5, 0.5].map((o, i) => (
            <div key={i} className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 ${i === 0 ? 'bg-[#5b8cff]/15' : ''}`}>
              <span className="size-2 rounded-sm" style={{ background: `rgb(255 255 255 / ${o * 0.5})` }} />
              <span className="h-1 flex-1 rounded" style={{ background: `rgb(255 255 255 / ${o * 0.35})` }} />
            </div>
          ))}
        </aside>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="h-2 w-20 rounded bg-white/40" />
            <span className="h-4 w-14 rounded-md bg-[#5b8cff]/70" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['#5b8cff', '72%'],
              ['#a77bff', '54%'],
              ['#22d3ee', '86%'],
            ].map(([c, w]) => (
              <div key={c} className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
                <span className="block h-1 w-8 rounded bg-white/25" />
                <span className="mt-2 block h-2.5 w-10 rounded bg-white/70" />
                <span className="mt-2 block h-1 rounded-full bg-white/5">
                  <span className="block h-full rounded-full" style={{ width: w, background: c }} />
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
            <svg viewBox="0 0 300 90" className="h-auto w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ds-a" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#5b8cff" stopOpacity=".45" />
                  <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 70 C30 60 45 30 75 38 S120 70 150 46 S200 12 230 26 S275 40 300 14 V90 H0Z" fill="url(#ds-a)" />
              <path d="M0 70 C30 60 45 30 75 38 S120 70 150 46 S200 12 230 26 S275 40 300 14" fill="none" stroke="#7aa2ff" strokeWidth="2" />
              <path d="M0 80 C40 74 60 60 95 64 S160 74 190 58 S250 50 300 44" fill="none" stroke="#a77bff" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>
          <div className="flex h-12 items-end gap-1">
            {bars.map((b, i) => (
              <span key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-[#5b8cff]/30 to-[#8b5cf6]/80" style={{ height: `${b}%` }} />
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  )
}

function ShopMock() {
  const items = [
    ['from-[#a77bff] to-[#5b8cff]', '49'],
    ['from-[#22d3ee] to-[#3b82f6]', '89'],
    ['from-[#f472b6] to-[#a77bff]', '129'],
    ['from-[#fbbf24] to-[#f97316]', '64'],
  ]
  return (
    <Chrome url="nexora.store/new">
      <div className="absolute inset-0 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.3em] text-white/80">NEXORA</span>
          <div className="hidden gap-3 sm:flex">
            {[1, 2, 3].map((i) => (
              <span key={i} className="h-1 w-8 rounded bg-white/20" />
            ))}
          </div>
          <span className="grid size-5 place-items-center rounded-full bg-white/10 text-[8px] text-white/70">2</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#a77bff]/25 via-[#5b8cff]/15 to-transparent p-3">
          <div>
            <span className="block h-2.5 w-24 rounded bg-white/80" />
            <span className="mt-1.5 block h-1.5 w-16 rounded bg-white/35" />
            <span className="mt-2.5 inline-block rounded-full bg-white px-2.5 py-0.5 text-[8px] font-medium text-[#060a16]">Shop now</span>
          </div>
          <span className="size-12 rotate-12 rounded-2xl bg-gradient-to-br from-[#a77bff] to-[#22d3ee] shadow-[0_10px_30px_-5px_rgb(167_123_255/0.6)]" />
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {['All', 'Audio', 'Wear', 'Home'].map((c, i) => (
            <span key={c} className={`rounded-full px-2 py-0.5 text-[8px] ${i === 0 ? 'bg-white text-[#060a16]' : 'border border-white/10 text-white/50'}`}>
              {c}
            </span>
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {items.map(([g, p]) => (
            <div key={p} className="rounded-lg border border-white/5 bg-white/[0.03] p-1.5">
              <div className="grid aspect-square place-items-center rounded-md bg-white/[0.03]">
                <span className={`size-1/2 rounded-full bg-gradient-to-br ${g}`} />
              </div>
              <span className="mt-1.5 block h-1 w-3/4 rounded bg-white/30" />
              <span className="mt-1 block text-[8px] font-medium text-white/70">${p}</span>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  )
}
