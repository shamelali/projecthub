/**
 * Provenance tags for auto-created tasks.
 *
 * Tasks generated from git data carry `source:commit:<sha>` /
 * `source:branch:<name>` tags so re-population stays idempotent and the
 * suggestion engine can cite the originating commit or branch. The tag format
 * is a stored data contract — every producer and consumer of these tags must
 * go through the helpers here instead of hardcoding the prefixes.
 */

const COMMIT_TAG = 'source:commit:';
const BRANCH_TAG = 'source:branch:';

/** Raw commit-tag prefix — for callers that must slice tags themselves. */
export const COMMIT_TAG_PREFIX = COMMIT_TAG;

export const commitTag = (sha: string) => `${COMMIT_TAG}${sha}`;
export const branchTag = (name: string) => `${BRANCH_TAG}${name}`;

/** All commit SHAs referenced by a list of task tags. */
export function shasFromTags(tags: readonly string[]): string[] {
  return tags.filter((tag) => tag.startsWith(COMMIT_TAG)).map((tag) => tag.slice(COMMIT_TAG.length));
}

/** All branch names referenced by a list of task tags. */
export function branchesFromTags(tags: readonly string[]): string[] {
  return tags
    .filter((tag) => tag.startsWith(BRANCH_TAG))
    .map((tag) => tag.slice(BRANCH_TAG.length));
}

/** First commit SHA in a task's tags, when present. */
export function shaFromTags(tags: readonly string[]): string | undefined {
  return shasFromTags(tags)[0];
}

/** First branch name in a task's tags, when present. */
export function branchFromTags(tags: readonly string[]): string | undefined {
  return branchesFromTags(tags)[0];
}
