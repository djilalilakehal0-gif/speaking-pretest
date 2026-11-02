/** Editable marketing content (demo copy). */
import { products, type Product } from './menu'

export interface Deal {
  id: string
  name: string
  kicker: string
  price: number
  /** Product ids included in the bundle (for display and kitchen). */
  includes: string[]
  image: string
  accent: 'red' | 'gold' | 'cream'
}

export const deals: Deal[] = [
  {
    id: 'deal-napoli-duo', name: 'Napoli Duo', kicker: 'For two',
    price: 24.9, includes: ['margherita', 'classic-smash', 'fries', 'lemonade'],
    image: 'napoli', accent: 'red',
  },
  {
    id: 'deal-family', name: 'Family Feast', kicker: 'Serves 4',
    price: 49, includes: ['margherita', 'diavola', 'double-cheese', 'crispy-chicken', 'fries', 'onion-rings'],
    image: 'oven', accent: 'gold',
  },
  {
    id: 'deal-lunch', name: 'Pranzo Express', kicker: 'Weekdays 12–15',
    price: 13.5, includes: ['margherita', 'cola'],
    image: 'margherita', accent: 'cream',
  },
]

export function dealSavings(deal: Deal) {
  const full = deal.includes.reduce((s, id) => s + (products.find((p) => p.id === id)?.price ?? 0), 0)
  return Math.max(0, full - deal.price)
}

/** DEMO REVIEWS — replace with real, verifiable reviews before going live. */
export const reviews = [
  { name: 'Giulia R.', city: 'Napoli', rating: 5, text: 'The Napoli Special is unreal — cold burrata on that blistered crust. Tastes exactly like the pizzerias on Via dei Tribunali.' },
  { name: 'Tom W.', city: 'London', rating: 5, text: 'Came for pizza, left obsessed with the Classic Smash. Crispy edges, perfect sauce, ridiculous value.' },
  { name: 'Sofia M.', city: 'Milano', rating: 5, text: 'Delivery arrived hot in 28 minutes. The tiramisù alone is worth the order.' },
  { name: 'Karim B.', city: 'Paris', rating: 4, text: 'Proper Neapolitan dough, soft and airy. The Diavola has real heat. Will be back for the Double Cheese.' },
  { name: 'Lena K.', city: 'Berlin', rating: 5, text: 'Gorgeous place, warm staff, and the four-cheese pizza is the best I have had outside Italy.' },
]

export const ingredients = [
  { title: 'San Marzano DOP', text: 'Tomatoes grown in volcanic soil at the foot of Vesuvius — sweet, low-acid, unmistakable.' },
  { title: 'Fior di latte', text: 'Mozzarella from Agerola, delivered three times a week and never frozen.' },
  { title: '48-hour dough', text: 'Caputo "00" flour, water, salt and time. Slow fermentation for an airy, digestible crust.' },
  { title: 'Dry-aged beef', text: 'Chuck and brisket ground in-house every morning, smashed to order.' },
]

export const bestSellers: Product[] = products.filter((p) => p.tags?.includes('bestseller'))
