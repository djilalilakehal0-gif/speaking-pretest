import { site } from '../config/site'
import { photo } from '../lib/img'
import { OpenSign } from './Hero'
import { InstagramIcon, FacebookIcon, TiktokIcon } from '../components/icons/Icons'

const socialIcon = { instagram: InstagramIcon, tiktok: TiktokIcon, facebook: FacebookIcon } as const

/** Short form of the week, built from the real hours: "Mardi, mercredi 18:00 – 23:00". */
function weekLines() {
  const order = [1, 2, 3, 4, 5, 6, 0]
  const groups: { days: string[]; hours: string }[] = []
  for (const d of order) {
    const h = site.hours.find((x) => x.day === d)!
    const hours = h.open ? `${h.open} – ${h.close}` : 'fermé'
    const last = groups[groups.length - 1]
    if (last && last.hours === hours) last.days.push(h.label.toLowerCase())
    else groups.push({ days: [h.label.toLowerCase()], hours })
  }
  return groups.map((g) => {
    const days = g.days.length > 2 ? `${g.days[0]} au ${g.days[g.days.length - 1]}` : g.days.join(' et ')
    return `${days.charAt(0).toUpperCase()}${days.slice(1)} : ${g.hours}`
  })
}

/**
 * The restaurant — a full-width picture of the shop, then "Address in display rows":
 * every row at the same display size, told apart by two flat tones.
 */
/** The address in site.ts is still an example until the owner fills it in. */
const addressKnown = !site.contact.street.startsWith('Adresse')

export function Visit() {
  const store = photo('storefront')
  const row = 'flex min-h-[5.25rem] items-end px-[var(--margin)] pb-3 sm:min-h-[9.5rem] sm:pb-5'
  const big = 'display text-[length:var(--step-head)] !leading-[0.9]'
  return (
    <section id="visit" className="mt-32 sm:mt-48" aria-labelledby="visit-title">
      <div className="container-x">
        <div className="overflow-hidden" data-reveal>
          <img src={store.src} srcSet={store.srcSet} sizes="(min-width:1440px) 1376px, 100vw" loading="lazy" width={1151} height={1220}
            alt="La devanture de NAPOLITIME le soir : enseigne lumineuse, porte ouverte et comptoir"
            className="drift aspect-[4/5] w-full object-cover object-top sm:aspect-[21/9] sm:object-[50%_22%]" />
        </div>
      </div>

      <div id="contact" className="mx-auto mt-16 max-w-[1440px]">
        <div className={`${row} bg-ink`}>
          <h2 id="visit-title" className={big} data-reveal>Venir chez Napolitime</h2>
        </div>
        <a href={site.contact.phoneHref} className={`${row} bg-ink-2 transition-colors hover:bg-tomato`}>
          <span className={big}>{site.contact.phoneDisplay}</span>
        </a>
        <a href={site.contact.mapUrl} target="_blank" rel="noopener noreferrer" className={`${row} bg-ink transition-colors hover:bg-ink-3`}>
          <span className={big}>{addressKnown ? `${site.contact.street}, ${site.contact.city}` : 'Itinéraire'}</span>
        </a>
        <div className={`${row} flex-col !items-start justify-end gap-3 bg-ink-2 !pb-14 sm:flex-row sm:!items-end sm:justify-between sm:!pb-5`}>
          <OpenSign big />
          <ul className="text-[length:var(--step-body)] sm:text-right">
            {weekLines().map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
        <div className={`${row} bg-tomato sm:bg-ink`}>
          <p className={`${big} flex items-center gap-6`}>
            Une faim ?
            <a href={site.contact.phoneHref} aria-label={`Appeler NAPOLITIME au ${site.contact.phoneDisplay}`}
              className="inline-flex h-[0.9em] w-[0.9em] items-center justify-center bg-white text-ink transition-transform hover:scale-110 active:scale-95">
              <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

/** Footer — "Invitation over a cropped name", in the inverse colours. */
export function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden bg-white text-ink sm:mt-48" aria-labelledby="footer-title">
      <div className="container-x grid gap-10 pt-16 sm:pt-24 lg:grid-cols-12">
        <div className="lg:col-span-7" data-reveal>
          <h2 id="footer-title" className="display max-w-[12ch] text-[length:var(--step-head)] !leading-[0.9]">Ce soir, on vous attend</h2>
          <a href={site.contact.phoneHref} className="btn mt-8 w-full bg-ink text-white hover:bg-tomato sm:w-auto">Appeler le {site.contact.phoneDisplay}</a>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[length:var(--step-body)] lg:col-span-3 lg:col-start-10 lg:flex-col" data-reveal>
          {site.socials.map((s) => {
            const Icon = socialIcon[s.id as keyof typeof socialIcon]
            return (
              <li key={s.id}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                  <Icon size={18} /> {s.label}
                </a>
              </li>
            )
          })}
          <li><a href={`mailto:${site.contact.email}`} className="underline-offset-4 hover:underline">{site.contact.email}</a></li>
        </ul>
      </div>

      <div className="container-x mt-20 flex flex-col justify-between gap-1 text-[length:var(--step-small)] sm:flex-row">
        <p>© {new Date().getFullYear()} {site.name}. Prix TTC, photos non contractuelles.</p>
        <p>
          Photo du burger : Unsplash. Vidéo : <a className="underline" href="https://commons.wikimedia.org/wiki/File:Adanada_%C5%9Ei%C5%9F_Kebap.webm">« Adanada Şiş Kebap »</a> par Basak,{' '}
          <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>, via Wikimedia Commons.
        </p>
      </div>
      {site.isDemo && (
        <p className="container-x mt-1 max-w-[70ch] text-[length:var(--step-small)] font-medium text-tomato-deep">
          À compléter avant le lancement : l’adresse, l’e-mail, les réseaux sociaux et les horaires sont des exemples.
        </p>
      )}
      <p aria-hidden className="monument-foot display -mb-[0.06em] mt-4 translate-y-[22%] whitespace-nowrap px-[var(--margin)] text-[21.4vw] !leading-[0.8]">
        Napolitime
      </p>
    </footer>
  )
}
