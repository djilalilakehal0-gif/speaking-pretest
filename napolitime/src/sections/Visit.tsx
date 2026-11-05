import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { site } from '../config/site'
import { categories } from '../data/menu'
import { openStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { subscribeNewsletter } from '../lib/order'
import { ImageReveal, Ornament, Reveal, SectionHeading, SplitReveal } from '../components/Reveal'
import { Logo, Wordmark } from '../components/Logo'
import { MagneticButton } from '../components/MagneticButton'
import { ArrowIcon, ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, TiktokIcon } from '../components/icons/Icons'
import { navLinks } from '../components/Navbar'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const socialIcon = { instagram: InstagramIcon, tiktok: TiktokIcon, facebook: FacebookIcon } as const

function useOpenStatus() {
  const [status, setStatus] = useState(() => openStatus())
  useEffect(() => {
    const t = setInterval(() => setStatus(openStatus()), 60_000)
    return () => clearInterval(t)
  }, [])
  return status
}

/** Closing call-to-action on burgundy, with slowly turning gold rings. */
export function FinalCta() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to('[data-ring="a"]', { rotate: 120, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.to('[data-ring="b"]', { rotate: -90, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.fromTo('[data-cta-inner]', { scale: 0.92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'center center', scrub: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} id="commander" className="grain relative isolate overflow-hidden bg-burgundy py-28 text-center sm:py-40" aria-labelledby="cta-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_120%,rgba(17,17,17,.6),transparent_60%)]" />
      <svg data-ring="a" aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150vmin] w-[150vmin] -translate-x-1/2 -translate-y-1/2 text-gold/25">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth=".25" strokeDasharray="1 3" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth=".2" />
      </svg>
      <svg data-ring="b" aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[105vmin] w-[105vmin] -translate-x-1/2 -translate-y-1/2 text-gold/30">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth=".3" strokeDasharray="30 12" />
        <path d="M100 0 104 4 100 8 96 4Z M100 192 104 196 100 200 96 196Z" fill="currentColor" />
      </svg>

      <div data-cta-inner className="container-x">
        <Reveal y={12}><Ornament /></Reveal>
        <h2 id="cta-title" className="display mt-8 text-[clamp(3.6rem,13vw,11rem)] text-ivory">
          <SplitReveal text={'A _tavola!'} stagger={0.12} />
        </h2>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-lg font-serif text-xl italic leading-relaxed text-ivory/80 sm:text-2xl">
            Votre prochain repas est à quelques gestes. Choisissez, commandez, savourez.
          </p>
        </Reveal>
        <Reveal delay={0.3} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MagneticButton href="#menu" className="btn btn-gold w-full sm:w-auto">Découvrir la carte <ArrowIcon /></MagneticButton>
          <MagneticButton href={site.contact.phoneHref} className="btn btn-line w-full sm:w-auto"><PhoneIcon size={16} /> Appeler le restaurant</MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}

/** Restaurant, opening hours, contact and social media. */
export function Visit() {
  const status = useOpenStatus()
  const store = photo('storefront')

  return (
    <section id="visit" className="relative bg-ivory py-24 text-noir sm:py-36" aria-labelledby="visit-title">
      <div className="container-x">
        <div id="visit-title"><SectionHeading tone="light" eyebrow="Il ristorante" title={'Venez nous _voir.'} intro="Sur place, à emporter ou en livraison : on vous attend." /></div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <ImageReveal {...store} sizes="(min-width:1024px) 55vw, 92vw" alt="La devanture illuminée du restaurant NAPOLITIME" className="min-h-[420px] rounded-[2rem]">
            <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/10 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 sm:p-9">
              <div className="flex items-center gap-4 text-ivory">
                <span className="text-gold"><PinIcon size={34} live /></span>
                <p className="display text-3xl leading-tight sm:text-4xl">{site.contact.street}<br /><span className="display-i text-ivory/60">{site.contact.city}</span></p>
              </div>
              <a href={site.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Itinéraire <ArrowIcon /></a>
            </div>
          </ImageReveal>

          <Reveal delay={0.1} className="rounded-[2rem] bg-noir p-7 text-ivory sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-3 eyebrow"><ClockIcon size={22} live /> Horaires</h3>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${status.open ? 'bg-ok/15 text-ok' : 'bg-gold/15 text-gold'}`} role="status">
                <span className={`h-1.5 w-1.5 rounded-full ${status.open ? 'animate-pulse bg-ok' : 'bg-gold'}`} />
                {status.open ? 'Ouvert' : 'Fermé'}
              </span>
            </div>
            <p className="mt-3 font-serif text-lg italic text-ivory/60">{status.label}</p>
            <table className="mt-6 w-full text-sm">
              <caption className="sr-only">Horaires d'ouverture</caption>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = site.hours.find((x) => x.day === d)!
                  const today = d === status.today
                  return (
                    <tr key={d} className={`border-b border-ivory/[0.07] last:border-0 ${today ? 'text-ivory' : 'text-ivory/55'}`} aria-current={today ? 'date' : undefined}>
                      <th scope="row" className="py-3.5 text-left font-medium">
                        {h.label}{today && <span className="ml-2 rounded-full bg-burgundy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ivory">Aujourd'hui</span>}
                      </th>
                      <td className="py-3.5 text-right font-serif text-base tabular-nums">{h.open ? `${h.open} – ${h.close}` : 'Fermé'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
        </div>

        <div id="contact" className="mt-5 grid scroll-mt-28 gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { Icon: PhoneIcon, label: 'Appelez-nous', value: site.contact.phoneDisplay, href: site.contact.phoneHref },
              { Icon: MailIcon, label: 'Écrivez-nous', value: site.contact.email, href: `mailto:${site.contact.email}` },
            ].map(({ Icon, label, value, href }, i) => (
              <Reveal key={label} delay={i * 0.08}>
                <a href={href} className="group flex h-full flex-col gap-8 rounded-[1.75rem] border border-noir/10 bg-white p-7 transition-colors duration-500 hover:border-burgundy/40 hover:bg-burgundy hover:text-ivory">
                  <span className="text-burgundy transition-[color,transform] duration-500 group-hover:-rotate-12 group-hover:scale-110 group-hover:text-gold"><Icon size={30} draw /></span>
                  <span>
                    <span className="eyebrow block !text-noir/50 transition-colors group-hover:!text-gold">{label}</span>
                    <span className="display mt-2 block break-words text-2xl">{value}</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-between gap-8 rounded-[1.75rem] bg-burgundy p-8 text-ivory">
              <p className="display text-4xl leading-[1]">Suivez <span className="display-i text-gold">NAPOLITIME</span></p>
              <ul className="flex flex-wrap gap-3">
                {site.socials.map((s) => {
                  const Icon = socialIcon[s.id as keyof typeof socialIcon]
                  return (
                    <li key={s.id}>
                      <motion.a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} sur ${s.label} (nouvel onglet)`}
                        whileHover={{ y: -4 }} whileTap={{ scale: 0.9 }}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 text-ivory transition-colors hover:bg-gold hover:text-noir">
                        <Icon size={22} />
                      </motion.a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const configured = !!site.integrations.newsletterEndpoint
  const status = useOpenStatus()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setState('error'); setMsg('Indiquez une adresse e-mail valide.'); return }
    if (!configured) {
      window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent('Inscription newsletter')}&body=${encodeURIComponent(`Merci d'ajouter ${email.trim()} à la newsletter NAPOLITIME.`)}`
      setState('idle'); setMsg('Votre messagerie s’est ouverte avec la demande d’inscription : envoyez-la pour vous abonner.')
      return
    }
    setState('sending')
    const r = await subscribeNewsletter(email)
    if (r.ok) { setState('done'); setMsg('Merci ! Vérifiez votre boîte mail pour confirmer.'); setEmail('') }
    else { setState('error'); setMsg(r.error ?? 'Une erreur est survenue.') }
  }

  return (
    <footer className="relative overflow-hidden bg-noir pt-24" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">Pied de page</h2>
      <div className="container-x grid gap-16 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="eyebrow">La lettera · Newsletter</p>
          <p className="display mt-5 text-[clamp(2.4rem,5vw,3.8rem)] text-ivory">Offres et nouveautés, <span className="display-i text-gold">en avant-première.</span></p>
          <p className="mt-4 max-w-md text-ivory/55">Un e-mail par mois maximum. Désinscription à tout moment.</p>
          <form onSubmit={submit} noValidate className="mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
            <label htmlFor="nl-email" className="sr-only">Adresse e-mail</label>
            <input
              id="nl-email" type="email" inputMode="email" autoComplete="email" maxLength={120} required
              value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
              placeholder="vous@exemple.fr" className="input flex-1 !rounded-full"
              aria-invalid={state === 'error' || undefined} aria-describedby="nl-msg"
            />
            <button type="submit" disabled={state === 'sending'} className="btn btn-gold shrink-0">
              {state === 'sending' ? 'Envoi…' : configured ? "S'inscrire" : "S'inscrire par e-mail"}
            </button>
          </form>
          <p id="nl-msg" role="status" className={`mt-3 min-h-5 text-sm ${state === 'error' ? 'text-gold' : 'text-ivory/65'}`}>{msg}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="eyebrow mb-5">Navigation</p>
            <ul className="space-y-3 text-ivory/60">
              {navLinks.map((l) => <li key={l.id}><a href={`#${l.id}`} className="link-u hover:text-ivory">{l.label}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5">La carte</p>
            <ul className="space-y-3 text-ivory/60">
              {categories.map((c) => <li key={c.id}><a href={`#cat-${c.id}`} className="link-u hover:text-ivory">{c.label}</a></li>)}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="eyebrow mb-5">Contact</p>
            <address className="space-y-3 not-italic text-ivory/60">
              <p>{site.contact.street}<br />{site.contact.city}</p>
              <p><a href={site.contact.phoneHref} className="link-u hover:text-ivory">{site.contact.phoneDisplay}</a></p>
              <p><a href={`mailto:${site.contact.email}`} className="link-u break-all hover:text-ivory">{site.contact.email}</a></p>
              <p className="flex items-center gap-2 pt-1 text-ivory/75"><span className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-ok' : 'bg-gold'}`} />{status.open ? 'Ouvert maintenant' : status.label}</p>
            </address>
            <ul className="mt-5 flex gap-2">
              {site.socials.map((s) => {
                const Icon = socialIcon[s.id as keyof typeof socialIcon]
                return (
                  <li key={s.id}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} sur ${s.label} (nouvel onglet)`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-gold hover:text-gold">
                      <Icon size={17} />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-x mt-24 overflow-hidden" aria-hidden>
        <motion.p
          initial={{ y: '40%', opacity: 0 }} whileInView={{ y: '0%', opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="select-none text-center leading-[0.8]"
        >
          <Wordmark className="text-[clamp(3rem,12.5vw,12.5rem)] text-ivory/[0.07] [&_.text-gold]:text-gold/25" />
        </motion.p>
      </div>

      <div className="container-x mt-10 flex flex-col items-center justify-between gap-4 border-t border-ivory/[0.08] py-8 text-xs text-ivory/40 sm:flex-row">
        <Logo compact />
        <p className="font-serif text-sm italic">© {new Date().getFullYear()} {site.name} · Qualità · Gusto · Convivialità</p>
        <p>Prix TTC · Photos non contractuelles</p>
      </div>
      {site.isDemo && (
        <p className="bg-gold px-4 py-2 text-center text-xs font-semibold text-noir">
          À compléter : adresse, e-mail, réseaux sociaux et horaires sont des exemples. Modifiez <code>src/config/site.ts</code>.
        </p>
      )}
    </footer>
  )
}
