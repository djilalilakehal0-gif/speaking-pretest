import { useSyncExternalStore } from 'react'

/** Favourites: product ids kept in this browser only, shared by every card. */
const KEY = 'napolitime.favourites.v1'
let favs: string[] = (() => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as string[] } catch { return [] }
})()
const listeners = new Set<() => void>()

function toggle(id: string) {
  favs = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]
  try { localStorage.setItem(KEY, JSON.stringify(favs)) } catch { /* storage unavailable */ }
  listeners.forEach((l) => l())
}

export function useFavourites() {
  const list = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => favs,
  )
  return { favs: list, toggle, isFav: (id: string) => list.includes(id) }
}
