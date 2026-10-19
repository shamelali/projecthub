/**
 * Slug helpers shared by every project-creation path (manual form, GitHub
 * import, local-folder import). `Project.slug` is globally unique, so callers
 * that take a user-supplied name must go through `uniqueSlug` rather than
 * slugifying on their own.
 */

import { db } from '@/lib/db';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Generate a globally unique slug. (`slug` is globally unique on Project.) */
export async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || 'project';
  let slug = root;
  let attempt = 0;
  while (await db.project.findFirst({ where: { slug } })) {
    attempt += 1;
    slug = `${root}-${attempt}`;
  }
  return slug;
}
