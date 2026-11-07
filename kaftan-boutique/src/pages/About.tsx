import { Link } from 'react-router-dom'
import { asset, PRODUCTS, STORE } from '../data/products'

export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
      <p className="eyebrow">About us</p>
      <h1 className="mt-2 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">A small boutique for kaftans made to be noticed</h1>
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div className="space-y-5 text-beige-200">
          <p>{STORE.brand} is a boutique for luxury kaftans: deep chocolate, burgundy, red, champagne and our darkest satin. Each piece is shown on its own, in warm light, the way we would present it to you in the shop.</p>
          <p>The 3D boutique lets you do online what you would do in person: step closer, turn the garment around, and look at the neckline, the sleeves and the hem before you choose.</p>
          <p className="text-sm text-beige-300">Brand story placeholder: the store owner will replace this text with the house's own history.</p>
          <Link to="/boutique" className="btn btn-gold">Enter the 3D boutique</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PRODUCTS.slice(0, 4).map((p, i) => (
            <img key={p.id} src={asset(i % 2 ? p.images.back : p.images.threeQuarter)} alt={p.name} className={`aspect-[3/4] w-full rounded-2xl object-cover ${i % 2 ? 'mt-10' : ''}`} loading="lazy" />
          ))}
        </div>
      </div>
    </div>
  )
}
