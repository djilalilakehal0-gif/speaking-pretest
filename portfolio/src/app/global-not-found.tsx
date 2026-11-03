import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = { title: '404 — DJILALI' }

export default function GlobalNotFound() {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <main className="grid min-h-[100svh] place-items-center px-6 text-center">
          <div>
            <p className="font-mono text-sm text-dim">404</p>
            <h1 className="h-section mt-4">This page drifted into the void.</h1>
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`} className="btn btn-primary mt-10">
              Back home
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
