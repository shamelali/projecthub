import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  // Auth is self-hosted Better Auth running inside this Next.js app, storing
  // users and sessions in this database. Neon Managed Auth is intentionally
  // off: its SDK requires Next >= 16.
  auth: false,
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: '7d' };
    }
    // Existing branch: no changes
    return {};
  },
});
