import type { Project } from '@/content/site'
import { asset } from '@/lib/asset'

/** Preview for a project card: the real screenshot when available, otherwise a branded placeholder. */
export function ProjectVisual({ project, alt, priority = false }: { project: Project; alt: string; priority?: boolean }) {
  if (project.image) {
    const sm = project.image.replace(/\.webp$/, '-sm.webp')
    return (
      <img
        src={asset(project.image)}
        srcSet={`${asset(sm)} 720w, ${asset(project.image)} 1200w`}
        sizes="(min-width: 1024px) 60vw, 100vw"
        alt={alt}
        width={1200}
        height={750}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="size-full object-cover object-top"
      />
    )
  }
  return (
    <div
      role="img"
      aria-label={alt}
      dir="ltr"
      className="grid size-full place-items-center bg-[#060a16]"
      style={{ backgroundImage: `radial-gradient(70% 70% at 30% 20%, ${project.accent}40, transparent 70%)` }}
    >
      <span className="text-3xl font-semibold tracking-[0.2em] text-white/80">{project.title}</span>
    </div>
  )
}
