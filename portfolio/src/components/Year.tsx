'use client'
import { useEffect, useState } from 'react'

/** Always shows the visitor's current year, even on a statically exported page. */
export function Year() {
  const [y, setY] = useState(() => new Date().getFullYear())
  useEffect(() => setY(new Date().getFullYear()), [])
  return <span suppressHydrationWarning>{y}</span>
}
