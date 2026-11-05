import { motion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import { site } from '../config/site'
import { categories } from '../data/menu'
import { openStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { subscribeNewsletter } from '../lib/order'
import { SectionHeading, Reveal } from '../components/Reveal'
import { Logo } from '../components/Logo'
import { ArrowIcon, ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, TiktokIcon } from '../components/icons/Icons'

const socialIcon = { instagram: InstagramIcon, tiktok: TiktokIcon, facebook: FacebookIcon } as const

/** Restaurant, opening hours, contact and social media. */
export function Visit() {
  const [status, setStatus] = useState(() => openStatus())
  useEffect(() => {
    const t = setInterval(() => setStatus(openStatus()), 60_000)
    return () => clearInterval(t)
  }, [])
  const store = photo('storefront')

  return (
    <section id="visit" className="relative bg-ink-2 py-24 sm:py-32" aria-labelledby="visit-title">
      <div className="container-x">
        <div id="visit-title"><SectionHeading eyebrow="Le restaurant" title="Venez nous voir." intro="Sur place, à emporter ou en livraison : on vous attend." /></div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <Reveal className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-white/[0.07]">
            <img src={store.src} srcSet={store.srcSet} sizes="(min-width:1024px) 55vw, 92vw" alt="La devanture illuminée du restaurant NAPOLITIME" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="text-tomato"><PinIcon size={36} live /></span>
                <p className="display text-2xl leading-tight sm:text-3xl">{site.contact.street}<br /><span className="text-cream/60">{site.contact.city}</span></p>
              </div>
              <a href={site.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Itinéraire <ArrowIcon /></a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="rounded-[2rem] border border-white/[0.07] bg-ink p-7 sm:p-9">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-cream"><ClockIcon size={24} live /> Horaires</h3>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status.open ? 'bg-[#3ddc84]/15 text-[#3ddc84]' : 'bg-tomato/15 text-gold'}`} role="status">
                <span className={`h-2 w-2 rounded-full ${status.open ? 'animate-pulse bg-[#3ddc84]' : 'bg-tomato'}`} />
                {status.open ? 'Ouvert' : 'Fermé'}
              </span>
            </div>
            <p className="mt-2 text-sm text-cream/55">{status.label}</p>
            <table className="mt-6 w-full text-sm">
              <caption className="sr-only">Horaires d'ouverture</caption>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = site.hours.find((x) => x.day === d)!
                  const today = d === status.today
                  return (
                    <tr key={d} className={`border-b border-white/[0.06] last:border-0 ${today ? 'text-cream' : 'text-cream/60'}`} aria-current={today ? 'date' : undefined}>
                      <th scope="row" className="py-3 text-left font-medium">
                        {h.label}{today && <span className="ml-2 rounded-full bg-tomato px-2 py-0.5 text-[10px] font-bold uppercase text-white">Aujourd'hui</span>}
                      </th>
                      <td className="py-3 text-right tabular-nums">{h.open ? `${h.open} – ${h.close}` : 'Fermé'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
        </div>

        <div id="contact" className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { Icon: PhoneIcon, label: 'Appelez-nous', value: site.contact.phoneDisplay, href: site.contact.phoneHref },
              { Icon: MailIcon, label: 'Écrivez-nous', value: site.contact.email, href: `mailto:${site.contact.email}` },
            ].map(({ Icon, label, value, href }, i) => (
              <Reveal key={label} delay={i * 0.06}>
                <a href={href} className="group flex h-full flex-col gap-6 rounded-[1.75rem] border border-white/[0.07] bg-ink p-6 transition-colors hover:border-tomato/50">
                  <span className="text-cream transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"><Icon size={30} draw /></span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-gold">{label}</span>
                    <span className="mt-1 block break-words text-lg text-cream/85">{value}</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-between gap-6 rounded-[1.75rem] bg-tomato p-7 text-white">
              <p className="display text-4xl leading-[0.95]">Suivez<br />NAPOLITIME</p>
              <ul className="flex flex-wrap gap-3">
                {site.socials.map((s) => {
                  const Icon = socialIcon[s.id as keyof typeof socialIcon]
                  return (
                    <li key={s.id}>
                      <motion.a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} sur ${s.label} (nouvel onglet)`}
                        whileHover={{ y: -4, rotate: -6 }} whileTap={{ scale: 0.9 }}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                        <Icon size={24} />
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
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-ink pt-20" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">Pied de page</h2>
      <div className="container-x grid gap-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">Newsletter</p>
          <p className="display mt-4 text-[clamp(2.2rem,5vw,3.6rem)]">Offres et nouveautés en avant-première.</p>
          <p className="mt-3 max-w-md text-cream/60">Un e-mail par mois maximum. Désinscription à tout moment.</p>
          <form onSubmit={submit} noValidate className="mt-7 flex max-w-lg flex-col gap-3 sm:flex-row">
            <label htmlFor="nl-email" className="sr-only">Adresse e-mail</label>
            <input
              id="nl-email" type="email" inputMode="email" autoComplete="email" maxLength={120} required
              value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
              placeholder="vous@exemple.fr" className="input flex-1 !rounded-full"
              aria-invalid={state === 'error' || undefined} aria-describedby="nl-msg"
            />
            <button type="submit" disabled={state === 'sending'} className="btn btn-primary shrink-0">
              {state === 'sending' ? 'Envoi…' : configured ? "S'inscrire" : "S'inscrire par e-mail"}
            </button>
          </form>
          <p id="nl-msg" role="status" className={`mt-3 min-h-5 text-sm ${state === 'error' ? 'text-gold' : 'text-cream/70'}`}>{msg}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="eyebrow mb-4">Le menu</p>
            <ul className="space-y-2.5 text-cream/65">
              {categories.map((c) => <li key={c.id}><a href={`#cat-${c.id}`} className="hover:text-cream">{c.label}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4">Contact</p>
            <address className="space-y-2.5 not-italic text-cream/65">
              <p>{site.contact.street}<br />{site.contact.city}</p>
              <p><a href={site.contact.phoneHref} className="hover:text-cream">{site.contact.phoneDisplay}</a></p>
              <p><a href={`mailto:${site.contact.email}`} className="break-all hover:text-cream">{site.contact.email}</a></p>
            </address>
          </div>
        </div>
      </div>

      <div className="container-x mt-20" aria-hidden>
        <p className="display select-none text-center text-[clamp(4rem,19vw,17rem)] leading-[0.8] text-white/[0.05]">NAPOLI<span className="text-tomato/30">TIME</span></p>
      </div>

      <div className="container-x flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-xs text-cream/40 sm:flex-row">
        <Logo compact />
        <p>© {new Date().getFullYear()} {site.name} · Qualité · Goût · Convivialité</p>
        <p>Prix TTC · Photos non contractuelles</p>
      </div>
      {site.isDemo && (
        <p className="bg-white px-4 py-2 text-center text-xs font-semibold text-ink">
          À compléter : adresse, e-mail, réseaux sociaux et horaires sont des exemples. Modifiez <code>src/config/site.ts</code>.
        </p>
      )}
    </footer>
  )
}
