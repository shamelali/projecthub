import { describe, expect, it } from 'vitest';

import { suggestNextStep } from '@/lib/suggest-next-step';

// Pin the clock: 2026-10-17T12:00:00Z.
const NOW = new Date('2026-10-17T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 3600 * 1000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 24 * 3600 * 1000);

const base = {
  title: 'A task',
  priority: 'MEDIUM',
  createdAt: daysAgo(3),
};

describe('suggestNextStep', () => {
  it('puts blocked tasks first, even when overdue and high-priority', () => {
    const result = suggestNextStep(
      {
        ...base,
        status: 'BLOCKED',
        priority: 'CRITICAL',
        dueDate: daysAgo(5),
      },
      NOW
    );
    expect(result.headline).toBe('Unblock it first');
  });

  it('advises verifying commit-sourced tasks rather than starting them', () => {
    const result = suggestNextStep(
      {
        ...base,
        status: 'TODO',
        tags: ['source:commit:abc123def456', 'author:Alice'],
      },
      NOW
    );
    expect(result.headline).toBe('Verify and mark done');
    expect(result.relatedSha).toBe('abc123def456');
    // Provenance outranks due-date advice even when overdue.
    const overdue = suggestNextStep(
      { ...base, status: 'TODO', tags: ['source:commit:abc123'], dueDate: daysAgo(4) },
      NOW
    );
    expect(overdue.headline).toBe('Verify and mark done');
  });

  it('points branch-sourced tasks at review', () => {
    const result = suggestNextStep(
      { ...base, status: 'TODO', tags: ['source:branch:feature/login'] },
      NOW
    );
    expect(result.headline).toBe('Review the branch');
    expect(result.relatedBranch).toBe('feature/login');
  });

  it('advises chasing reviews for IN_REVIEW tasks', () => {
    const result = suggestNextStep({ ...base, status: 'IN_REVIEW' }, NOW);
    expect(result.headline).toBe('Chase the review');
  });

  it('flags overdue tasks with the day count', () => {
    const result = suggestNextStep({ ...base, status: 'TODO', dueDate: daysAgo(3) }, NOW);
    expect(result.headline).toBe('Reschedule or start today');
    expect(result.reason).toContain('3 days overdue');
  });

  it('treats tasks due today as overdue-today, not future', () => {
    const result = suggestNextStep(
      { ...base, status: 'TODO', dueDate: new Date(NOW.getTime() - 3600 * 1000) },
      NOW
    );
    expect(result.reason).toContain('due today');
  });

  it('tells completed tasks to stay closed', () => {
    const result = suggestNextStep({ ...base, status: 'DONE' }, NOW);
    expect(result.headline).toBe('Close the loop');
  });

  it('suggests re-scoping tasks stuck in progress for a week or more', () => {
    const fresh = suggestNextStep(
      { ...base, status: 'IN_PROGRESS', startedAt: daysAgo(2) },
      NOW
    );
    expect(fresh.headline).toBe('Keep it moving');

    const stale = suggestNextStep(
      { ...base, status: 'IN_PROGRESS', startedAt: daysAgo(9) },
      NOW
    );
    expect(stale.headline).toBe('Re-scope or park it');
    expect(stale.reason).toContain('9 days');
  });

  it('urges scheduling tasks due within 48 hours that have not started', () => {
    const result = suggestNextStep({ ...base, status: 'TODO', dueDate: daysAhead(1) }, NOW);
    expect(result.headline).toBe('Schedule it now');
    expect(result.reason).toContain('tomorrow');
  });

  it('prioritises starting high-priority TODO tasks', () => {
    const result = suggestNextStep({ ...base, status: 'TODO', priority: 'CRITICAL' }, NOW);
    expect(result.headline).toBe('Start it today');
  });

  it('promotes high-priority backlog tasks out of the backlog', () => {
    const result = suggestNextStep({ ...base, status: 'BACKLOG', priority: 'HIGH' }, NOW);
    expect(result.headline).toBe('Promote it to TODO');
  });

  it('falls back to generic advice for unowned backlog tasks', () => {
    const result = suggestNextStep({ ...base, status: 'BACKLOG' }, NOW);
    expect(result.headline).toBe('Triage it');
  });

  it('appends owner guidance when no one is assigned', () => {
    const assigned = suggestNextStep(
      { ...base, status: 'TODO', assignee: { name: 'Alice' } },
      NOW
    );
    expect(assigned.reason).not.toContain('No owner');

    const unassigned = suggestNextStep({ ...base, status: 'TODO' }, NOW);
    expect(unassigned.reason).toContain('No owner is assigned yet');
  });

  it('never appends owner guidance to done or blocked tasks', () => {
    for (const status of ['DONE', 'BLOCKED']) {
      const result = suggestNextStep({ ...base, status }, NOW);
      expect(result.reason).not.toContain('No owner');
    }
  });

  it('tolerates missing dates and tags', () => {
    const result = suggestNextStep(
      { title: 'X', status: 'TODO', priority: 'LOW', dueDate: null, startedAt: null, createdAt: null },
      NOW
    );
    expect(result.headline).toBe('Move it to In Progress');
    // createdAt falling back to `now` should not read "queued for 0 days".
    expect(result.reason).not.toMatch(/0 days/);
  });
});