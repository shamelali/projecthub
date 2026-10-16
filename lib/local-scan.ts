/**
 * The project scanner reads the local filesystem (`fs.readdirSync`) and shells
 * out to the `git` binary via `simple-git`. Neither exists on serverless
 * runtimes like Vercel, where the scanner can only ever return an empty result.
 *
 * It stays enabled locally, where it is genuinely useful for discovering
 * projects on disk. Set `ENABLE_LOCAL_SCAN=true` to use it; it defaults to
 * disabled everywhere else so production never exposes a dead route.
 */
export function isLocalScanEnabled(): boolean {
  return process.env.ENABLE_LOCAL_SCAN === 'true';
}
