/**
 * CARTE NAPOLITIME — modifiez librement.
 * Prix en euros, exactement comme sur la carte du restaurant.
 * `image` : nom du fichier dans public/menu/ (sans « .webp »). Pour remplacer une photo,
 * déposez simplement un nouveau fichier public/menu/<image>.webp (format carré ou 4:3 conseillé).
 * Sans `image`, la carte affiche un visuel « photo à venir ».
 * `description` : uniquement des informations confirmées par le restaurant.
 * `options` : le client choisit une option (parfum, boisson…) avant d'ajouter au panier.
 */

export type Category = 'burgers' | 'sandwichs' | 'tacos' | 'texmex' | 'enfant' | 'desserts' | 'boissons'

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  image?: string
  description?: string
  options?: string[]
  bestSeller?: boolean
}

export const categories: { id: Category; label: string; labelAr: string }[] = [
  { id: 'burgers', label: 'Burgers', labelAr: 'البرغر' },
  { id: 'sandwichs', label: 'Sandwichs', labelAr: 'الساندويتشات' },
  { id: 'tacos', label: 'Tacos', labelAr: 'التاكوس' },
  { id: 'texmex', label: 'Tex-Mex', labelAr: 'تكس مكس' },
  { id: 'enfant', label: 'Menu Enfant', labelAr: 'وجبة الأطفال' },
  { id: 'desserts', label: 'Desserts', labelAr: 'الحلويات' },
  { id: 'boissons', label: 'Boissons', labelAr: 'المشروبات' },
]

const p = (category: Category, list: Omit<Product, 'category'>[]): Product[] => list.map((x) => ({ ...x, category }))

export const products: Product[] = [
  ...p('burgers', [
    { id: 'cheese', name: 'Cheese', price: 6.5, image: 'cheese' },
    { id: 'double-cheese', name: 'Double Cheese', price: 6.08, image: 'double-cheese' },
    { id: 'chiken', name: 'Chiken', price: 6.08, image: 'chiken' },
    { id: 'big-burger', name: 'Big Burger', price: 6.62, image: 'big-burger' },
    { id: 'americain', name: "L'américain", price: 8.1, image: 'americain' },
    { id: 'h-burger', name: 'H Burger', price: 8.1, image: 'h-burger' },
    { id: 'chiken-meat', name: 'Chiken Meat', price: 8.78, image: 'chiken-meat' },
    { id: 'royal-burger', name: 'Royal Burger', price: 9.45, image: 'royal-burger' },
    { id: 'master-best', name: 'Master Best', price: 10.13, image: 'master-best' },
    { id: 'le-best', name: 'Le Best', price: 10.13, image: 'le-best' },
    { id: 'fish', name: 'Fish', price: 10.13, image: 'fish' },
  ]),
  ...p('sandwichs', [
    { id: 'kebab', name: 'Kebab', price: 10.13, image: 'kebab', bestSeller: true },
    { id: 'buffalo', name: 'Le Buffalo', price: 10.13, image: 'buffalo' },
    { id: 'royal', name: 'Royal', price: 10.13, image: 'royal' },
    { id: 'fermier', name: 'Fermier', price: 10.13, image: 'fermier' },
    { id: 'tandoori', name: 'Tandoori', price: 10.13, image: 'tandoori' },
    { id: '1080', name: '1080', price: 10.13, image: '1080' },
    { id: 'cheka-nos', name: 'Cheka Nos', price: 10.13, image: 'cheka-nos' },
    { id: 'curry', name: 'Curry', price: 10.13, image: 'curry' },
    { id: 'frenchy', name: 'Le Frenchy', price: 10.13, image: 'frenchy' },
    { id: 'mixte', name: 'Mixte', price: 10.13, image: 'mixte' },
    { id: '180', name: '180', price: 11.13, image: '180' },
    { id: 'triple-x', name: 'Triple X', price: 11.5, image: 'triple-x' },
  ]),
  ...p('tacos', [
    { id: 'tacos-1', name: 'Tacos 1 Viande', price: 8.1, image: 'tacos-1' },
    { id: 'tacos-2', name: 'Tacos 2 Viandes', price: 10.8, image: 'tacos-2' },
    { id: 'tacos-3', name: 'Tacos 3 Viandes', price: 12.15, image: 'tacos-3' },
  ]),
  ...p('texmex', [
    { id: 'tenders', name: 'Tenders', price: 6.08, image: 'tenders' },
    { id: 'nuggets', name: 'Nuggets', price: 6.08, image: 'nuggets' },
    { id: 'wings', name: 'Wings', price: 6.08, image: 'wings' },
    { id: 'onion-rings', name: 'Oignons Rings', price: 6.08, image: 'onion-rings' },
    { id: 'mozza-sticks', name: 'Mozza Sticks', price: 6.08, image: 'mozza-sticks' },
    { id: 'tex-box-l', name: 'Menu Tex Box L', price: 20.25, image: 'tex-box-l' },
    { id: 'tex-box-xl', name: 'Menu Tex Box XL', price: 37.8, image: 'tex-box-xl' },
  ]),
  ...p('enfant', [
    {
      id: 'menu-enfant', name: 'Menu Enfant', price: 6.08, image: 'menu-enfant',
      description: "Burger ou Nuggets accompagnés de frites et d'un Capri-Sun.",
      options: ['Burger', 'Nuggets'],
    },
  ]),
  ...p('desserts', [
    { id: 'tarte-daim', name: 'Tarte Daim', price: 3.9, image: 'tarte-daim' },
  ]),
  ...p('boissons', [
    { id: 'lassi', name: 'Lassi à la Mangue', price: 4.73, image: 'lassi' },
    { id: 'milkshake', name: 'Milkshake', price: 4.73, image: 'milkshake', options: ['Vanille', 'Oreo', 'Kinder', 'Nutella'] },
    { id: 'milkshake-speculoos', name: 'Milkshake Spéculoos', price: 5.73, image: 'milkshake-speculoos' },
    { id: 'coca', name: 'Coca-Cola', price: 1.75, image: 'coca', options: ['Coca-Cola', 'Coca Zéro', 'Coca Cherry'] },
    { id: 'fanta', name: 'Fanta', price: 1.75, image: 'fanta', options: ['Orange', 'Citron'] },
    { id: 'pepsi', name: 'Pepsi / Ice Tea / Oasis', price: 1.75, image: 'pepsi', options: ['Pepsi', 'Ice Tea', 'Oasis Tropical'] },
    { id: 'schweppes', name: 'Schweppes', price: 1.75, options: ['Agrumes', 'Pomme'] },
    { id: 'perrier', name: 'Perrier', price: 1.75, image: 'perrier' },
    { id: 'eau', name: 'Eau 50 cl', price: 1.35 },
  ]),
]

export const productById = new Map(products.map((x) => [x.id, x]))
