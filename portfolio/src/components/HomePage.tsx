import { Field } from '@/components/axon/Field'
import { contact, services, site, socials, stack } from '@/content/site'
import { getDictionary, localeMeta, locales, type Locale } from '@/content/i18n'
import { asset } from '@/lib/asset'

function Mark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="#fff" strokeWidth="1.6" />
      <polygon
        fill="#fff"
        points="20,10 21.53,16.30 27.07,12.93 23.70,18.47 30,20 23.70,21.53 27.07,27.07 21.53,23.70 20,30 18.47,23.70 12.93,27.07 16.30,21.53 10,20 16.30,18.47 12.93,12.93 18.47,16.30"
      />
    </svg>
  )
}

export function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang)
  const waHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(t.contact.waIntro)}` : ''

  return (
    <>
      <Field />
      <main id="main" tabIndex={-1} className="ui">
        <header className="brand blend">
          <Mark />
          <div>
            <h1 className="name">{site.brand}</h1>
            <p className="sub">{t.site.title}</p>
          </div>
        </header>

        <div className="top-right">
          <nav className="langs" aria-label={t.ui.language}>
            {locales.map((l) => (
              <a key={l} href={asset(localeMeta[l].path)} hrefLang={l} lang={l} aria-current={l === lang ? 'page' : undefined}>
                {localeMeta[l].short}
              </a>
            ))}
          </nav>
        </div>

        <div className="side">
          <section className="intro" aria-labelledby="s-about">
            <img
              className="portrait"
              src={asset(site.portrait.srcSmall)}
              alt={t.site.portraitAlt}
              width={480}
              height={525}
              decoding="async"
            />
            <div>
              <h2 id="s-about">[{t.nav.about}]</h2>
              <p className="role">{t.site.role}</p>
              <p>{t.about.text}</p>
            </div>
          </section>

          <div className="about">
            <section aria-labelledby="s-services">
              <h2 id="s-services">[{t.nav.services}]</h2>
              <ul>
                {services.map((k) => (
                  <li key={k}>{t.services.items[k].title}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="s-status">
              <h2 id="s-status">[{t.contact.status}]</h2>
              <p className="plain">{t.site.availability}</p>
              <p className="plain muted">{t.site.location}</p>
            </section>

            <section aria-labelledby="s-contact">
              <h2 id="s-contact">[{t.nav.contact}]</h2>
              {contact.phone && (
                <a href={`tel:${contact.phone}`}>
                  {t.contact.phone} <span className="arr" aria-hidden="true" /> <bdi dir="ltr">{contact.phoneDisplay}</bdi>
                </a>
              )}
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  {t.contact.whatsapp} <span className="arr" aria-hidden="true" /> {t.contact.waFab}
                  <span className="sr-only"> {t.ui.newTab}</span>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`}>
                  {t.contact.email} <span className="arr" aria-hidden="true" /> <bdi dir="ltr">{contact.email}</bdi>
                </a>
              )}
              {socials.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label} <span className="arr" aria-hidden="true" /> <bdi dir="ltr">{s.href.replace(/^https?:\/\/(www\.)?/, '')}</bdi>
                  <span className="sr-only"> {t.ui.newTab}</span>
                </a>
              ))}
            </section>

            <section aria-labelledby="s-stack">
              <h2 id="s-stack">[{t.nav.stack}]</h2>
              <dl className="stack">
                {stack.map((c) => (
                  <div key={c.key}>
                    <dt>{t.stack.categories[c.key].name}</dt>
                    <dd>{c.items.map((i) => i.name).join(' · ')}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <p className="foot muted">
              © {new Date().getFullYear()} {site.name} — {t.footer.rights}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
