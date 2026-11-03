import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-sm text-dim">404</p>
        <h1 className="h-section mt-4">This page drifted into the void.</h1>
        <Link href="/" className="btn btn-primary mt-10">
          Back home
        </Link>
      </div>
    </main>
  )
}
