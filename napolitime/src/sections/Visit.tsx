import { useEffect, useState, type FormEvent } from 'react'
import { site } from '../config/site'
import { categories } from '../data/menu'
import { openStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { subscribeNewsletter } from '../lib/order'
import { Logo } from '../components/Logo'
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, TiktokIcon } from '../components/icons/Icons'

const socialIcon = { instagram: InstagramIcon, tiktok: TiktokIcon, facebook: FacebookIcon } as const

/** The restaurant: storefront, address, phone and opening hours. */
export function Visit() {
  const [status, setStatus] = useState(() => openStatus())
  useEffect(() => {
    const t = setInterval(() => setStatus(openStatus()), 60_000)
    return () => clearInterval(t)
  }, [])
  const store = photo('storefront')

  return (
    <section id="visit" className="border-t border-white/[0.08] bg-ink py-20 sm:py-28" aria-labelledby="visit-title">
      <div className="container-x grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <img
          src={store.src} srcSet={store.srcSet} sizes="(min-width:1024px) 52vw, 92vw" loading="lazy"
          alt="La devanture de NAPOLITIME le soir : enseigne lumineuse, porte ouverte et comptoir"
          className="w-full rounded-2xl"
        />

        <div id="contact">
          <h2 id="visit-title" className="display text-[clamp(3rem,7vw,5.5rem)]">Le restaurant</h2>
          <p className="mt-5 text-xl">{site.contact.street}<br /><span className="text-ash">{site.contact.city}</span></p>

          <a href={site.contact.phoneHref} className="mt-8 flex items-center gap-4 rounded-xl bg-tomato px-5 py-4 text-white transition-colors hover:bg-[#ff1a26]">
            <PhoneIcon size={26} />
            <span>
              <span className="block text-sm text-white/80">Commander par téléphone</span>
              <span className="display block text-4xl">{site.contact.phoneDisplay}</span>
            </span>
          </a>

          <div className="mt-10">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-xl font-semibold">Horaires</h3>
              <p className="flex items-center gap-2 text-sm text-ash" role="status">
                <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-[#3ddc84]' : 'bg-tomato'}`} aria-hidden />
                {status.open ? 'Ouvert' : 'Fermé'}, {status.label.charAt(0).toLowerCase() + status.label.slice(1)}
              </p>
            </div>
            <table className="mt-3 w-full text-base">
              <caption className="sr-only">Horaires d'ouverture</caption>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = site.hours.find((x) => x.day === d)!
                  const today = d === status.today
                  return (
                    <tr key={d} className={`border-b border-white/[0.07] ${today ? 'font-semibold text-white' : 'text-ash'}`} aria-current={today ? 'date' : undefined}>
                      <th scope="row" className="py-2.5 text-left font-[inherit]">{h.label}{today && <span className="sr-only"> (aujourd'hui)</span>}</th>
                      <td className="py-2.5 text-right tabular-nums">{h.open ? `${h.open} – ${h.close}` : 'Fermé'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={site.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Itinéraire</a>
            <a href={`mailto:${site.contact.email}`} className="btn btn-ghost"><MailIcon size={18} /> Écrire</a>
          </div>
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setState('error'); setMsg('Cette adresse e-mail est incomplète.'); return }
    if (!configured) {
      window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent('Inscription aux offres')}&body=${encodeURIComponent(`Merci d'ajouter ${email.trim()} aux offres NAPOLITIME.`)}`
      setState('idle'); setMsg('Votre messagerie s’est ouverte avec la demande : envoyez-la pour vous inscrire.')
      return
    }
    setState('sending')
    const r = await subscribeNewsletter(email)
    if (r.ok) { setState('done'); setMsg('Inscription enregistrée. Vérifiez votre boîte mail.'); setEmail('') }
    else { setState('error'); setMsg(r.error ?? 'L’inscription n’a pas abouti. Réessayez.') }
  }

  return (
    <footer className="border-t border-white/[0.08] bg-ink-2" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">Informations NAPOLITIME</h2>
      <div className="container-x grid gap-12 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-ash">Qualité, goût et convivialité, de midi à tard le soir.</p>
          <ul className="mt-6 flex gap-2">
            {site.socials.map((s) => {
              const Icon = socialIcon[s.id as keyof typeof socialIcon]
              return (
                <li key={s.id}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} sur ${s.label} (nouvel onglet)`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-tomato hover:bg-tomato">
                    <Icon size={20} />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <nav aria-label="Le menu">
          <h3 className="font-semibold">Le menu</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-ash md:grid-cols-1">
            {categories.map((c) => <li key={c.id}><a href={`#cat-${c.id}`} className="hover:text-white">{c.label}</a></li>)}
          </ul>
        </nav>

        <div>
          <h3 className="font-semibold">Offres par e-mail</h3>
          <p className="mt-1 text-sm text-ash">Nouveautés et promotions, un e-mail par mois au plus.</p>
          <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-2">
            <label htmlFor="nl-email" className="sr-only">Adresse e-mail</label>
            <input id="nl-email" type="email" inputMode="email" autoComplete="email" maxLength={120} required
              value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
              placeholder="vous@exemple.fr" className="input" aria-invalid={state === 'error' || undefined} aria-describedby="nl-msg" />
            <button type="submit" disabled={state === 'sending'} className="btn btn-primary">{state === 'sending' ? 'Inscription…' : "M'inscrire"}</button>
          </form>
          <p id="nl-msg" role="status" className={`mt-2 min-h-5 text-sm ${state === 'error' ? 'text-gold' : 'text-ash'}`}>{msg}</p>
        </div>
      </div>

      <div className="container-x flex flex-col justify-between gap-2 border-t border-white/[0.08] py-6 text-sm text-ash sm:flex-row">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <p>Prix TTC. Photos non contractuelles.</p>
      </div>
      {site.isDemo && (
        <p className="bg-white px-4 py-2 text-center text-sm font-semibold text-ink">
          À compléter : l’adresse, l’e-mail, les réseaux sociaux et les horaires sont des exemples (src/config/site.ts).
        </p>
      )}
    </footer>
  )
}
