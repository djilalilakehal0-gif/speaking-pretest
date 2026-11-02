/**
 * MENU DATA — edit freely. Prices are in euros (demo prices).
 * `image` is a file name prefix in public/img/ (both `-640.webp` and `-1280.webp` must exist).
 * Allergens follow the EU's 14 declarable allergens.
 */

export type Category = 'pizzas' | 'burgers' | 'sides' | 'drinks' | 'desserts'

export type Allergen =
  | 'gluten' | 'milk' | 'eggs' | 'mustard' | 'sesame' | 'soy' | 'celery' | 'nuts' | 'sulphites' | 'fish'

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  description: string
  ingredients: string[]
  allergens: Allergen[]
  image: string
  tags?: ('bestseller' | 'spicy' | 'vegetarian' | 'new' | 'signature')[]
  /** Short flavour note shown in the details modal. */
  note?: string
}

export const categories: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All menu' },
  { id: 'pizzas', label: 'Pizzas' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'sides', label: 'Sides' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'desserts', label: 'Desserts' },
]

export const allergenLabels: Record<Allergen, string> = {
  gluten: 'Gluten', milk: 'Milk', eggs: 'Eggs', mustard: 'Mustard', sesame: 'Sesame',
  soy: 'Soy', celery: 'Celery', nuts: 'Nuts', sulphites: 'Sulphites', fish: 'Fish',
}

export const products: Product[] = [
  // ── PIZZAS ────────────────────────────────────────────────
  {
    id: 'margherita', name: 'Margherita', category: 'pizzas', price: 9.5,
    description: 'San Marzano tomato, fior di latte mozzarella, fresh basil, extra-virgin olive oil.',
    ingredients: ['San Marzano tomato', 'Fior di latte', 'Fresh basil', 'EVO oil', '48h dough'],
    allergens: ['gluten', 'milk'], image: 'margherita', tags: ['bestseller', 'vegetarian'],
    note: 'The 1889 original. Soft, airy cornicione blistered at 485 °C in 90 seconds.',
  },
  {
    id: 'diavola', name: 'Diavola', category: 'pizzas', price: 12,
    description: 'Spicy Calabrian salami, fior di latte, tomato sauce and a drizzle of chilli oil.',
    ingredients: ['Spicy salami', 'Fior di latte', 'Tomato sauce', 'Chilli oil', 'Basil'],
    allergens: ['gluten', 'milk'], image: 'hero-pizza', tags: ['spicy', 'bestseller'],
    note: 'Fiery, smoky and generous — our most ordered pizza after dark.',
  },
  {
    id: 'quattro-formaggi', name: 'Quattro Formaggi', category: 'pizzas', price: 13,
    description: 'Four-cheese blend: fior di latte, gorgonzola, Parmigiano Reggiano and smoked provola.',
    ingredients: ['Fior di latte', 'Gorgonzola DOP', 'Parmigiano Reggiano', 'Smoked provola'],
    allergens: ['gluten', 'milk'], image: 'formaggi', tags: ['vegetarian'],
    note: 'Rich, nutty and melting — a white pizza for true cheese lovers.',
  },
  {
    id: 'napoli-special', name: 'Napoli Special', category: 'pizzas', price: 15.5,
    description: 'Our signature: slow-cooked tomato, creamy burrata added after baking, basil, Sicilian oregano.',
    ingredients: ['Burrata', 'Slow-cooked tomato', 'Basil', 'Sicilian oregano', 'EVO oil'],
    allergens: ['gluten', 'milk'], image: 'napoli', tags: ['signature', 'vegetarian'],
    note: 'Cold, creamy burrata on a blazing-hot base. Eat it in the first five minutes.',
  },
  {
    id: 'ortolana', name: 'Ortolana', category: 'pizzas', price: 11.5,
    description: 'Roasted peppers, Gaeta olives, cherry tomatoes, mozzarella and oregano.',
    ingredients: ['Roasted peppers', 'Gaeta olives', 'Cherry tomatoes', 'Mozzarella', 'Oregano'],
    allergens: ['gluten', 'milk'], image: 'ortolana', tags: ['vegetarian'],
  },

  // ── BURGERS ───────────────────────────────────────────────
  {
    id: 'classic-smash', name: 'Classic Smash', category: 'burgers', price: 12.9,
    description: 'Double smashed beef, melted cheddar, pickles and our signature NAPOLI sauce on a brioche bun.',
    ingredients: ['2 × 80 g smashed beef', 'Aged cheddar', 'Pickles', 'Signature sauce', 'Brioche bun'],
    allergens: ['gluten', 'milk', 'eggs', 'mustard', 'sesame'], image: 'hero-burger', tags: ['bestseller'],
    note: 'Crispy lace edges, juicy centre. Smashed to order on a 250 °C plancha.',
  },
  {
    id: 'napoli-burger', name: 'Napoli Burger', category: 'burgers', price: 14.5,
    description: 'Premium beef, fior di latte mozzarella, beef tomato, rocket and basil-pesto mayo.',
    ingredients: ['180 g beef', 'Fior di latte', 'Beef tomato', 'Rocket', 'Basil mayo'],
    allergens: ['gluten', 'milk', 'eggs', 'nuts'], image: 'napoli-burger', tags: ['signature'],
    note: 'Where Naples meets the grill — a margherita in burger form.',
  },
  {
    id: 'crispy-chicken', name: 'Crispy Chicken', category: 'burgers', price: 12.5,
    description: 'Buttermilk-fried chicken thigh, crunchy slaw, lettuce and creamy garlic sauce.',
    ingredients: ['Buttermilk chicken', 'Red cabbage slaw', 'Lettuce', 'Garlic cream', 'Potato bun'],
    allergens: ['gluten', 'milk', 'eggs', 'mustard'], image: 'chicken', tags: ['new'],
  },
  {
    id: 'double-cheese', name: 'Double Cheese', category: 'burgers', price: 15.9,
    description: 'Double beef, double cheese, caramelised onions and pickles. Unapologetically big.',
    ingredients: ['2 × 120 g beef', 'Double cheddar', 'Caramelised onions', 'Pickles', 'Brioche bun'],
    allergens: ['gluten', 'milk', 'eggs', 'mustard', 'sesame'], image: 'double-cheese', tags: ['bestseller'],
  },

  // ── SIDES ─────────────────────────────────────────────────
  {
    id: 'fries', name: 'Golden Fries', category: 'sides', price: 4.5,
    description: 'Hand-cut, twice-fried, finished with sea salt and rosemary.',
    ingredients: ['Potatoes', 'Sea salt', 'Rosemary'], allergens: [], image: 'fries', tags: ['vegetarian'],
  },
  {
    id: 'onion-rings', name: 'Onion Rings', category: 'sides', price: 5.5,
    description: 'Beer-battered onion rings with smoky paprika dip.',
    ingredients: ['Onion', 'Beer batter', 'Paprika dip'], allergens: ['gluten', 'eggs'], image: 'onion-rings', tags: ['vegetarian'],
  },
  {
    id: 'caprese', name: 'Caprese', category: 'sides', price: 8.5,
    description: 'Ripe tomatoes, fior di latte, basil, olives and aged balsamic.',
    ingredients: ['Tomatoes', 'Fior di latte', 'Basil', 'Olives', 'Balsamic'], allergens: ['milk', 'sulphites'],
    image: 'caprese', tags: ['vegetarian'],
  },

  // ── DRINKS ────────────────────────────────────────────────
  {
    id: 'lemonade', name: 'Amalfi Lemonade', category: 'drinks', price: 4,
    description: 'Freshly squeezed Amalfi lemons, cane sugar and sparkling water. 400 ml.',
    ingredients: ['Amalfi lemons', 'Cane sugar', 'Sparkling water'], allergens: [], image: 'lemonade', tags: ['new'],
  },
  {
    id: 'cola', name: 'Cola on Ice', category: 'drinks', price: 3.5,
    description: 'Classic cola served ice-cold with a slice of lime. 330 ml.',
    ingredients: ['Cola', 'Ice', 'Lime'], allergens: [], image: 'cola',
  },

  // ── DESSERTS ──────────────────────────────────────────────
  {
    id: 'tiramisu', name: 'Tiramisù', category: 'desserts', price: 6.5,
    description: 'Mascarpone cream, espresso-soaked savoiardi and cocoa. Made every morning.',
    ingredients: ['Mascarpone', 'Espresso', 'Savoiardi', 'Cocoa'], allergens: ['gluten', 'milk', 'eggs'],
    image: 'tiramisu', tags: ['bestseller', 'vegetarian'],
  },
  {
    id: 'lava-cake', name: 'Molten Chocolate Cake', category: 'desserts', price: 7,
    description: 'Warm dark-chocolate cake with a salted-caramel heart.',
    ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Salted caramel'], allergens: ['gluten', 'milk', 'eggs'],
    image: 'lava-cake', tags: ['vegetarian'],
  },
  {
    id: 'limoncello-cup', name: 'Limoncello Cream Cup', category: 'desserts', price: 6,
    description: 'Layers of limoncello cream, sponge and crumble, served chilled.',
    ingredients: ['Limoncello cream', 'Sponge', 'Butter crumble'], allergens: ['gluten', 'milk', 'eggs'],
    image: 'gelato', tags: ['new', 'vegetarian'],
  },
]

export const productById = new Map(products.map((p) => [p.id, p]))
