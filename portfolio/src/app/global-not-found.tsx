import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = { title: '404 — DJILALI' }

export default function GlobalNotFound() {
  return (
    <html lang="en" className={GeistMono.variable}>
      <body>
        <main className="grid min-h-[100svh] place-items-center px-6 text-center">
          <div>
            <p style={{ color: 'var(--accent)' }}>[404]</p>
            <h1 className="mt-4 text-xl font-normal text-white">This page drifted into the void.</h1>
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`} className="mt-8 inline-block underline">
              Back home -&gt; DJILALI
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
