import { BoutiqueExperience } from '../components/BoutiqueExperience'
import { Navigation } from '../components/Navigation'

export default function Boutique() {
  return (
    <section className="relative h-[100svh] min-h-[520px] overflow-hidden" aria-label="The 3D boutique">
      <h1 className="sr-only">3D Boutique</h1>
      <Navigation overlay />
      <BoutiqueExperience />
    </section>
  )
}
