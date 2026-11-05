'use client'
import { useEffect } from 'react'

/** Adds `is-hidden` to <html> while the tab is in the background so CSS loops pause. */
export function PageVisibility() {
  useEffect(() => {
    const on = () => document.documentElement.classList.toggle('is-hidden', document.hidden)
    on()
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return null
}
