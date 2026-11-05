/**
 * Restaurant settings. Everything a restaurant owner normally changes lives here.
 *
 * Le téléphone vient de la devanture du restaurant. L'adresse, l'e-mail, les réseaux sociaux et
 * les horaires sont encore des exemples : `isDemo` affiche un avertissement en pied de page
 * tant qu'ils ne sont pas remplacés.
 */
export const site = {
  isDemo: true,

  name: 'NAPOLITIME',
  tagline: 'The Taste of Excellence',

  contact: {
    phoneDisplay: '09 55 91 40 84',
    phoneHref: 'tel:+33955914084',
    email: 'contact@napolitime.example',
    street: 'Adresse à compléter',
    city: 'France',
    /** Opens a map search for the address; replace with your Google Maps place link. */
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=NAPOLITIME',
  },

  socials: [
    { id: 'instagram', label: 'Instagram', handle: '@napolitime', href: 'https://www.instagram.com/' },
    { id: 'tiktok', label: 'TikTok', handle: '@napolitime', href: 'https://www.tiktok.com/' },
    { id: 'facebook', label: 'Facebook', handle: 'NAPOLITIME', href: 'https://www.facebook.com/' },
  ],

  /** Opening hours, 0 = Sunday. Times are local restaurant time (24h). `null` = closed. */
  hours: [
    { day: 0, label: 'Dimanche', open: '12:00', close: '23:00' },
    { day: 1, label: 'Lundi', open: null, close: null },
    { day: 2, label: 'Mardi', open: '18:00', close: '23:00' },
    { day: 3, label: 'Mercredi', open: '18:00', close: '23:00' },
    { day: 4, label: 'Jeudi', open: '18:00', close: '23:30' },
    { day: 5, label: 'Vendredi', open: '12:00', close: '00:30' },
    { day: 6, label: 'Samedi', open: '12:00', close: '00:30' },
  ] as { day: number; label: string; open: string | null; close: string | null }[],
  timeZone: 'Europe/Paris',

  ordering: {
    deliveryFee: 2.5,
    freeDeliveryFrom: 30,
    minimumDeliveryOrder: 15,
    estimatedDeliveryMinutes: '30–45',
    estimatedPickupMinutes: '15–20',
    /** Shown at checkout. No online payment is taken by this site. */
    paymentNote: 'Paiement par carte ou en espèces à la réception.',
  },

  /**
   * Integrations. Set these at build time (see .env.example). When empty, the site never
   * pretends: checkout hands the order to the restaurant by phone/e-mail instead.
   */
  integrations: {
    orderEndpoint: (import.meta.env.VITE_ORDER_ENDPOINT as string | undefined)?.trim() || '',
    newsletterEndpoint: (import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined)?.trim() || '',
  },
} as const

export type Site = typeof site
