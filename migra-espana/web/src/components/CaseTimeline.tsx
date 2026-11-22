import { CASE_STATUSES, type CaseStatus } from '@/lib/case/progress';

/** Main-line statuses shown in order; branch statuses (refused/appeal) are appended only when reached. */
const MAIN: CaseStatus[] = ['new_case', 'initial_assessment', 'waiting_for_documents', 'documents_received', 'lawyer_review', 'application_preparation', 'ready_for_submission', 'submitted', 'under_administrative_review', 'decision_issued', 'approved', 'completed'];

export function CaseTimeline({ status, t }: { status: CaseStatus; t: (k: string) => string }) {
  const branch: CaseStatus[] = ['additional_documents_requested', 'refused', 'appeal_in_progress'];
  const list = branch.includes(status) ? [...MAIN.slice(0, MAIN.indexOf('decision_issued') + 1), status] : MAIN;
  const idx = list.indexOf(status);
  const known = (CASE_STATUSES as readonly string[]).includes(status);
  return (
    <ol className="timeline" aria-label="timeline">
      {list.map((s, i) => (<li key={s} className={known && i < idx ? 'done' : i === idx ? 'current' : ''} aria-current={i === idx ? 'step' : undefined}>{t(`case.status.${s}`)}</li>))}
    </ol>
  );
}
