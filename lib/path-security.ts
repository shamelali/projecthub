import { isAbsolute, relative, resolve } from "path";

export function isPathWithinConfiguredPath(
  candidatePath: string,
  configuredPaths: string[]
): boolean {
  const candidate = resolve(candidatePath);

  return configuredPaths.some((configuredPath) => {
    const root = resolve(configuredPath);
    const relativePath = relative(root, candidate);

    return (
      relativePath === "" ||
      (!relativePath.startsWith("..") && !isAbsolute(relativePath))
    );
  });
}
