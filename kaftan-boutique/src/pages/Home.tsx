import { Link } from 'react-router-dom'
import { BoutiqueExperience } from '../components/BoutiqueExperience'
import { Navigation } from '../components/Navigation'
import { ProductCard } from '../components/ProductCard'
import { PRODUCTS, STORE } from '../data/products'

export default function Home() {
  return (
    <>
      <section className="relative h-[100svh] min-h-[560px] overflow-hidden" aria-label="The 3D boutique">
        <Navigation overlay />
        <BoutiqueExperience>
          <div className="absolute top-24 left-4 max-w-md md:top-32 md:left-10">
            <p className="eyebrow">The boutique · five kaftans</p>
            <h1 className="mt-3 font-serif text-5xl leading-[0.95] font-light text-beige-50 md:text-7xl">
              Satin, in <em className="text-champagne">warm light</em>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-beige-200">Walk the aisle, choose a model and turn her to see the back, the sleeves and the hem.</p>
            <Link to="/collection" className="btn btn-gold pointer-events-auto mt-6">
              Shop collection
            </Link>
          </div>
        </BoutiqueExperience>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-24 md:grid-cols-2 md:px-8" aria-labelledby="intro">
        <div>
          <p className="eyebrow">{STORE.brand}</p>
          <h2 id="intro" className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
            A boutique, not an exhibition hall
          </h2>
        </div>
        <div className="space-y-4 text-beige-200">
          <p>We show each kaftan the way we would in the shop: on its own, in its own light, with room to walk around it. Choose a model in the 3D boutique and you can bring her forward, turn her up to 260° and look closely at the neckline, the sleeves and the fall of the satin.</p>
          <p className="text-sm text-beige-300">Every piece is modelled in 3D from our reference photographs, front, sides and back.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8" aria-labelledby="featured">
        <div className="mb-8 flex items-end justify-between">
          <h2 id="featured" className="font-serif text-3xl md:text-4xl">
            The collection
          </h2>
          <Link to="/collection" className="text-[0.68rem] tracking-[0.24em] text-gold-soft uppercase">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  )
}
