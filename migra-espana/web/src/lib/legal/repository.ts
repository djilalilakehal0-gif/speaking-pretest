import { PATHWAYS } from './pathways';
import { SOURCES } from './sources';
import type { Pathway } from './types';

/**
 * Seed content is DRAFT until a legal editor publishes through the admin workflow, which writes `legal_rules`
 * (state = published, last_verified_on, reviewed_by). When Supabase is configured and has published rows,
 * those win; otherwise the code-level seed is shown with a visible draft banner.
 */
export async function loadPathways(): Promise<{ pathways: Pathway[]; origin: 'database' | 'seed' }> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { adminClient } = await import('@/lib/supabase/admin');
      const { data } = await adminClient()
        .from('legal_rules')
        .select('body, immigration_categories(slug)')
        .eq('state', 'published');
      const rows = (data ?? []).map((r: { body: Pathway }) => r.body).filter(Boolean);
      if (rows.length > 0) return { pathways: rows, origin: 'database' };
    } catch { /* fall through to seed */ }
  }
  return { pathways: PATHWAYS, origin: 'seed' };
}

export const sourcesFor = (ids: string[]) => SOURCES.filter((s) => ids.includes(s.id));
