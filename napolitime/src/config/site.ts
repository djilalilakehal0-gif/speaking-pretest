/**
 * Restaurant settings. Everything a restaurant owner normally changes lives here.
 *
 * DEMO CONTENT: the address, phone, e-mail and social handles below are placeholders.
 * `isDemo` keeps a visible "demo content" notice in the footer until real details are set.
 */
export const site = {
  isDemo: true,

  name: 'NAPOLITIME',
  tagline: 'Taste the Moment.',

  contact: {
    phoneDisplay: '+39 081 000 0000',
    phoneHref: 'tel:+390810000000',
    email: 'ciao@napolitime.example',
    street: 'Via dei Tribunali 00',
    city: '80138 Napoli, Italia',
    /** Opens a map search for the address; replace with your Google Maps place link. */
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Via+dei+Tribunali+Napoli',
    mapEmbed: 'https://www.openstreetmap.org/export/embed.html?bbox=14.2525%2C40.8495%2C14.2625%2C40.8545&layer=mapnik&marker=40.852%2C14.2575',
  },

  socials: [
    { id: 'instagram', label: 'Instagram', handle: '@napolitime', href: 'https://www.instagram.com/' },
    { id: 'tiktok', label: 'TikTok', handle: '@napolitime', href: 'https://www.tiktok.com/' },
    { id: 'facebook', label: 'Facebook', handle: 'NAPOLITIME', href: 'https://www.facebook.com/' },
  ],

  /** Opening hours, 0 = Sunday. Times are local restaurant time (24h). `null` = closed. */
  hours: [
    { day: 0, label: 'Sunday', open: '12:00', close: '23:00' },
    { day: 1, label: 'Monday', open: null, close: null },
    { day: 2, label: 'Tuesday', open: '18:00', close: '23:00' },
    { day: 3, label: 'Wednesday', open: '18:00', close: '23:00' },
    { day: 4, label: 'Thursday', open: '18:00', close: '23:30' },
    { day: 5, label: 'Friday', open: '12:00', close: '00:30' },
    { day: 6, label: 'Saturday', open: '12:00', close: '00:30' },
  ] as { day: number; label: string; open: string | null; close: string | null }[],
  timeZone: 'Europe/Rome',

  ordering: {
    deliveryFee: 2.5,
    freeDeliveryFrom: 30,
    minimumDeliveryOrder: 15,
    estimatedDeliveryMinutes: '30–45',
    estimatedPickupMinutes: '15–20',
    /** Shown at checkout. No online payment is taken by this site. */
    paymentNote: 'Pay by card or cash when you receive your order.',
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
