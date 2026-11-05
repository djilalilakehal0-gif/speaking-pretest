'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { contact } from '@/content/site'

const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'

/**
 * Floating WhatsApp shortcut. Appears after the hero, hides while the contact
 * section (which has its own form) is on screen. Hidden when contact.whatsapp is empty.
 */
export function WhatsAppButton({ label, message, newTab }: { label: string; message: string; newTab: string }) {
  const [visible, setVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!contact.whatsapp) return
    let pastHero = false
    let contactInView = false
    const update = () => setVisible(pastHero && !contactInView)
    const onScroll = () => {
      pastHero = window.scrollY > window.innerHeight * 0.6
      update()
    }
    const section = document.getElementById('contact')
    const io = new IntersectionObserver(([e]) => {
      contactInView = e.isIntersecting
      update()
    }, { threshold: 0.15 })
    if (section) io.observe(section)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  if (!contact.whatsapp) return null
  const href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          key="wa"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} ${newTab}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-[max(1.25rem,env(safe-area-inset-right))] z-30 flex h-14 items-center gap-0 rounded-full bg-[#25d366] ps-4 pe-4 text-[#062e16] shadow-[0_12px_40px_-8px_rgb(37_211_102/0.6)] transition-[gap,padding] duration-500 hover:gap-2.5 hover:pe-5 focus-visible:gap-2.5 focus-visible:pe-5"
        >
          <span aria-hidden className="absolute inset-0 -z-10 animate-ping-soft rounded-full bg-[#25d366]/40 [animation-duration:3s]" />
          <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor" aria-hidden>
            <path d={WHATSAPP_PATH} />
          </svg>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-500 group-hover:max-w-[16rem] group-hover:opacity-100 group-focus-visible:max-w-[16rem] group-focus-visible:opacity-100">
            {label}
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
