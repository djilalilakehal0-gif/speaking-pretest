import { contact, nav, site, socials } from '@/content/site'
import { Logo } from './ui/Logo'
import { SocialIcon } from './ui/SocialIcon'
import { BackToTop } from './BackToTop'
import { Year } from './Year'

export function Footer() {
  return (
    <footer className="relative border-t border-line pb-[max(2rem,env(safe-area-inset-bottom))] pt-16">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue/60 to-transparent" />
      <div className="container-x">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <a href="#top" className="inline-flex items-center gap-2.5 rounded-lg">
              <Logo className="size-9" />
              <span className="text-lg font-semibold tracking-[0.18em]">{site.brand}</span>
            </a>
            <p className="mt-4 leading-relaxed text-muted">{site.tagline}</p>
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="mt-4 inline-block text-sm tabular-nums text-soft transition-colors hover:text-ink">
                {contact.phoneDisplay}
              </a>
            )}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-3 sm:grid-cols-3">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="text-sm text-muted transition-colors hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-dim">
            © <Year /> {site.name}. Designed &amp; engineered with care.
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} (opens in a new tab)`}
                className="grid size-11 place-items-center rounded-full border border-line text-muted transition-all hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
              >
                <SocialIcon k={s.key} />
              </a>
            ))}
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  )
}
