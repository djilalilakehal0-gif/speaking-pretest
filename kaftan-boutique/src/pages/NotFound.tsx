import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-serif text-5xl">This page is not in the boutique</h1>
      <Link to="/" className="btn btn-gold mt-8">Back to the boutique</Link>
    </div>
  )
}
