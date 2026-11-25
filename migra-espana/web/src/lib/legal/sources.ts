import type { LegalSource } from './types';

/**
 * Official sources. `lastVerifiedOn` is only set when a human compared the page with the content shown.
 * Link health is re-tested by `npm run check:links` (scripts/check-links.mjs) before each release.
 */
export const SOURCES: LegalSource[] = [
  { id: 'boe-rd-1155-2024', title: 'Real Decreto 1155/2024, de 19 de noviembre, por el que se aprueba el Reglamento de la Ley Orgánica 4/2000',
    issuer: 'BOE', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099', reference: 'BOE-A-2024-24099',
    publishedOn: '2024-11-20', effectiveOn: '2025-05-20', lastVerifiedOn: '2026-11-22' },
  { id: 'boe-rd-316-2026', title: 'Real Decreto 316/2026, de 14 de abril, que modifica el Real Decreto 1155/2024',
    issuer: 'BOE', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099', reference: 'RD 316/2026 (BOE 15-04-2026)',
    publishedOn: '2026-04-15', effectiveOn: '2026-04-16', lastVerifiedOn: '2026-11-22' },
  { id: 'lo-4-2000', title: 'Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros en España y su integración social',
    issuer: 'BOE', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-544', reference: 'LO 4/2000' },
  { id: 'ley-12-2009', title: 'Ley 12/2009, reguladora del derecho de asilo y de la protección subsidiaria',
    issuer: 'BOE', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2009-17242', reference: 'Ley 12/2009' },
  { id: 'portal-inmigracion', title: 'Portal de Inmigración — Secretaría de Estado de Migraciones',
    issuer: 'Ministerio de Inclusión, Seguridad Social y Migraciones', url: 'https://extranjeros.inclusion.gob.es' },
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);

/** Official resources directory (spec §19). Verified status comes from the link checker, never hard-coded. */
export const RESOURCES: { key: string; name: string; url: string; kind: string }[] = [
  { key: 'boe', name: 'BOE — Boletín Oficial del Estado', url: 'https://www.boe.es', kind: 'legislation' },
  { key: 'inclusion', name: 'Ministerio de Inclusión, Seguridad Social y Migraciones', url: 'https://www.inclusion.gob.es', kind: 'ministry' },
  { key: 'portal', name: 'Portal de Inmigración', url: 'https://extranjeros.inclusion.gob.es', kind: 'portal' },
  { key: 'sede', name: 'Sede Electrónica de las Administraciones Públicas', url: 'https://sede.administracionespublicas.gob.es', kind: 'sede' },
  { key: 'interior', name: 'Ministerio del Interior', url: 'https://www.interior.gob.es', kind: 'ministry' },
  { key: 'policia', name: 'Policía Nacional', url: 'https://www.policia.es', kind: 'police' },
  { key: 'justicia', name: 'Ministerio de Justicia', url: 'https://www.mjusticia.gob.es', kind: 'ministry' },
  { key: 'exteriores', name: 'Ministerio de Asuntos Exteriores — servicios consulares', url: 'https://www.exteriores.gob.es', kind: 'consular' },
  { key: 'censo', name: 'Censo de Letrados — Abogacía Española (check any lawyer before hiring)', url: 'https://www.abogacia.es/servicios-abogacia/censo-de-letrados/', kind: 'verification' },
  { key: 'aeat', name: 'Agencia Tributaria', url: 'https://sede.agenciatributaria.gob.es', kind: 'tax' },
];
