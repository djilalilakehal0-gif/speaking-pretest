'use client'
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowUpRight, CheckCircle2, Loader2, Mail, Send } from 'lucide-react'
import { contact, contactCopy, site, socials } from '@/content/site'
import { Magnetic } from '../ui/Magnetic'
import { Reveal } from '../ui/Reveal'
import { SocialIcon } from '../ui/SocialIcon'

type Field = 'name' | 'email' | 'subject' | 'message'
type Values = Record<Field, string>
type Status = { kind: 'idle' | 'sending' | 'sent' | 'mailto' | 'error'; message?: string }

const EMPTY: Values = { name: '', email: '', subject: '', message: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (v.subject.trim().length < 3) e.subject = 'Please add a short subject.'
  if (v.message.trim().length < 20) e.message = 'Tell me a little more — at least 20 characters.'
  if (v.message.length > 5000) e.message = 'Please keep the message under 5000 characters.'
  return e
}

export function Contact() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const form = useRef<HTMLFormElement>(null)
  const honeypot = useRef<HTMLInputElement>(null)

  const update = (f: Field, val: string) => {
    const next = { ...values, [f]: val }
    setValues(next)
    if (touched[f]) setErrors(validate(next))
  }
  const blur = (f: Field) => {
    setTouched((t) => ({ ...t, [f]: true }))
    setErrors(validate(values))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setTouched({ name: true, email: true, subject: true, message: true })
    const firstBad = (Object.keys(errs) as Field[])[0]
    if (firstBad) {
      form.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus()
      return
    }
    if (honeypot.current?.value) {
      setStatus({ kind: 'sent' }) // silently drop bots
      return
    }
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
    }

    if (contact.endpoint) {
      setStatus({ kind: 'sending' })
      try {
        const res = await fetch(contact.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...payload, _replyto: payload.email, _subject: `[Portfolio] ${payload.subject}` }),
        })
        if (!res.ok) throw new Error(String(res.status))
        setStatus({ kind: 'sent' })
        setValues(EMPTY)
        setTouched({})
      } catch {
        setStatus({
          kind: 'error',
          message: contact.email
            ? `Your message couldn't be sent right now. Please try again, or email ${contact.email} directly.`
            : "Your message couldn't be sent right now. Please try again in a moment.",
        })
      }
      return
    }

    if (contact.email) {
      const body = `${payload.message}\n\n— ${payload.name} (${payload.email})`
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`
      setStatus({ kind: 'mailto' })
      return
    }

    setStatus({
      kind: 'error',
      message: 'The contact form is not connected yet. Please reach out through one of the profiles listed here.',
    })
  }

  const fieldProps = (f: Field) => ({
    id: `c-${f}`,
    name: f,
    value: values[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(f, e.target.value),
    onBlur: () => blur(f),
    'aria-invalid': touched[f] && errors[f] ? true : undefined,
    'aria-describedby': touched[f] && errors[f] ? `c-${f}-err` : undefined,
    className: 'field',
  })

  return (
    <section id="contact" aria-labelledby="contact-title" className="section overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[15%] h-[70vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(79_124_255/0.16),rgb(139_92_246/0.06)_55%,transparent)]" />
        <div className="grid-lines absolute inset-0 opacity-60" />
      </div>

      <div className="container-x">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{contactCopy.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 id="contact-title" className="h-display mt-6 text-balance">
              {contactCopy.title[0]} <span className="text-gradient animate-gradient">{contactCopy.title[1]}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-7 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-muted md:text-lg">{contactCopy.text}</p>
          </Reveal>
          <Reveal delay={0.18} className="mt-10 flex justify-center">
            <Magnetic>
              <a
                href="#c-name"
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById('c-name')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  el?.focus({ preventScroll: true })
                }}
                className="btn btn-primary !min-h-14 !px-8 text-base"
              >
                Start a Project <ArrowUpRight className="size-5" aria-hidden />
              </a>
            </Magnetic>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* direct channels */}
          <Reveal className="glass flex flex-col rounded-3xl p-7 sm:p-9 [&>*]:shrink-0">
            <h3 className="text-2xl font-semibold tracking-tight">Prefer a direct line?</h3>
            <p className="mt-3 leading-relaxed text-muted">
              I usually reply within a couple of working days. Share as much context as you like — goals, timeline, links or references.
            </p>
            <ul className="mt-8 space-y-3">
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-line-strong hover:bg-white/[0.03]">
                    <span className="grid size-11 place-items-center rounded-xl bg-white/[0.05]">
                      <Mail className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-dim">Email</span>
                      <span className="block truncate text-sm">{contact.email}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-dim transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                  </a>
                </li>
              )}
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-line-strong hover:bg-white/[0.03]"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-white/[0.05]">
                      <SocialIcon k={s.key} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-dim">{s.label}</span>
                      <span className="block truncate text-sm">{s.href.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-dim transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm lg:mt-auto">
              <div>
                <dt className="text-xs text-dim">Status</dt>
                <dd className="mt-1 flex items-center gap-2 text-soft">
                  <span className="size-1.5 rounded-full bg-[#4ade80]" /> {site.availability}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-dim">Location</dt>
                <dd className="mt-1 text-soft">{site.location}</dd>
              </div>
            </dl>
          </Reveal>

          {/* form */}
          <Reveal delay={0.08} className="border-beam glass rounded-3xl p-7 sm:p-9">
            <form ref={form} noValidate onSubmit={onSubmit} aria-labelledby="form-title">
              <h3 id="form-title" className="text-2xl font-semibold tracking-tight">
                Tell me about your project
              </h3>
              <p className="mt-2 text-sm text-muted">All fields are required.</p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <FormField label="Name" id="c-name" error={touched.name ? errors.name : undefined}>
                  <input type="text" autoComplete="name" placeholder="Your name" {...fieldProps('name')} />
                </FormField>
                <FormField label="Email" id="c-email" error={touched.email ? errors.email : undefined}>
                  <input type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" {...fieldProps('email')} />
                </FormField>
                <FormField label="Subject" id="c-subject" error={touched.subject ? errors.subject : undefined} className="sm:col-span-2">
                  <input type="text" placeholder="New website, web app, collaboration…" {...fieldProps('subject')} />
                </FormField>
                <FormField label="Message" id="c-message" error={touched.message ? errors.message : undefined} className="sm:col-span-2">
                  <textarea rows={6} placeholder="What are you building, and how can I help?" {...fieldProps('message')} className="field resize-y" />
                </FormField>
              </div>

              {/* honeypot (hidden from people and assistive tech) */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Leave this empty <input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" disabled={status.kind === 'sending'} className="btn btn-primary group w-full disabled:opacity-70 sm:w-auto">
                  {status.kind === 'sending' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
                    </>
                  ) : (
                    <>
                      Send Message <Send className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </>
                  )}
                </button>
                <p className="text-xs text-dim">Your details are only used to reply to you.</p>
              </div>

              <div aria-live="polite" role="status" className="mt-6 empty:hidden">
                <AnimatePresence mode="wait">
                  {status.kind === 'sent' && (
                    <Notice key="sent" tone="ok">
                      Thank you — your message has been sent. I’ll get back to you soon.
                    </Notice>
                  )}
                  {status.kind === 'mailto' && (
                    <Notice key="mailto" tone="ok">
                      Your email app should now be open with the message ready — just press send. If nothing opened, write to {contact.email}.
                    </Notice>
                  )}
                  {status.kind === 'error' && (
                    <Notice key="err" tone="error">
                      {status.message}
                    </Notice>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function FormField({ label, id, error, className = '', children }: { label: string; id: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-soft">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-2 flex items-center gap-1.5 text-xs text-[#fca5a5]">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

function Notice({ tone, children }: { tone: 'ok' | 'error'; children: React.ReactNode }) {
  const ok = tone === 'ok'
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${
        ok ? 'border-[#4ade80]/30 bg-[#4ade80]/[0.06] text-[#bbf7d0]' : 'border-[#f87171]/30 bg-[#f87171]/[0.06] text-[#fecaca]'
      }`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span>{children}</span>
    </motion.p>
  )
}
