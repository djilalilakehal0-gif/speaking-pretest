import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

export function SectionHeading({
  id,
  eyebrow,
  title,
  text,
  align = 'left',
}: {
  id: string
  eyebrow: string
  title: ReactNode
  text?: ReactNode
  align?: 'left' | 'center'
}) {
  const center = align === 'center'
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 id={id} className="h-section mt-5 text-balance">
          {title}
        </h2>
      </Reveal>
      {text && (
        <Reveal delay={0.12}>
          <p className={`mt-6 text-pretty text-[1.05rem] leading-relaxed text-muted md:text-lg ${center ? 'mx-auto' : ''} max-w-2xl`}>
            {text}
          </p>
        </Reveal>
      )}
    </div>
  )
}
