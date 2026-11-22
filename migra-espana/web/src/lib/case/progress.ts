export const CASE_STATUSES = [
  'new_case', 'initial_assessment', 'waiting_for_documents', 'documents_received', 'lawyer_review',
  'application_preparation', 'ready_for_submission', 'submitted', 'under_administrative_review',
  'additional_documents_requested', 'decision_issued', 'approved', 'refused', 'appeal_in_progress', 'completed',
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export interface Task { status: 'todo' | 'in_progress' | 'done' | 'blocked'; weight: number }

/** Progress is derived from completed task weight — never from the status label alone. */
export function progressPercent(tasks: Task[]): number {
  const total = tasks.reduce((s, t) => s + Math.max(0, t.weight), 0);
  if (total === 0) return 0;
  const done = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + t.weight, 0);
  return Math.round((done / total) * 100);
}

/** Allowed transitions. Terminal outcome changes (approved/refused) can only follow decision_issued. */
const NEXT: Record<CaseStatus, CaseStatus[]> = {
  new_case: ['initial_assessment', 'waiting_for_documents'],
  initial_assessment: ['waiting_for_documents', 'lawyer_review'],
  waiting_for_documents: ['documents_received'],
  documents_received: ['lawyer_review', 'application_preparation', 'waiting_for_documents'],
  lawyer_review: ['application_preparation', 'waiting_for_documents'],
  application_preparation: ['ready_for_submission', 'waiting_for_documents'],
  ready_for_submission: ['submitted', 'application_preparation'],
  submitted: ['under_administrative_review', 'additional_documents_requested', 'decision_issued'],
  under_administrative_review: ['additional_documents_requested', 'decision_issued'],
  additional_documents_requested: ['under_administrative_review', 'decision_issued'],
  decision_issued: ['approved', 'refused'],
  approved: ['completed'],
  refused: ['appeal_in_progress', 'completed'],
  appeal_in_progress: ['decision_issued', 'completed'],
  completed: [],
};
export const canTransition = (from: CaseStatus, to: CaseStatus) => NEXT[from]?.includes(to) ?? false;
export const nextStatuses = (from: CaseStatus) => NEXT[from] ?? [];
