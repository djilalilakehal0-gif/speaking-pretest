const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
export const euro = (n: number) => eur.format(n)
/** Round to cents to avoid floating-point drift in totals. */
export const cents = (n: number) => Math.round(n * 100) / 100
