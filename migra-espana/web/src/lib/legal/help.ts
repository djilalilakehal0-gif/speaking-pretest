/**
 * Free legal-orientation services (organisations, not individual lawyers).
 * Source: UNHCR Spain, "Asistencia legal" (https://help.unhcr.org/spain/donde-encontrar-ayuda-espana/asistencia-legal/), read 2026-11-25.
 * Numbers are copied from that page only; none are invented. WhatsApp numbers were not published there, so none are listed.
 * Re-check before release (`npm run check:links` covers URLs, not phone numbers).
 */
export interface HelpOrg { id: string; name: string; phone: string; hours?: string; scope: 'asylum' | 'asylum_and_extranjeria'; url?: string }

export const HELP_SOURCE = { title: 'ACNUR (UNHCR) España — Asistencia legal', url: 'https://help.unhcr.org/spain/donde-encontrar-ayuda-espana/asistencia-legal/', checkedOn: '2026-11-25' };

export const HELP_ORGS: HelpOrg[] = [
  { id: 'icam', name: 'Colegio de la Abogacía de Madrid', phone: '900 814 815', hours: 'L–V 9:00–14:00', scope: 'asylum' },
  { id: 'icamalaga', name: 'Colegio de la Abogacía de Málaga (Fuengirola)', phone: '951 017 941', scope: 'asylum' },
  { id: 'saier', name: 'SAIER — Ayuntamiento de Barcelona', phone: '931 53 28 00', scope: 'asylum', url: 'https://ajuntament.barcelona.cat/novaciutadania/es/servicio-de-atencion-inmigrantes-emigrantes-y-refugiados-saier' },
  { id: 'cear', name: 'CEAR — Comisión Española de Ayuda al Refugiado', phone: '91 555 06 98', scope: 'asylum_and_extranjeria', url: 'https://www.cear.es/sections-post/area-juridica-cear/' },
];
