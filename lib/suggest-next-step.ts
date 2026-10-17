/**
 * Heuristic "best next step" engine for tasks.
 *
 * Deterministic and dependency-free: it derives one suggestion from task
 * metadata (status, priority, due date, provenance tags, age). Rules are
 * evaluated first-match-wins, ordered by specificity — provenance outranks
 * due-date advice (a commit-sourced task that is overdue should be verified
 * and closed, not "started"), and a blocked task must never receive generic
 * "start it" advice.
 *
 * `now` is injectable so callers (and tests) can pin the clock.
 */

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'BLOCKED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskSuggestionInput {
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | string | null;
  startedAt?: Date | string | null;
  createdAt?: Date | string | null;
  tags?: string[];
  assignee?: { name?: string | null } | null;
}

export interface NextStepSuggestion {
  /** The recommended action, imperative form. */
  headline: string;
  /** Why this is the next step — cites the concrete evidence. */
  reason: string;
  /** Commit SHA extracted from provenance tags, when present. */
  relatedSha?: string;
  /** Branch name extracted from provenance tags, when present. */
  relatedBranch?: string;
}

const COMMIT_TAG = 'source:commit:';
const BRANCH_TAG = 'source:branch:';
const DAY_MS = 24 * 3600 * 1000;

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

export function suggestNextStep(
  task: TaskSuggestionInput,
  now: Date = new Date()
): NextStepSuggestion {
  const status = task.status as TaskStatus;
  const priority = task.priority as TaskPriority;
  const tags = task.tags ?? [];
  const relatedSha = tags
    .find((tag) => tag.startsWith(COMMIT_TAG))
    ?.slice(COMMIT_TAG.length);
  const relatedBranch = tags
    .find((tag) => tag.startsWith(BRANCH_TAG))
    ?.slice(BRANCH_TAG.length);

  const dueDate = toDate(task.dueDate);
  const startedAt = toDate(task.startedAt);
  const createdAt = toDate(task.createdAt) ?? now;

  const overdueDays = dueDate ? daysBetween(dueDate, now) : null;
  const dueInDays = dueDate ? daysBetween(now, dueDate) : null;
  const staleDays = startedAt ? daysBetween(startedAt, now) : null;

  let suggestion: NextStepSuggestion;

  if (status === 'BLOCKED') {
    suggestion = {
      headline: 'Unblock it first',
      reason:
        'This task is blocked — nothing else on it can progress until the ' +
        'blocker is resolved. Record what is blocking it, or move it back to ' +
        'TODO if the blocker is gone.',
    };
  } else if (relatedSha && (status === 'TODO' || status === 'BACKLOG')) {
    suggestion = {
      headline: 'Verify and mark done',
      reason: `Auto-created from commit ${relatedSha.slice(0, 7)} — the work already happened, so this is most likely finished. Check the commit and close it.`,
      relatedSha,
    };
  } else if (relatedBranch && status !== 'DONE') {
    suggestion = {
      headline: 'Review the branch',
      reason: `Auto-created from branch ${relatedBranch} — open a pull request or merge it to close this out.`,
      relatedBranch,
    };
  } else if (status === 'IN_REVIEW') {
    suggestion = {
      headline: 'Chase the review',
      reason:
        'It is waiting on review — ping the reviewer, or merge it yourself if ' +
        'the change is small and the checks pass.',
    };
  } else if (overdueDays !== null && overdueDays >= 0 && status !== 'DONE') {
    suggestion = {
      headline: 'Reschedule or start today',
      reason: `It is ${overdueDays === 0 ? 'due today' : `${plural(overdueDays, 'day')} overdue`} — push the due date if the estimate was wrong, or start it now.`,
    };
  } else if (status === 'DONE') {
    suggestion = {
      headline: 'Close the loop',
      reason:
        'Completed — nothing is pending. Link any follow-up tasks so the outcome stays traceable.',
    };
  } else if (status === 'IN_PROGRESS' && staleDays !== null && staleDays >= 7) {
    suggestion = {
      headline: 'Re-scope or park it',
      reason: `It has been in progress for ${plural(staleDays, 'day')} — split it into smaller tasks, or move it back to TODO to stop losing it on the board.`,
    };
  } else if (
    dueInDays !== null &&
    dueInDays >= 0 &&
    dueInDays <= 2 &&
    (status === 'BACKLOG' || status === 'TODO')
  ) {
    suggestion = {
      headline: 'Schedule it now',
      reason: `Due ${dueInDays === 0 ? 'today' : dueInDays === 1 ? 'tomorrow' : `in ${plural(dueInDays, 'day')}`} and not started — move it to In Progress before it slips.`,
    };
  } else if (status === 'TODO' && (priority === 'HIGH' || priority === 'CRITICAL')) {
    suggestion = {
      headline: 'Start it today',
      reason: `${priority === 'CRITICAL' ? 'Critical' : 'High'} priority and queued — this should be the next thing picked up, not parked in the column.`,
    };
  } else if (status === 'BACKLOG' && (priority === 'HIGH' || priority === 'CRITICAL')) {
    suggestion = {
      headline: 'Promote it to TODO',
      reason: `${priority === 'CRITICAL' ? 'Critical' : 'High'} priority should not sit in the backlog — promote it so it appears in the working column.`,
    };
  } else if (status === 'IN_PROGRESS') {
    suggestion = {
      headline: 'Keep it moving',
      reason:
        'It is in progress — set a due date if it has none, so it stays visible on the tasks page.',
    };
  } else if (status === 'TODO') {
    const ageDays = daysBetween(createdAt, now);
    suggestion = {
      headline: 'Move it to In Progress',
      reason:
        ageDays > 0
          ? `Queued for ${plural(ageDays, 'day')} — starting it is the next step.`
          : 'Queued and ready — starting it is the next step.',
    };
  } else {
    // BACKLOG and anything unrecognized.
    suggestion = {
      headline: 'Triage it',
      reason:
        'It is in the backlog — give it a priority and a due date, or promote it to TODO if it should be worked soon.',
    };
  }

  // Cross-cutting: an owned task can actually be started by someone.
  if (!task.assignee?.name && status !== 'DONE' && status !== 'BLOCKED') {
    suggestion.reason += ' No owner is assigned yet — pick one.';
  }

  return suggestion;
}