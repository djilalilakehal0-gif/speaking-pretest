import { motion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import { site } from '../config/site'
import { openStatus } from '../lib/hours'
import { subscribeNewsletter } from '../lib/order'
import { SectionHeading, Reveal } from '../components/Reveal'
import { Logo } from '../components/Logo'
import { ArrowIcon, ChatIcon, ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, TiktokIcon } from '../components/icons/Icons'
import { navLinks } from '../components/Navbar'

const socialIcon = { instagram: InstagramIcon, tiktok: TiktokIcon, facebook: FacebookIcon } as const

/** 10. Location & opening hours */
export function Visit() {
  const [status, setStatus] = useState(() => openStatus())
  const [mapOn, setMapOn] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setStatus(openStatus()), 60_000)
    return () => clearInterval(t)
  }, [])

  return (
    <section id="visit" className="relative bg-ink py-24 sm:py-32" aria-labelledby="visit-title">
      <div className="container-x">
        <div id="visit-title"><SectionHeading eyebrow="Visit us" title="Find your table." italic="Nel cuore del centro storico" /></div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <Reveal className="card-surface relative min-h-[360px] overflow-hidden rounded-[2rem]">
            {mapOn ? (
              <iframe title={`Map showing ${site.name}`} src={site.contact.mapEmbed} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full grayscale invert-[.92] hue-rotate-180" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(circle_at_50%_40%,rgba(230,57,50,.18),transparent_60%)] p-8 text-center">
                <motion.span initial={{ y: -30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="text-tomato">
                  <PinIcon size={64} draw live />
                </motion.span>
                <p className="display text-3xl">{site.contact.street}<br /><span className="text-cream/60">{site.contact.city}</span></p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setMapOn(true)} className="btn btn-ghost">Show map</button>
                  <a href={site.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Directions <ArrowIcon /></a>
                </div>
                <p className="max-w-xs text-xs text-cream/40">The map loads from OpenStreetMap only when you ask for it.</p>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1} className="card-surface rounded-[2rem] p-7 sm:p-9">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gold"><ClockIcon size={24} live /> Opening hours</h3>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status.open ? 'bg-[#2f6b2a]/30 text-[#9be07c]' : 'bg-tomato/15 text-tomato'}`} role="status">
                <span className={`h-2 w-2 rounded-full ${status.open ? 'animate-pulse bg-[#9be07c]' : 'bg-tomato'}`} />
                {status.open ? 'Open now' : 'Closed'}
              </span>
            </div>
            <p className="mt-2 text-sm text-cream/55">{status.label} (Naples time)</p>
            <table className="mt-6 w-full text-sm">
              <caption className="sr-only">Weekly opening hours</caption>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = site.hours.find((x) => x.day === d)!
                  const today = d === status.today
                  return (
                    <tr key={d} className={`border-b border-cream/[0.06] last:border-0 ${today ? 'text-cream' : 'text-cream/60'}`} aria-current={today ? 'date' : undefined}>
                      <th scope="row" className="py-3 text-left font-medium">
                        {h.label}{today && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Today</span>}
                      </th>
                      <td className="py-3 text-right tabular-nums">{h.open ? `${h.open} – ${h.close}` : 'Closed'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
        </div>
        <Contact />
      </div>
    </section>
  )
}

/** 11. Contact details & social media */
function Contact() {
  const items = [
    { Icon: PhoneIcon, label: 'Call us', value: site.contact.phoneDisplay, href: site.contact.phoneHref },
    { Icon: MailIcon, label: 'Write to us', value: site.contact.email, href: `mailto:${site.contact.email}` },
    { Icon: ChatIcon, label: 'Events & catering', value: 'Private parties up to 60', href: `mailto:${site.contact.email}?subject=${encodeURIComponent('Event enquiry')}` },
  ]
  return (
    <div id="contact" className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <div className="grid gap-5 sm:grid-cols-3">
        {items.map(({ Icon, label, value, href }, i) => (
          <Reveal key={label} delay={i * 0.06}>
            <a href={href} className="card-surface group flex h-full flex-col gap-6 rounded-[1.75rem] p-6 transition-colors hover:border-gold/40">
              <span className="text-cream transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"><Icon size={30} draw /></span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-gold">{label}</span>
                <span className="mt-1 block break-words text-cream/80">{value}</span>
              </span>
            </a>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.1}>
        <div className="flex h-full flex-col justify-between gap-6 rounded-[1.75rem] bg-tomato p-7 text-white">
          <p className="display text-4xl leading-[0.95]">Follow the<br />fire.</p>
          <ul className="flex flex-wrap gap-3">
            {site.socials.map((s) => {
              const Icon = socialIcon[s.id as keyof typeof socialIcon]
              return (
                <li key={s.id}>
                  <motion.a
                    href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} on ${s.label} (opens in a new tab)`}
                    whileHover={{ y: -4, rotate: -6 }} whileTap={{ scale: 0.9 }}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream"
                  >
                    <Icon size={24} />
                  </motion.a>
                </li>
              )
            })}
          </ul>
        </div>
      </Reveal>
    </div>
  )
}

/** 12. Footer with newsletter signup */
export function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const configured = !!site.integrations.newsletterEndpoint

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setState('error'); setMsg('Please enter a valid e-mail address.'); return }
    if (!configured) {
      window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent('Newsletter sign-up')}&body=${encodeURIComponent(`Please add ${email.trim()} to the NAPOLITIME newsletter.`)}`
      setState('idle'); setMsg('Your e-mail app opened with a sign-up request — send it to subscribe.')
      return
    }
    setState('sending')
    const r = await subscribeNewsletter(email)
    if (r.ok) { setState('done'); setMsg('Grazie! Check your inbox to confirm.'); setEmail('') }
    else { setState('error'); setMsg(r.error ?? 'Something went wrong.') }
  }

  return (
    <footer className="relative overflow-hidden border-t border-cream/[0.06] bg-ink pt-20" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">Footer</h2>
      <div className="container-x grid gap-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">Newsletter</p>
          <p className="display mt-4 text-[clamp(2.4rem,5vw,4rem)]">First slice of every new drop.</p>
          <p className="mt-3 max-w-md text-cream/60">New pizzas, secret burgers and members-only deals. One e-mail a month, no spam, unsubscribe anytime.</p>
          <form onSubmit={submit} noValidate className="mt-7 flex max-w-lg flex-col gap-3 sm:flex-row">
            <label htmlFor="nl-email" className="sr-only">E-mail address</label>
            <input
              id="nl-email" type="email" inputMode="email" autoComplete="email" maxLength={120} required
              value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
              placeholder="you@example.com" className="input flex-1 !rounded-full"
              aria-invalid={state === 'error' || undefined} aria-describedby="nl-msg"
            />
            <button type="submit" disabled={state === 'sending'} className="btn btn-primary shrink-0">
              {state === 'sending' ? 'Sending…' : configured ? 'Subscribe' : 'Subscribe by e-mail'}
            </button>
          </form>
          <p id="nl-msg" role="status" className={`mt-3 min-h-5 text-sm ${state === 'error' ? 'text-tomato' : 'text-gold'}`}>{msg}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2.5 text-cream/65">
              {navLinks.map((l) => <li key={l.id}><a href={`#${l.id}`} className="hover:text-cream">{l.label}</a></li>)}
              <li><a href="#ingredients" className="hover:text-cream">Ingredients</a></li>
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
        <p className="display select-none text-center text-[clamp(4rem,19vw,17rem)] leading-[0.8] text-cream/[0.06]">NAPOLI<span className="text-tomato/30">TIME</span></p>
      </div>

      <div className="container-x flex flex-col items-center justify-between gap-4 border-t border-cream/[0.06] py-8 text-xs text-cream/40 sm:flex-row">
        <Logo compact />
        <p>© {new Date().getFullYear()} {site.name}. {site.tagline}</p>
        <p>Food photography via <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-cream">Unsplash</a></p>
      </div>
      {site.isDemo && (
        <p className="bg-gold px-4 py-2 text-center text-xs font-semibold text-ink">
          Demo content: address, phone, e-mail, prices and reviews are placeholders. Edit <code>src/config/site.ts</code> and <code>src/data/</code> before launch.
        </p>
      )}
    </footer>
  )
}
