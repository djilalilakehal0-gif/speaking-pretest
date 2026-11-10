'use client'

import { useMemo, useState } from 'react'
import { projects } from '@/content/site'
import type { Dictionary } from '@/content/i18n'
import { asset } from '@/lib/asset'

type Props = {
  t: Pick<Dictionary['work'], 'items' | 'view' | 'source' | 'screenshotAlt' | 'srLive' | 'srSource'>
  ui: Pick<Dictionary['ui'], 'all' | 'filter' | 'newTab'>
}

const ALL = '__all'
const smallImage = (src: string) => src.replace(/\.webp$/, '-sm.webp')

/** Technology chips + the project cards they filter. */
export function Work({ t, ui }: Props) {
  const tags = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.tags))), [])
  const [active, setActive] = useState(ALL)
  const shown = active === ALL ? projects : projects.filter((p) => p.tags.includes(active))

  return (
    <>
      <div className="tags blend" role="group" aria-label={ui.filter}>
        {[ALL, ...tags].map((tag) => (
          <button
            key={tag}
            type="button"
            className={`chip${active === tag ? ' active' : ''}`}
            aria-pressed={active === tag}
            onClick={() => setActive(tag)}
          >
            {tag === ALL ? ui.all : tag}
          </button>
        ))}
      </div>

      <ul className="list">
        {shown.map((p) => {
          const item = t.items[p.id]
          return (
            <li key={p.id} className="card">
              <a className="card-link" href={p.live} target="_blank" rel="noopener noreferrer">
                <div className="thumb">
                  {p.image && (
                    <img
                      src={asset(smallImage(p.image))}
                      alt={t.screenshotAlt.replace('{title}', p.title)}
                      width={720}
                      height={450}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="meta">
                  <span>{p.title}</span>
                  <span>{item.category}</span>
                </div>
                <span className="sr-only">{t.srLive}</span>
              </a>
              <div className="card-actions">
                <span className="num">{p.n}</span>
                {p.source && (
                  <a href={p.source} target="_blank" rel="noopener noreferrer">
                    {t.source} <span className="arr" aria-hidden="true" /><span className="sr-only"> {t.srSource.replace('{title}', p.title)}</span>
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
