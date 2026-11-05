/**
 * Android app integration (Capacitor). Does nothing in a normal browser.
 * - Hardware back button closes the open drawer / dialog / menu first, then leaves the app.
 * - Links that open in a new tab (socials, map directions) go to the phone's browser or app.
 */
import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

export async function initNative() {
  if (!isNative) return
  document.documentElement.classList.add('native-app')

  const [{ App }, { StatusBar, Style }] = await Promise.all([import('@capacitor/app'), import('@capacitor/status-bar')])
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  StatusBar.setBackgroundColor({ color: '#111111' }).catch(() => {})

  App.addListener('backButton', () => {
    const overlayOpen = document.querySelector('[role="dialog"], #mobile-nav')
    if (overlayOpen) {
      // Same path as pressing Escape: every overlay already closes on it.
      const ev = { key: 'Escape', bubbles: true, cancelable: true }
      document.dispatchEvent(new KeyboardEvent('keydown', ev))
      window.dispatchEvent(new KeyboardEvent('keydown', ev))
    } else if (window.scrollY > 200) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      App.exitApp()
    }
  })

  // The WebView can't open new tabs: navigate instead, and Capacitor hands
  // external URLs (https, tel:, mailto:) to the system.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[target="_blank"]') as HTMLAnchorElement | null
    if (!a?.href) return
    e.preventDefault()
    window.location.href = a.href
  })
}
